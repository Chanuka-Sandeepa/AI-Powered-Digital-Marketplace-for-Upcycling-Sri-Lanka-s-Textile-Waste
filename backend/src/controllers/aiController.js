import path from 'path';
import asyncHandler from 'express-async-handler';
import Analysis from '../models/Analysis.js';
import { gradeSustainability } from '../utils/mlClient.js';
import { analyzeImagesCombined } from '../utils/aiCombine.js';

// @route POST /api/ai/analyze
// Accepts one or more images (field name "images"), runs each through the
// ML service, and returns a single combined result plus the URLs the
// images were saved under (so the frontend can later attach them to a
// published listing, enabling "re-run AI analysis" on that listing).
// Every uploaded image is also saved as an Analysis record for the
// seller's history page.
export const analyzeTextileWaste = asyncHandler(async (req, res) => {
  const files = req.files;

  if (!files || files.length === 0) {
    res.status(400);
    throw new Error('At least one image is required');
  }

  const combined = await analyzeImagesCombined(files);

  if (!combined) {
    res.status(502);
    throw new Error(
      'AI analysis service is unreachable. Make sure the ml-service (Python/FastAPI) is running.'
    );
  }

  const imageUrls = files.map((f) => `/uploads/${path.basename(f.path)}`);

  await Analysis.create({
    seller: req.user._id,
    images: imageUrls,
    ...combined,
  });

  res.json({ ...combined, images: imageUrls });
});

// @route GET /api/ai/history?dateFilter=week|month|year
export const getAnalysisHistory = asyncHandler(async (req, res) => {
  const { dateFilter } = req.query;
  const filter = { seller: req.user._id };

  if (dateFilter && dateFilter !== 'all') {
    const days = { week: 7, month: 30, year: 365 }[dateFilter];
    if (days) {
      const since = new Date();
      since.setDate(since.getDate() - days);
      filter.analyzedAt = { $gte: since };
    }
  }

  const analyses = await Analysis.find(filter).sort({ analyzedAt: -1 }).limit(100).lean();

  res.json({
    analyses: analyses.map((a) => ({
      _id: a._id,
      fabricType: a.fabricType,
      confidence: a.confidence,
      defectArea: a.defectArea,
      healthScore: a.healthScore,
      repairability: a.repairability,
      remainingLifespan: a.remainingLifespan,
      analyzedAt: a.analyzedAt,
      images: a.images,
      materialId: a.material,
    })),
    total: analyses.length,
  });
});

// @route POST /api/ai/grade
// Runs the real ML sustainability grading pipeline (the same XGBoost
// regressor + classifier used at publish time) WITHOUT creating a listing,
// so the seller can see the actual grade + environmental impact numbers
// while still on the "Review Results" step, before publishing anything.
export const previewGrade = asyncHandler(async (req, res) => {
  const {
    fabricType, weightKg, healthScore, repairability,
    condition, district, province, industryType,
  } = req.body;

  if (!fabricType || weightKg == null || healthScore == null || !repairability) {
    res.status(400);
    throw new Error('fabricType, weightKg, healthScore and repairability are required');
  }

  try {
    const result = await gradeSustainability({
      fabricType,
      weightKg: Number(weightKg),
      healthScore: Number(healthScore),
      repairability,
      condition: condition || 'Good',
      district: district || 'Colombo',
      province: province || 'Western',
      industryType: industryType || 'Apparel Manufacturing',
    });
    res.json(result);
  } catch (err) {
    res.status(502);
    throw new Error(`Sustainability grading service unavailable: ${err.message}`);
  }
});
