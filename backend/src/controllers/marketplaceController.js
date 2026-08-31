import asyncHandler from 'express-async-handler';
import Material from '../models/Material.js';
import MarketplacePrediction from '../models/MarketplacePrediction.js';
import User from '../models/User.js';
import { analyzeMarketplace as callMlMarketplace } from '../utils/mlClient.js';
import { computeSustainabilityScore, computeGreenScore } from '../utils/scoring.js';

// The trend/listing-success/sales-time models (see ml-service's
// trend_model.py docstring) need several fields this app has never
// collected: market competition, seller rating, economic index, etc.
// Where real data exists, it's used for real - see computeMarketContext
// and sellerExperienceMonths below. Where none exists yet (no review
// system, no macroeconomic data source), a documented neutral default is
// used instead of inventing a number that looks precise but isn't.
const NO_DATA_DEFAULTS = {
  exportDemand: 50, // 0-100 neutral midpoint - no export-demand data source exists
  economicIndex: 100, // baseline index - no real macroeconomic data source exists
  sellerRating: 3.5, // out of 5, neutral-positive - no review/rating system exists yet
};

function estimateMarketplaceFallback(inputs, fullInputs = {}) {
  const health = Number(inputs.healthScore ?? 50);
  const sustainability = Number(inputs.sustainabilityScore ?? 50);
  const greenScore = Number(inputs.greenScore ?? 50);
  const weightKg = Number(inputs.weightKg ?? 1);
  const defectArea = Number(inputs.defectArea ?? 0);
  const remainingLifespan = Number(inputs.remainingLifespan ?? 0);
  const repairability = String(inputs.repairability || 'Repairable with Care');
  const condition = String(inputs.condition || 'Good');

  let qualityBonus = 0;
  if (repairability.toLowerCase().includes('high')) qualityBonus += 25;
  else if (repairability.toLowerCase().includes('moder')) qualityBonus += 12;
  else if (repairability.toLowerCase().includes('limited')) qualityBonus -= 15;

  if (condition.toLowerCase() === 'excellent') qualityBonus += 18;
  else if (condition.toLowerCase() === 'good') qualityBonus += 8;
  else if (condition.toLowerCase() === 'fair') qualityBonus -= 5;
  else if (condition.toLowerCase() === 'poor') qualityBonus -= 15;

  const predictedPricePerKg = Math.max(
    5,
    18 + (health / 100) * 65 + (sustainability / 100) * 35 + (greenScore / 100) * 25 + qualityBonus - defectArea * 0.5 + Math.min(remainingLifespan, 24) * 0.9
  ) * Math.max(0.45, Math.min(1.8, weightKg / 10));

  const demandScore = (sustainability * 0.6) + (health * 0.4);
  let demandLevel = 'Low';
  let demandLevelIndex = 0;
  if (demandScore >= 75 || predictedPricePerKg >= 120) {
    demandLevel = 'High';
    demandLevelIndex = 2;
  } else if (demandScore >= 50 || predictedPricePerKg >= 80) {
    demandLevel = 'Medium';
    demandLevelIndex = 1;
  }

  const buyerTypes = demandLevel === 'High'
    ? ['Textile Recyclers', 'Apparel Manufacturers', 'Exporter Buyers', 'Upcyclers', 'Local Factories']
    : demandLevel === 'Low'
      ? ['Local Traders', 'Waste Aggregators', 'Upcyclers', 'Apparel Manufacturers', 'Exporter Buyers']
      : ['Apparel Manufacturers', 'Textile Recyclers', 'Local Traders', 'Upcyclers', 'Exporter Buyers'];

  const recommendedBuyers = buyerTypes.map((buyerType, index) => ({
    buyerType,
    matchScore: Number((100 - index * 12).toFixed(2)),
  }));

  const marketplaceTrend = predictedPricePerKg >= 120 || health >= 80 ? 'Increasing' : predictedPricePerKg <= 50 || health <= 40 ? 'Decreasing' : 'Stable';
  const listingWillSell = predictedPricePerKg >= 80 || demandLevel !== 'Low';

  return {
    predictedPricePerKg: Number(predictedPricePerKg.toFixed(2)),
    demandLevel,
    demandLevelIndex,
    demandConfidence: 68,
    demandDistribution: { Low: 18, Medium: 52, High: 30 },
    recommendedBuyers,
    marketplaceTrend,
    marketplaceTrendConfidence: 70,
    marketplaceTrendDistribution: { Increasing: 35, Stable: 45, Decreasing: 20 },
    listingWillSell,
    listingSuccessProbability: listingWillSell ? 74 : 39,
    estimatedSalesTimeDays: demandLevel === 'High' ? 12 : demandLevel === 'Low' ? 30 : 18,
    ...fullInputs,
  };
}

