import express from 'express';
import { registerUser, loginUser, getCurrentUser, updateCurrentUser } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getCurrentUser);
router.put('/me', protect, updateCurrentUser);

export default router;
