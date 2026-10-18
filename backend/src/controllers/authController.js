import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { notifyAdmins } from '../utils/notifications.js';

const respondWithUser = (res, statusCode, user) => {
  res.status(statusCode).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus,
    phone: user.phone,
    token: generateToken(user._id),
  });
};

// @route POST /api/auth/register
// Only buyer/seller are self-registerable - admin and super_admin accounts
// are never created through this public form (see the role coercion
// below), only by an existing super_admin via the admin user-management
// panel, or the one-time seed script for the very first super_admin.
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: ['buyer', 'seller'].includes(role) ? role : 'buyer',
  });

  await notifyAdmins(
    'user_registered', 'New User Registered',
    `${user.name} (${user.email}) registered as a ${user.role}.`,
    '/admin-dashboard/users', user._id
  );

  respondWithUser(res, 201, user);
});

// @route POST /api/auth/login
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (user.accountStatus === 'suspended') {
    res.status(403);
    throw new Error('This account has been suspended. Contact support if you believe this is a mistake.');
  }

  respondWithUser(res, 200, user);
});

// @route POST /api/auth/google
// Google Identity Services supplies an access token; verify it with Google
// before using its verified profile to find or create a local account.
export const googleLogin = asyncHandler(async (req, res) => {
  const { accessToken, role } = req.body;
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    res.status(503);
    throw new Error('Google sign-in is not configured on this server');
  }
  if (!accessToken || typeof accessToken !== 'string') {
    res.status(400);
    throw new Error('Google access token is required');
  }

  const tokenResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
  if (!tokenResponse.ok) {
    res.status(401);
    throw new Error('Google sign-in could not be verified');
  }
  const tokenInfo = await tokenResponse.json();
  if (tokenInfo.aud !== clientId || Number(tokenInfo.exp) * 1000 <= Date.now()) {
    res.status(401);
    throw new Error('Google sign-in token is invalid or expired');
  }

  const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileResponse.ok) {
    res.status(401);
    throw new Error('Could not load your Google profile');
  }
  const profile = await profileResponse.json();
  if (!profile.email || profile.email_verified !== true) {
    res.status(401);
    throw new Error('A verified Google email address is required');
  }

  const email = profile.email.toLowerCase();
  let user = await User.findOne({ email });
  let created = false;
  if (!user) {
    user = await User.create({
      name: profile.name || email.split('@')[0],
      email,
      avatar: profile.picture || '',
      role: ['buyer', 'seller'].includes(role) ? role : 'buyer',
    });
    created = true;
  }

  if (user.accountStatus === 'suspended') {
    res.status(403);
    throw new Error('This account has been suspended. Contact support if you believe this is a mistake.');
  }

  if (created) {
    await notifyAdmins(
      'user_registered', 'New User Registered',
      `${user.name} (${user.email}) registered as a ${user.role}.`,
      '/admin-dashboard/users', user._id
    );
  }

  respondWithUser(res, created ? 201 : 200, user);
});

// @route GET /api/auth/me
export const getCurrentUser = asyncHandler(async (req, res) => {
  res.json(req.user.toPublicJSON());
});

// @route PUT /api/auth/me
// Generic self-service profile update usable by every role (buyer, seller,
// admin, super_admin) - role and accountStatus are deliberately not
// editable here, those go through the admin/super_admin-only endpoints in
// userController.js.
export const updateCurrentUser = asyncHandler(async (req, res) => {
  const { name, phone, bio } = req.body;
  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  if (bio !== undefined) req.user.bio = bio;
  await req.user.save();
  res.json(req.user.toPublicJSON());
});