// Real, computed from the current state of the live marketplace - how many
// other available listings compete in this fabric category, and what
// they're priced at. Used as both competitorCount/averageMarketPrice
// directly and as a rough 0-100 "competition intensity" proxy for
// marketCompetition (documented estimate: more competing listings ->
// higher competition score, capped at 100).
async function computeMarketContext(fabricType) {
  const [stats] = await Material.aggregate([
    { $match: { category: fabricType, status: 'available' } },
    { $group: { _id: null, count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
  ]);
  const competitorCount = stats?.count || 0;
  return {
    competitorCount,
    averageMarketPrice: stats ? Math.round(stats.avgPrice) : 0,
    marketCompetition: Math.min(100, competitorCount * 5),
  };
}

// Sri Lanka doesn't really have four temperate seasons, but the trained
// model's categories look like standard ones - this is a best-effort
// mapping, not a confirmed real seasonal signal.
function deriveSeason(month) {
  if ([12, 1, 2].includes(month)) return 'Winter';
  if ([3, 4, 5].includes(month)) return 'Spring';
  if ([6, 7, 8].includes(month)) return 'Summer';
  return 'Autumn';
}

function getListingTimeFields() {
  const now = new Date();
  const oneJan = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - oneJan) / 86400000 + oneJan.getDay() + 1) / 7);
  return {
    listingMonth: now.getMonth() + 1,
    listingWeek: week,
    listingDay: now.getDate(),
    listingHour: now.getHours(),
  };
}

