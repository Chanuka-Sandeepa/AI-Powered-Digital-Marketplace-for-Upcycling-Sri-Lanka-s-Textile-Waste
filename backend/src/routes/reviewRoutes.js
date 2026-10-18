import express from 'express';
import { createOrderReview, getTopReviews } from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/top', getTopReviews);
router.post('/orders/:orderId', protect, createOrderReview);

export default router;
