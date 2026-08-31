import express from 'express';
import { checkout, getMyOrders, getSellerOrders, updateOrderStatus, downloadReceipt, trackOrder } from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/checkout', checkout);
router.get('/my-orders', getMyOrders);
router.get('/seller-orders', getSellerOrders);
router.get('/track/:orderCode', trackOrder);
router.put('/:id/status', updateOrderStatus);
router.get('/:id/receipt', downloadReceipt);

export default router;
