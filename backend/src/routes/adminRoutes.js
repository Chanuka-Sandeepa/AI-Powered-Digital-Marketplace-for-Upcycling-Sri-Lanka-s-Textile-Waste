import express from 'express';
import {
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getAdminOverview,
  getAllInquiries,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Both admin and super_admin can reach every route below - the finer
// distinction (e.g. "admin can't suspend other admins", "only super_admin
// can change roles or delete") is enforced inside each controller
// function, not at the route level, since it depends on the target
// user's role too, not just the caller's.
router.use(protect, authorize('admin', 'super_admin'));

router.get('/overview', getAdminOverview);
router.get('/inquiries', getAllInquiries);

router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

export default router;
