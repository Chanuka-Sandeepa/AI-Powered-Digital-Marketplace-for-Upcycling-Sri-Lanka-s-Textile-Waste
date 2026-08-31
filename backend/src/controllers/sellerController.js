import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Material from '../models/Material.js';
import User from '../models/User.js';

const sellerMatch = (userId) => ({ seller: new mongoose.Types.ObjectId(userId) });

// @route GET /api/seller/stats
export const getSellerStats = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;

  const [counts, recentListings] = await Promise.all([
    Material.aggregate([
      { $match: sellerMatch(sellerId) },
      {
        $group: {
          _id: null,
          totalListings: { $sum: 1 },
          availableListings: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
          pendingListings: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          soldListings: { $sum: { $cond: [{ $eq: ['$status', 'sold'] }, 1, 0] } },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$price'] } },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'sold'] }, { $multiply: ['$quantity', '$price'] }, 0],
            },
          },
        },
      },
    ]),
    Material.find(sellerMatch(sellerId)).sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  const agg = counts[0] || {
    totalListings: 0,
    availableListings: 0,
    pendingListings: 0,
    soldListings: 0,
    totalQuantity: 0,
    totalValue: 0,
    revenue: 0,
  };
  delete agg._id;

  res.json({ ...agg, recentListings });
});

// @route GET /api/seller/materials
export const getSellerMaterialsList = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 10));

  const filter = sellerMatch(req.user._id);
  if (status && status !== 'all') filter.status = status;

  const [materials, total] = await Promise.all([
    Material.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Material.countDocuments(filter),
  ]);

  res.json({
    materials,
    page: pageNum,
    pages: Math.max(1, Math.ceil(total / limitNum)),
    total,
  });
});

