import path from 'path';
import fs from 'fs';
import asyncHandler from 'express-async-handler';
import Material from '../models/Material.js';
import Inquiry from '../models/Inquiry.js';
import TraceabilityEvent from '../models/TraceabilityEvent.js';
import { gradeSustainability } from '../utils/mlClient.js';
import { resolveDistrictProvince } from '../utils/sriLanka.js';
import { computeSustainabilityScore } from '../utils/scoring.js';
import { analyzeImagesCombined, guessMimeType } from '../utils/aiCombine.js';
import { UPLOADS_DIR } from '../middleware/upload.js';
import { logTraceabilityEvent } from '../utils/traceability.js';
import { computeScenarioComparison } from '../utils/scenarios.js';

// Same weighting the frontend used for its client-side estimate, kept here
// so every material gets a consistent score regardless of which flow
// created it (quick listing form vs. the full AI upload wizard).
// Shared by createMaterial / updateMaterial / regradeMaterial so all three
// call the ML service the same way and fail the same (non-blocking) way.
async function regradeAndAttach(material) {
  if (!material.aiAnalysis?.fabricType) return false;
  try {
    const gradeResult = await gradeSustainability({
      fabricType: material.aiAnalysis.fabricType,
      weightKg: material.quantity,
      healthScore: material.aiAnalysis.healthScore,
      repairability: material.aiAnalysis.repairability,
      condition: material.condition,
      district: material.district,
      province: material.province,
      industryType: material.industryType,
    });
    material.sustainability = gradeResult;
    return true;
  } catch (err) {
    console.warn('[materials] sustainability grading skipped:', err.message);
    return false;
  }
}

// @route GET /api/materials
// Public marketplace browse. Returns a plain array (not paginated) to match
// the homepage's featured-materials grid.
export const getMaterials = asyncHandler(async (req, res) => {
  const { category, search, status = 'available', limit = 24, district, minPrice, maxPrice } = req.query;

  const filter = {};
  if (status && status !== 'all') filter.status = status;
  if (category && category !== 'All') filter.category = new RegExp(`^${category}$`, 'i');
  if (search) filter.$text = { $search: search };
  if (district && district !== 'All') filter.district = district;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const materials = await Material.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 24, 100))
    .lean();

  res.json(materials);
});

// @route GET /api/materials/:id
export const getMaterialById = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id).lean();
  if (!material) {
    res.status(404);
    throw new Error('Material not found');
  }
  res.json(material);
});

// @route POST /api/materials
// Any authenticated user may create a listing (matches the homepage quick
// form, available to buyers and sellers alike); the full seller upload
// wizard also lands here once AI analysis is complete.
export const createMaterial = asyncHandler(async (req, res) => {
  const {
    title,
    category,
    condition,
    quantity,
    bundles,
    price,
    location,
    description,
    imageUrl,
    images,
    district,
    province,
    industryType,
    fabricType,
    confidence,
    defectArea,
    healthScore,
    repairability,
    remainingLifespan,
  } = req.body;

  if (!title || !category || quantity == null || price == null || !location || !description) {
    res.status(400);
    throw new Error('title, category, quantity, price, location and description are required');
  }

  const resolvedLocation = resolveDistrictProvince(location);

  const material = new Material({
    title,
    category,
    condition: condition || 'Good',
    quantity: Number(quantity),
    bundles: bundles != null ? Number(bundles) : undefined,
    price: Number(price),
    location,
    district: district || resolvedLocation.district,
    province: province || resolvedLocation.province,
    industryType: industryType || req.user.company?.businessType || 'Apparel Manufacturing',
    description,
    imageUrl: imageUrl || '',
    images: Array.isArray(images) ? images : [],
    seller: req.user._id,
    sellerName: req.user.name,
  });

  if (fabricType) {
    material.aiAnalysis = {
      fabricType,
      confidence,
      defectArea,
      healthScore,
      repairability,
      remainingLifespan,
      analyzedAt: new Date(),
    };
    material.sustainabilityScore = computeSustainabilityScore({
      healthScore,
      repairability,
      remainingLifespan,
      defectArea,
    });

    // Best-effort: enrich with a real ML-generated sustainability grade.
    // If the ML service is unreachable this must never block listing
    // creation -- the material is still saved without a grade.
    await regradeAndAttach(material);
  }

  const created = await material.save();

  await logTraceabilityEvent(created._id, 'Listed', req.user._id, { title: created.title });
  if (fabricType) {
    await logTraceabilityEvent(created._id, 'AIAnalyzed', req.user._id, {
      fabricType, healthScore, defectArea,
    });
    if (created.sustainability) {
      await logTraceabilityEvent(created._id, 'SustainabilityGraded', req.user._id, {
        grade: created.sustainability.grade,
      });
    }
  }

  res.status(201).json(created);
});

