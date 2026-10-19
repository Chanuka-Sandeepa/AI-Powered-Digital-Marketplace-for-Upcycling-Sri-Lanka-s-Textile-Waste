import express from 'express';
import {
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getAdminOverview,
  getAllInquiries,
  createAdminAccount,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Shared administration routes use both roles. Individual controllers
// enforce target-specific limits; creating admins is super_admin-only.
router.use(protect, authorize('admin', 'super_admin'));

router.get('/overview', getAdminOverview);
router.get('/inquiries', getAllInquiries);

router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.post('/admins', authorize('super_admin'), createAdminAccount);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

export default router;