// @route GET /api/seller/performance?period=30
export const getSellerPerformance = asyncHandler(async (req, res) => {
  const days = Math.min(365, Math.max(1, Number(req.query.period) || 30));
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const [categoryAgg, statusAgg, dailyAgg] = await Promise.all([
    Material.aggregate([
      { $match: sellerMatch(req.user._id) },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
    Material.aggregate([
      { $match: sellerMatch(req.user._id) },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Material.aggregate([
      { $match: { ...sellerMatch(req.user._id), createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const categoryData = Object.fromEntries(categoryAgg.map((c) => [c._id || 'Uncategorized', c.count]));
  const statusData = Object.fromEntries(statusAgg.map((s) => [s._id || 'unknown', s.count]));

  // Fill in zero-count days so the chart has a continuous X axis.
  const dailyMap = new Map(dailyAgg.map((d) => [d._id, d.count]));
  const dailyData = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    dailyData.push({ date: key, count: dailyMap.get(key) || 0 });
  }

  res.json({ categoryData, statusData, dailyData });
});

// @route GET /api/seller/activity?limit=10
export const getSellerActivity = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

  const [newListings, sales] = await Promise.all([
    Material.find(sellerMatch(req.user._id)).sort({ createdAt: -1 }).limit(limit).lean(),
    Material.find({ ...sellerMatch(req.user._id), status: 'sold' })
      .sort({ soldAt: -1, updatedAt: -1 })
      .limit(limit)
      .lean(),
  ]);

  const activities = [
    ...newListings.map((m) => ({
      type: 'listing',
      title: m.title,
      status: m.status,
      quantity: m.quantity,
      price: m.price,
      date: m.createdAt,
    })),
    ...sales.map((m) => ({
      type: 'sale',
      title: m.title,
      status: m.status,
      quantity: m.quantity,
      price: m.price,
      date: m.soldAt || m.updatedAt,
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);

  res.json(activities);
});

// @route GET /api/seller/sustainability?timeRange=month
// Computed live from each material's ML-generated sustainability data --
// there is no separately-stored "metrics" collection to fall out of sync.
export const getSustainabilityMetrics = asyncHandler(async (req, res) => {
  const timeRange = ['week', 'month', 'quarter', 'year'].includes(req.query.timeRange)
    ? req.query.timeRange
    : 'month';

  const dateFormats = {
    week: '%G-W%V',
    month: '%Y-%m',
    quarter: '%Y-%m', // grouped further into quarters below
    year: '%Y',
  };
  const bucketCounts = { week: 12, month: 12, quarter: 8, year: 5 };

  const since = new Date();
  if (timeRange === 'week') since.setDate(since.getDate() - 7 * bucketCounts.week);
  else if (timeRange === 'month') since.setMonth(since.getMonth() - bucketCounts.month);
  else if (timeRange === 'quarter') since.setMonth(since.getMonth() - 3 * bucketCounts.quarter);
  else since.setFullYear(since.getFullYear() - bucketCounts.year);

  const materials = await Material.find({
    ...sellerMatch(req.user._id),
    createdAt: { $gte: since },
    sustainability: { $exists: true },
  }).lean();

  const bucketOf = (date) => {
    const d = new Date(date);
    if (timeRange === 'year') return String(d.getFullYear());
    if (timeRange === 'quarter') {
      const q = Math.floor(d.getMonth() / 3) + 1;
      return `${d.getFullYear()}-Q${q}`;
    }
    if (timeRange === 'week') {
      // ISO week number
      const target = new Date(d.valueOf());
      const dayNum = (d.getUTCDay() + 6) % 7;
      target.setUTCDate(target.getUTCDate() - dayNum + 3);
      const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
      const week = 1 + Math.round(
        ((target - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7
      );
      return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const buckets = new Map();
  for (const m of materials) {
    const key = bucketOf(m.createdAt);
    if (!buckets.has(key)) {
      buckets.set(key, {
        _id: key,
        period: key,
        wasteDiverted: 0,
        co2Saved: 0,
        waterSaved: 0,
        energySaved: 0,
        materialsRecycled: 0,
        revenueGenerated: 0,
        createdAt: m.createdAt,
      });
    }
    const bucket = buckets.get(key);
    bucket.wasteDiverted += m.sustainability?.landfillDivertedKg || 0;
    bucket.co2Saved += m.sustainability?.co2SavedKg || 0;
    bucket.waterSaved += m.sustainability?.waterSavedLiters || 0;
    bucket.energySaved += m.sustainability?.energySavedKwh || 0;
    bucket.materialsRecycled += 1;
    if (m.status === 'sold') bucket.revenueGenerated += (m.price || 0) * (m.quantity || 0);
    if (new Date(m.createdAt) < new Date(bucket.createdAt)) bucket.createdAt = m.createdAt;
  }

  const round2 = (n) => Math.round(n * 100) / 100;
  const metrics = [...buckets.values()]
    .map((b) => ({
      ...b,
      wasteDiverted: round2(b.wasteDiverted),
      co2Saved: round2(b.co2Saved),
      waterSaved: round2(b.waterSaved),
      energySaved: round2(b.energySaved),
      revenueGenerated: round2(b.revenueGenerated),
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ metrics, total: metrics.length });
});

// @route GET /api/seller/profile
export const getSellerProfile = asyncHandler(async (req, res) => {
  const [statsAgg] = await Material.aggregate([
    { $match: sellerMatch(req.user._id) },
    {
      $group: {
        _id: null,
        totalListings: { $sum: 1 },
        totalSales: { $sum: { $cond: [{ $eq: ['$status', 'sold'] }, 1, 0] } },
        totalRevenue: {
          $sum: { $cond: [{ $eq: ['$status', 'sold'] }, { $multiply: ['$quantity', '$price'] }, 0] },
        },
      },
    },
  ]);

  res.json({
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    bio: req.user.bio,
    avatar: req.user.avatar,
    memberSince: req.user.createdAt,
    totalListings: statsAgg?.totalListings || 0,
    totalSales: statsAgg?.totalSales || 0,
    totalRevenue: statsAgg?.totalRevenue || 0,
    // No review/messaging system exists yet to back these with real data;
    // reported as null rather than a fabricated number.
    averageRating: null,
    responseRate: null,
  });
});

// @route PUT /api/seller/profile
export const updateSellerProfile = asyncHandler(async (req, res) => {
  const { name, phone, bio, avatar } = req.body;
  const user = await User.findById(req.user._id);

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (bio !== undefined) user.bio = bio;
  if (avatar !== undefined) user.avatar = avatar;

  await user.save();

  res.json({ name: user.name, email: user.email, phone: user.phone, bio: user.bio, avatar: user.avatar });
});

// @route GET /api/seller/company
export const getCompanyInfo = asyncHandler(async (req, res) => {
  res.json(req.user.company || {});
});

// @route PUT /api/seller/company
export const updateCompanyInfo = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const fields = [
    'companyName', 'businessType', 'registrationNumber', 'taxId',
    'address', 'city', 'country', 'postalCode', 'phone', 'website',
  ];

  user.company = user.company || {};
  fields.forEach((field) => {
    if (req.body[field] !== undefined) user.company[field] = req.body[field];
  });

  await user.save();
  res.json(user.company);
});