// @route PUT /api/materials/:id
export const updateMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);

  if (!material) {
    res.status(404);
    throw new Error('Material not found');
  }
  if (material.seller.toString() !== req.user._id.toString() && !['admin', 'super_admin'].includes(req.user.role)) {
    res.status(403);
    throw new Error('Not authorized to update this listing');
  }

  const editable = [
    'title', 'category', 'condition', 'quantity', 'bundles', 'price', 'location',
    'district', 'province', 'industryType', 'description', 'imageUrl', 'images', 'status',
  ];
  const originalStatus = material.status;
  editable.forEach((field) => {
    if (req.body[field] !== undefined) material[field] = req.body[field];
  });

  // `category` doubles as the AI-predicted fabric type on listings created
  // through the upload wizard. If the seller corrects it (e.g. the AI
  // service mislabeled the photo), keep aiAnalysis.fabricType in sync and
  // re-run sustainability grading -- otherwise the CO2/water/energy numbers
  // would silently stay computed against the old, wrong fabric type.
  const fabricTypeChanged =
    req.body.category !== undefined &&
    material.aiAnalysis?.fabricType &&
    req.body.category !== material.aiAnalysis.fabricType;

  if (fabricTypeChanged) {
    material.aiAnalysis.fabricType = req.body.category;
    material.markModified('aiAnalysis');
    await regradeAndAttach(material);
    await logTraceabilityEvent(material._id, 'Regraded', req.user._id, {
      reason: 'fabric type corrected', newFabricType: req.body.category,
    });
  }

  const statusChanged = req.body.status !== undefined && req.body.status !== originalStatus;

  if (req.body.status === 'sold' && material.status === 'sold' && !material.soldAt) {
    material.soldAt = new Date();
  }
  if (req.body.status === 'sold') material.soldAt = material.soldAt || new Date();

  const updated = await material.save();

  if (statusChanged) {
    await logTraceabilityEvent(material._id, 'StatusChanged', req.user._id, { newStatus: updated.status });
    if (updated.status === 'sold') {
      await logTraceabilityEvent(material._id, 'Sold', req.user._id, { soldAt: updated.soldAt });
    }
  }

  res.json(updated);
});

// @route POST /api/materials/:id/regrade
// Re-runs sustainability grading against the ML service for a listing that
// already exists, using its currently-stored AI analysis and details.
// Useful whenever the ml-service's grading logic or model files change --
// existing listings keep whatever grade was computed when they were
// created/last edited until this is called; it isn't automatic.
export const regradeMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);

  if (!material) {
    res.status(404);
    throw new Error('Material not found');
  }
  if (material.seller.toString() !== req.user._id.toString() && !['admin', 'super_admin'].includes(req.user.role)) {
    res.status(403);
    throw new Error('Not authorized to update this listing');
  }
  if (!material.aiAnalysis?.fabricType) {
    res.status(400);
    throw new Error('This listing has no AI analysis to grade against');
  }

  const success = await regradeAndAttach(material);
  if (!success) {
    res.status(502);
    throw new Error('Sustainability grading service unavailable. Please try again shortly.');
  }

  const updated = await material.save();
  await logTraceabilityEvent(material._id, 'Regraded', req.user._id, { grade: updated.sustainability?.grade });
  res.json(updated);
});

