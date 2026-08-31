import express from 'express';
import {
  getSellerStats,
  getSellerMaterialsList,
  getSellerPerformance,
  getSellerActivity,
  getSustainabilityMetrics,
  getSellerProfile,
  updateSellerProfile,
  getCompanyInfo,
  updateCompanyInfo,
} from '../controllers/sellerController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, authorize('seller', 'admin'));

router.get('/stats', getSellerStats);
router.get('/materials', getSellerMaterialsList);
router.get('/performance', getSellerPerformance);
router.get('/activity', getSellerActivity);
router.get('/sustainability', getSustainabilityMetrics);
router.route('/profile').get(getSellerProfile).put(updateSellerProfile);
router.route('/company').get(getCompanyInfo).put(updateCompanyInfo);

export default router;
