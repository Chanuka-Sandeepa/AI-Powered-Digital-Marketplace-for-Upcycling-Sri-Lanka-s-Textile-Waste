import express from 'express';
import { analyzeMarketplace, getMarketplaceHistory } from '../controllers/marketplaceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, authorize('seller', 'admin', 'super_admin'));

router.post('/analyze', analyzeMarketplace);
router.get('/history', getMarketplaceHistory);

export default router;