// @route POST /api/marketplace/analyze
// Body is either:
//   { materialId }  - analyze an already-published listing, or
//   { fabricType, weightKg, healthScore, defectArea, remainingLifespan,
//     repairability, condition, district, industryType, sustainability? }
//   - analyze during the upload wizard, before a listing exists yet.
export const analyzeMarketplace = asyncHandler(async (req, res) => {
  let inputs;
  let materialId;
  let province;

  if (req.body.materialId) {
    const material = await Material.findById(req.body.materialId);
    if (!material) {
      res.status(404);
      throw new Error('Material not found');
    }
    if (material.seller.toString() !== req.user._id.toString() && !['admin', 'super_admin'].includes(req.user.role)) {
      res.status(403);
      throw new Error('Not authorized to analyze this listing');
    }
    const aiAnalysis = material.aiAnalysis || {
      fabricType: material.category || 'Textile Waste',
      healthScore: 60,
      defectArea: 0,
      remainingLifespan: 12,
      repairability: material.condition === 'Poor' ? 'Limited Repairability' : 'Moderately Repairable',
    };

    materialId = material._id;
    province = material.province;
    inputs = {
      fabricType: aiAnalysis.fabricType || material.category || 'Textile Waste',
      weightKg: Number(material.quantity) || 1,
      healthScore: Number(aiAnalysis.healthScore) || 60,
      defectArea: Number(aiAnalysis.defectArea) || 0,
      remainingLifespan: Number(aiAnalysis.remainingLifespan) || 12,
      repairability: aiAnalysis.repairability || 'Moderately Repairable',
      condition: material.condition || 'Good',
      district: material.district || 'Colombo',
      industryType: material.industryType || 'Apparel Manufacturing',
      sustainabilityScore:
        material.sustainabilityScore ?? computeSustainabilityScore(aiAnalysis) ?? 60,
      greenScore: computeGreenScore(material.sustainability),
      co2Saving: material.sustainability?.co2SavedKg || 0,
      waterSaving: material.sustainability?.waterSavedLiters || 0,
    };
  } else {
    const {
      fabricType, weightKg, healthScore, defectArea, remainingLifespan,
      repairability, condition, district, industryType, sustainability,
    } = req.body;

    const normalizedFabricType = fabricType || 'Textile Waste';
    const normalizedWeightKg = Number(weightKg ?? 1);
    const normalizedHealthScore = Number(healthScore ?? 60);

    province = req.body.province;
    inputs = {
      fabricType: normalizedFabricType,
      weightKg: normalizedWeightKg,
      healthScore: normalizedHealthScore,
      defectArea: Number(defectArea) || 0,
      remainingLifespan: Number(remainingLifespan) || 12,
      repairability: repairability || 'Moderately Repairable',
      condition: condition || 'Good',
      district: district || 'Colombo',
      industryType: industryType || 'Apparel Manufacturing',
      sustainabilityScore:
        Number(req.body.sustainabilityScore) ||
        computeSustainabilityScore({
          healthScore: normalizedHealthScore,
          repairability: repairability || 'Moderately Repairable',
          remainingLifespan: Number(remainingLifespan) || 12,
          defectArea: Number(defectArea) || 0,
        }) ||
        60,
      greenScore: computeGreenScore(sustainability),
      co2Saving: sustainability?.co2SavedKg || Number(req.body.co2Saving) || 0,
      waterSaving: sustainability?.waterSavedLiters || Number(req.body.waterSaving) || 0,
    };
  }

  const [marketContext, seller] = await Promise.all([
    computeMarketContext(inputs.fabricType),
    User.findById(req.user._id).select('createdAt').lean(),
  ]);
  const timeFields = getListingTimeFields();
  const sellerExperienceMonths = seller?.createdAt
    ? Math.max(0, (Date.now() - new Date(seller.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 0;

  const fullInputs = {
    ...inputs,
    province: province || 'Western',
    carbonFootprint: inputs.co2Saving, // best-effort reuse, no separate formula available - see trend_model.py
    ...timeFields,
    season: deriveSeason(timeFields.listingMonth),
    ...marketContext,
    ...NO_DATA_DEFAULTS,
    sellerExperienceMonths: Math.round(sellerExperienceMonths * 10) / 10,
  };

  let result;
  try {
    result = await callMlMarketplace(fullInputs);
  } catch (error) {
    console.warn('ML marketplace service unavailable, using local fallback estimate:', error?.message || error);
    result = estimateMarketplaceFallback(inputs, fullInputs);
  }

  await MarketplacePrediction.create({
    seller: req.user._id,
    material: materialId,
    fabricType: inputs.fabricType,
    weightKg: inputs.weightKg,
    healthScore: inputs.healthScore,
    defectArea: inputs.defectArea,
    condition: inputs.condition,
    district: inputs.district,
    industryType: inputs.industryType,
    predictedPricePerKg: result.predictedPricePerKg,
    demandLevel: result.demandLevel,
    demandConfidence: result.demandConfidence,
    recommendedBuyers: result.recommendedBuyers,
    marketplaceTrend: result.marketplaceTrend,
    listingWillSell: result.listingWillSell,
    listingSuccessProbability: result.listingSuccessProbability,
    estimatedSalesTimeDays: result.estimatedSalesTimeDays,
  });

  res.json(result);
});

// @route GET /api/marketplace/history
export const getMarketplaceHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));

  const filter = { seller: req.user._id };
  const [predictions, total] = await Promise.all([
    MarketplacePrediction.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('material', 'title imageUrl status')
      .lean(),
    MarketplacePrediction.countDocuments(filter),
  ]);

  res.json({
    predictions,
    page: pageNum,
    pages: Math.max(1, Math.ceil(total / limitNum)),
    total,
  });
});

