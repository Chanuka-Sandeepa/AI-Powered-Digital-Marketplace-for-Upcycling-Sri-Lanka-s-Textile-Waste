import express from 'express';
import {
  getMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  inquireAboutMaterial,
  regradeMaterial,
  reanalyzeMaterial,
  getMaterialTraceability,
  getMaterialScenarios,
  getMyInquiries,
} from '../controllers/materialController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(getMaterials).post(protect, createMaterial);

// Must be registered BEFORE '/:id' - otherwise Express matches this path
// against ':id' first and tries (and fails) to treat "my-inquiries" as a
// Material ObjectId.
router.get('/my-inquiries', protect, getMyInquiries);

router.route('/:id').get(getMaterialById).put(protect, updateMaterial).delete(protect, deleteMaterial);

router.post('/:id/inquire', protect, inquireAboutMaterial);
router.post('/:id/regrade', protect, regradeMaterial);
router.post('/:id/reanalyze', protect, reanalyzeMaterial);
// Public, same access level as viewing the listing itself (getMaterialById) -
// a buyer reviewing a listing should be able to see its traceability and
// circular-action comparison without needing to be the seller.
router.get('/:id/traceability', getMaterialTraceability);
router.get('/:id/scenarios', getMaterialScenarios);

export default router;
