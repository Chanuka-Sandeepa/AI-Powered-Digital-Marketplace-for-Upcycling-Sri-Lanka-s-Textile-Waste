import express from 'express';
import { analyzeTextileWaste, getAnalysisHistory, previewGrade } from '../controllers/aiController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect, authorize('seller', 'admin'));

router.post('/analyze', upload.array('images', 10), analyzeTextileWaste);
router.get('/history', getAnalysisHistory);
router.post('/grade', previewGrade);

export default router;
