import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Material from '../models/Material.js';
import Inquiry from '../models/Inquiry.js';
import { createNotification } from '../utils/notifications.js';

// @route GET /api/admin/users
// Admins manage buyer/seller accounts; super admins can query every role.
export const getUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

  const filter = req.user.role === 'admin'
    ? { role: { $in: ['buyer', 'seller'] } }
    : {};
  if (role && role !== 'all') {
    if (req.user.role === 'admin' && !['buyer', 'seller'].includes(role)) {
      res.status(403);
      throw new Error('Admins can only search buyer and seller accounts');
    }
    filter.role = role;
  }
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({ users, page: pageNum, pages: Math.max(1, Math.ceil(total / limitNum)), total });
});

// @route GET /api/admin/users/:id
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password').lean();
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (req.user.role === 'admin' && !['buyer', 'seller'].includes(user.role)) {
    res.status(403);
    throw new Error('Admins can only view buyer and seller accounts');
  }
  res.json(user);
});

// @route POST /api/admin/admins
// Create an operational admin account. Only the super admin can grant
// privileged access; public registration always creates buyer/seller users.
export const createAdminAccount = asyncHandler(async (req, res) => {
  if (req.user.role !== 'super_admin') {
    res.status(403);
    throw new Error('Only the super admin can create admin accounts');
  }

  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email, and an initial password are required');
  }
  if (password.length < 8) {
    res.status(400);
    throw new Error('The initial password must be at least 8 characters');
  }
  if (await User.exists({ email })) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }

  const admin = await User.create({ name, email, password, role: 'admin' });
  res.status(201).json(admin.toPublicJSON());
});

// @route PUT /api/admin/users/:id/status
// Suspend/reactivate an account. Available to admin - this is exactly the
// "buyer/user control" scope the role matrix gives admin, without needing
// super_admin's broader system access.
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { accountStatus } = req.body;
  if (!['active', 'suspended'].includes(accountStatus)) {
    res.status(400);
    throw new Error('accountStatus must be "active" or "suspended"');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role === 'super_admin') {
    res.status(403);
    throw new Error('super_admin accounts cannot be suspended');
  }
  // An admin (not super_admin) may only manage buyers and sellers, not
  // other admins - matches "admin can only control users and buyers",
  // not other admins or the system itself.
  if (req.user.role === 'admin' && !['buyer', 'seller'].includes(user.role)) {
    res.status(403);
    throw new Error('Admins can only manage buyer and seller accounts');
  }

  user.accountStatus = accountStatus;
  await user.save();

  await createNotification(
    user._id, 'account_status_changed',
    accountStatus === 'suspended' ? 'Account Suspended' : 'Account Reactivated',
    accountStatus === 'suspended'
      ? 'Your account has been suspended. Contact support if you believe this is a mistake.'
      : 'Your account has been reactivated. Welcome back!',
    '', user._id
  );
  res.json(user.toPublicJSON());
});

// @route PUT /api/admin/users/:id/role
// Privileged role changes are super_admin-only and cannot demote the final
// super admin or change the caller's own role.
export const updateUserRole = asyncHandler(async (req, res) => {
  if (req.user.role !== 'super_admin') {
    res.status(403);
    throw new Error('Only super_admin can change user roles');
  }

  const { role } = req.body;
  if (!['buyer', 'seller', 'admin', 'super_admin'].includes(role)) {
    res.status(400);
    throw new Error('Invalid role');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot change your own role');
  }
  if (user.role === 'super_admin' && role !== 'super_admin') {
    const superAdminCount = await User.countDocuments({ role: 'super_admin' });
    if (superAdminCount <= 1) {
      res.status(409);
      throw new Error('The last super admin cannot be demoted');
    }
  }

  user.role = role;
  await user.save();
  res.json(user.toPublicJSON());
});

// @route DELETE /api/admin/users/:id
// super_admin-only - full deletion is system-level, not "user control".
// Same reasoning as updateUserRole above: enforced here, not just at the
// router level.
export const deleteUser = asyncHandler(async (req, res) => {
  if (req.user.role !== 'super_admin') {
    res.status(403);
    throw new Error('Only super_admin can delete user accounts');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot delete your own account');
  }
  if (user.role === 'super_admin' && await User.countDocuments({ role: 'super_admin' }) <= 1) {
    res.status(409);
    throw new Error('The last super admin cannot be deleted');
  }

  await user.deleteOne();
  res.json({ message: 'User removed', _id: req.params.id });
});

// @route GET /api/admin/overview
// Lightweight system-wide stats for both admin and super_admin dashboards.
export const getAdminOverview = asyncHandler(async (req, res) => {
  const userScope = req.user.role === 'admin' ? { role: { $in: ['buyer', 'seller'] } } : {};
  const suspendedScope = req.user.role === 'admin'
    ? { accountStatus: 'suspended', role: { $in: ['buyer', 'seller'] } }
    : { accountStatus: 'suspended' };
  const [totalUsers, totalBuyers, totalSellers, totalMaterials, availableMaterials, soldMaterials, totalInquiries, suspendedUsers] =
    await Promise.all([
      User.countDocuments(userScope),
      User.countDocuments({ role: 'buyer' }),
      User.countDocuments({ role: 'seller' }),
      Material.countDocuments({}),
      Material.countDocuments({ status: 'available' }),
      Material.countDocuments({ status: 'sold' }),
      Inquiry.countDocuments({}),
      User.countDocuments(suspendedScope),
    ]);

  res.json({
    totalUsers, totalBuyers, totalSellers, suspendedUsers,
    totalMaterials, availableMaterials, soldMaterials,
    totalInquiries,
  });
});

// @route GET /api/admin/inquiries
// Buyer-activity oversight - explicitly part of admin's scope ("buyers
// works controlles" in the role matrix).
export const getAllInquiries = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, status } = req.query;
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
  const allowedStatuses = ['open', 'responded', 'closed'];
  const filter = allowedStatuses.includes(status) ? { status } : {};

  const [inquiries, total] = await Promise.all([
    Inquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('material', 'title imageUrl price status category quantity location')
      .populate('buyer', 'name email')
      .populate('seller', 'name email')
      .lean(),
    Inquiry.countDocuments(filter),
  ]);

  res.json({ inquiries, page: pageNum, pages: Math.max(1, Math.ceil(total / limitNum)), total });
});