// @route POST /api/materials/:id/reanalyze
// Re-runs the AI fabric/defect analysis (not just sustainability grading)
// using this listing's stored photos, then re-runs sustainability grading
// against the fresh results. Unlike regrade, this closes a real gap:
// aiAnalysis is only ever computed once at publish time, so a listing
// created before a fabric/defect model improvement stays stuck with the
// old numbers forever unless this is called. Requires the listing to have
// stored image URLs (material.images) - older listings published before
// this endpoint existed may not have any, since the upload wizard didn't
// used to pass image URLs through to material creation.
export const reanalyzeMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);

  if (!material) {
    res.status(404);
    throw new Error('Material not found');
  }
  if (material.seller.toString() !== req.user._id.toString() && !['admin', 'super_admin'].includes(req.user.role)) {
    res.status(403);
    throw new Error('Not authorized to update this listing');
  }
  if (!material.images || material.images.length === 0) {
    res.status(400);
    throw new Error(
      'This listing has no stored photos to re-analyze. This is a known gap for listings ' +
      'published before photo-tracking was added - re-upload the item to get a fresh AI analysis.'
    );
  }

  const files = material.images
    .map((url) => {
      const filePath = path.join(UPLOADS_DIR, path.basename(url));
      return { path: filePath, mimetype: guessMimeType(filePath) };
    })
    .filter((f) => fs.existsSync(f.path));

  if (files.length === 0) {
    res.status(400);
    throw new Error(
      "This listing's stored photos could not be found on disk (they may have been cleared). " +
      'Re-upload the item to get a fresh AI analysis.'
    );
  }

  const combined = await analyzeImagesCombined(files);
  if (!combined) {
    res.status(502);
    throw new Error('AI analysis service is unreachable. Make sure the ml-service (Python/FastAPI) is running.');
  }

  material.aiAnalysis = { ...combined, analyzedAt: new Date() };
  material.markModified('aiAnalysis');
  material.sustainabilityScore = computeSustainabilityScore(combined);

  // Fresh health/defect numbers make the old sustainability grade stale too.
  await regradeAndAttach(material);

  const updated = await material.save();
  await logTraceabilityEvent(material._id, 'Reanalyzed', req.user._id, {
    fabricType: combined.fabricType, healthScore: combined.healthScore,
  });
  res.json(updated);
});

// @route GET /api/materials/:id/traceability
// Returns the full auto-logged event history for a listing (FR-15). No
// separate manual-entry system exists - events are logged automatically
// at the points in this controller where they actually happen, so the
// timeline can never drift from what really occurred.
export const getMaterialTraceability = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id).select('_id').lean();
  if (!material) {
    res.status(404);
    throw new Error('Material not found');
  }

  const events = await TraceabilityEvent.find({ material: material._id })
    .sort({ createdAt: 1 })
    .populate('actor', 'name')
    .lean();

  res.json({ materialId: material._id, events });
});

// @route GET /api/materials/:id/scenarios
// Reuse/recycle/discard circular-action comparison (FR-07). Derived from
// the listing's existing sustainability grade - see utils/scenarios.js
// for the documented assumptions behind each scenario's numbers.
export const getMaterialScenarios = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id).lean();
  if (!material) {
    res.status(404);
    throw new Error('Material not found');
  }

  const comparison = computeScenarioComparison(material);
  if (!comparison) {
    res.status(400);
    throw new Error('This listing has no sustainability grade yet to base a scenario comparison on');
  }

  res.json(comparison);
});
export const deleteMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);

  if (!material) {
    res.status(404);
    throw new Error('Material not found');
  }
  if (material.seller.toString() !== req.user._id.toString() && !['admin', 'super_admin'].includes(req.user.role)) {
    res.status(403);
    throw new Error('Not authorized to delete this listing');
  }

  await material.deleteOne();
  res.json({ message: 'Listing removed', _id: req.params.id });
});

// @route POST /api/materials/:id/inquire
// Replaces the frontend's simulated "inquiry" toast with a real record the
// seller can eventually be notified about / respond to.
export const inquireAboutMaterial = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    res.status(400);
    throw new Error('Please include a message for the seller');
  }

  const material = await Material.findById(req.params.id);
  if (!material) {
    res.status(404);
    throw new Error('Material not found');
  }

  const inquiry = await Inquiry.create({
    material: material._id,
    seller: material.seller,
    buyer: req.user._id,
    message: message.trim(),
  });

  res.status(201).json({
    message: `Inquiry submitted successfully! ${material.sellerName} will contact you at ${req.user.email}.`,
    inquiry,
  });
});

// @route GET /api/materials/my-inquiries
// A buyer's own inquiry history - powers "My Inquiries" on the buyer
// dashboard, distinct from admin's getAllInquiries (every inquiry in the
// system) and a seller's inbound inquiries (not built here - out of scope
// for this pass, sellers currently see interest via the Inquiry documents
// directly if needed).
export const getMyInquiries = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));

  const filter = { buyer: req.user._id };
  const [inquiries, total] = await Promise.all([
    Inquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('material', 'title imageUrl price status quantity category')
      .populate('seller', 'name email')
      .lean(),
    Inquiry.countDocuments(filter),
  ]);

  res.json({ inquiries, page: pageNum, pages: Math.max(1, Math.ceil(total / limitNum)), total });
});
