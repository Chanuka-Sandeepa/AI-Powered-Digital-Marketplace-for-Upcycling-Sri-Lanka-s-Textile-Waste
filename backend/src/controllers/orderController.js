import asyncHandler from 'express-async-handler';
import PDFDocument from 'pdfkit';
import Order from '../models/Order.js';
import Material from '../models/Material.js';
import User from '../models/User.js';
import { logTraceabilityEvent } from '../utils/traceability.js';
import { sendOrderConfirmationEmail, sendNewOrderSellerEmail } from '../utils/mailer.js';
import { createNotification } from '../utils/notifications.js';

// @route POST /api/orders/checkout
// Body: { items: [{ materialId, quantityKg }], deliveryAddress, paymentMethod }
//
// Creates one Order per cart line item (see Order model for why one order
// per listing, not one order per cart). Does NOT use a MongoDB
// multi-document transaction - those require a replica set, which a
// standalone `mongod` (the setup used throughout this project) doesn't
// provide, and would crash on the very first checkout attempt.
//
// Instead: each item is validated up front (fast failure with a clear
// message if anything's wrong), then each listing's quantity is decremented
// with a single atomic conditional update (`quantity: { $gte: qty }` in the
// filter) so two buyers racing for the last of a limited listing can't both
// "succeed" and oversell it - the second one's atomic update simply matches
// zero documents and is caught as a real "just sold out" error, not a
// theoretical one.
// Simple, transparent flat-rate delivery estimate - same district as the
// seller costs less and arrives sooner than a cross-district delivery.
// Not a real courier-partner rate (no logistics integration exists), but a
// documented, consistent rule rather than an arbitrary number, and shown
// to the buyer before they pay, not hidden.
function estimateDelivery(sellerDistrict, buyerDistrict) {
  const sameDistrict = sellerDistrict && buyerDistrict && sellerDistrict === buyerDistrict;
  const fee = sameDistrict ? 300 : 550;
  const businessDays = sameDistrict ? 2 : 4;
  const estimatedDeliveryDate = new Date();
  estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + businessDays);
  return { fee, estimatedDeliveryDate };
}

export const checkout = asyncHandler(async (req, res) => {
  const { items, deliveryAddress, paymentMethod } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('Your cart is empty');
  }
  if (!['card', 'cash'].includes(paymentMethod)) {
    res.status(400);
    throw new Error('paymentMethod must be "card" or "cash"');
  }
  const requiredAddressFields = ['fullName', 'phone', 'addressLine', 'city', 'district'];
  const missing = requiredAddressFields.filter((f) => !deliveryAddress?.[f]);
  if (missing.length > 0) {
    res.status(400);
    throw new Error(`Delivery address is missing: ${missing.join(', ')}`);
  }

  // ---- Pass 1: validate everything up front, touch nothing yet ----
  const materials = [];
  for (const item of items) {
    const qty = Number(item.quantityKg);
    if (!item.materialId || !qty || qty <= 0) {
      res.status(400);
      throw new Error('Each cart item needs a valid materialId and quantityKg');
    }
    const material = await Material.findById(item.materialId);
    if (!material) {
      res.status(400);
      throw new Error('One of the items in your cart is no longer available');
    }
    if (material.status !== 'available') {
      res.status(400);
      throw new Error(`"${material.title}" is no longer available`);
    }
    if (qty > material.quantity) {
      res.status(400);
      throw new Error(`Only ${material.quantity}kg of "${material.title}" is available (you requested ${qty}kg)`);
    }
    if (material.seller.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error(`You can't buy your own listing ("${material.title}")`);
    }
    materials.push({ material, qty });
  }

  // ---- Pass 2: commit each item with an atomic conditional decrement ----
  const createdOrders = [];
  for (const { material, qty } of materials) {
    const updated = await Material.findOneAndUpdate(
      { _id: material._id, status: 'available', quantity: { $gte: qty } },
      [
        { $set: { quantity: { $subtract: ['$quantity', qty] } } },
        { $set: { status: { $cond: [{ $lte: ['$quantity', 0] }, 'sold', '$status'] } } },
      ],
      { new: true }
    );

    if (!updated) {
      // Someone else bought it between validation and commit - genuine
      // race, not a bug. Orders already created for earlier items in this
      // same checkout are left as-is (they're real, valid purchases) -
      // only this item is skipped and reported.
      res.status(409);
      throw new Error(`"${material.title}" just sold out while you were checking out. Please remove it and try again.`);
    }

    const subtotal = Math.round(qty * material.price * 100) / 100;
    const { fee: deliveryFee, estimatedDeliveryDate } = estimateDelivery(material.district, deliveryAddress.district);
    const orderTotal = Math.round((subtotal + deliveryFee) * 100) / 100;

    const order = await Order.create({
      buyer: req.user._id,
      seller: material.seller,
      material: material._id,
      materialTitle: material.title,
      materialImageUrl: material.imageUrl,
      quantityKg: qty,
      pricePerKg: material.price,
      subtotal,
      deliveryFee,
      totalAmount: orderTotal,
      estimatedDeliveryDate,
      deliveryAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'card' ? 'paid' : 'pending',
    });
    createdOrders.push(order);

    await logTraceabilityEvent(material._id, 'Sold', req.user._id, {
      orderId: order._id, quantityKg: qty, paymentMethod,
    });

    await createNotification(
      req.user._id, 'order_placed', 'Order Placed',
      `Your order for ${order.materialTitle} (${qty}kg) has been placed. Order code: ${order.orderCode}`,
      '/my-orders', order._id
    );
    await createNotification(
      material.seller, 'new_order', 'New Order Received',
      `You received an order for ${order.materialTitle} (${qty}kg) - order code ${order.orderCode}`,
      '/seller-orders', order._id
    );
    if (updated.status === 'sold') {
      await createNotification(
        material.seller, 'listing_sold_out', 'Listing Sold Out',
        `"${material.title}" is now fully sold.`,
        '/my-listings', material._id
      );
    }

    // Fire-and-forget, same pattern as traceability logging - a mail
    // failure (or SMTP simply not being configured) should never roll
    // back or block a real order that already succeeded.
    sendOrderConfirmationEmail(order, req.user.email, req.user.name).catch((err) =>
      console.error('[checkout] buyer confirmation email failed:', err.message)
    );
    User.findById(material.seller)
      .then((seller) => {
        if (seller) return sendNewOrderSellerEmail(order, seller.email, seller.name);
      })
      .catch((err) => console.error('[checkout] seller notification email failed:', err.message));
  }

  res.status(201).json({
    message: `Order${createdOrders.length > 1 ? 's' : ''} placed successfully.`,
    orders: createdOrders,
  });
});

// @route GET /api/orders/my-orders
// Buyer's own purchase history.
export const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));

  const filter = { buyer: req.user._id };
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('seller', 'name email')
      .lean(),
    Order.countDocuments(filter),
  ]);

  const totalSpentAgg = await Order.aggregate([
    { $match: { buyer: req.user._id } },
    { $group: { _id: null, sum: { $sum: '$totalAmount' } } },
  ]);

  res.json({
    orders, page: pageNum, pages: Math.max(1, Math.ceil(total / limitNum)), total,
    totalSpent: totalSpentAgg[0]?.sum || 0,
  });
});

// @route GET /api/orders/seller-orders
// Orders placed against the current seller's listings - so a seller can
// see and fulfill what's actually been bought, not just inquiries.
// @route GET /api/orders/track/:orderCode
// Look up an order by its human-readable code instead of its Mongo _id -
// "check using id" from a buyer or seller's perspective means the code on
// their receipt/email, not an ObjectId they'd never actually type.
export const trackOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderCode: req.params.orderCode.toUpperCase() })
    .populate('buyer', 'name email')
    .populate('seller', 'name email')
    .lean();

  if (!order) {
    res.status(404);
    throw new Error('No order found with that code');
  }

  const isOwner = order.buyer._id.toString() === req.user._id.toString() || order.seller._id.toString() === req.user._id.toString();
  if (!isOwner && !['admin', 'super_admin'].includes(req.user.role)) {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  res.json(order);
});

export const getSellerOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));

  const filter = { seller: req.user._id };
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('buyer', 'name email')
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.json({ orders, page: pageNum, pages: Math.max(1, Math.ceil(total / limitNum)), total });
});

// @route PUT /api/orders/:id/status
// Seller (or admin/super_admin) updates order fulfillment status.
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;
  if (!['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(orderStatus)) {
    res.status(400);
    throw new Error('Invalid order status');
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.seller.toString() !== req.user._id.toString() && !['admin', 'super_admin'].includes(req.user.role)) {
    res.status(403);
    throw new Error('Not authorized to update this order');
  }

  order.orderStatus = orderStatus;
  if (orderStatus === 'delivered' && order.paymentMethod === 'cash') {
    order.paymentStatus = 'paid'; // cash collected on delivery
  }
  await order.save();

  await logTraceabilityEvent(order.material, 'StatusChanged', req.user._id, {
    orderId: order._id, newOrderStatus: orderStatus,
  });

  await createNotification(
    order.buyer, 'order_status_changed', 'Order Update',
    `Your order ${order.orderCode} (${order.materialTitle}) is now "${orderStatus}".`,
    '/my-orders', order._id
  );

  res.json(order);
});

// @route GET /api/orders/:id/receipt
// Streams a PDF receipt/invoice for the order. Available to the buyer who
// placed it, the seller who fulfilled it, or admin/super_admin - same
// access pattern as updateOrderStatus.
export const downloadReceipt = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('buyer', 'name email phone')
    .populate('seller', 'name email phone');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  const isOwner = order.buyer._id.toString() === req.user._id.toString() || order.seller._id.toString() === req.user._id.toString();
  if (!isOwner && !['admin', 'super_admin'].includes(req.user.role)) {
    res.status(403);
    throw new Error('Not authorized to view this receipt');
  }

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="TexCycleAI-Receipt-${order._id}.pdf"`);
  doc.pipe(res);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-');
  const money = (n) => `LKR ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ---- Header ----
  doc.fontSize(20).fillColor('#0f766e').text('TexCycle AI', 50, 50);
  doc.fontSize(9).fillColor('#6b7280').text('Sri Lanka Textile Waste Marketplace', 50, 74);
  doc.fontSize(16).fillColor('#111827').text('Order Receipt', 400, 50, { align: 'right' });
  doc.fontSize(9).fillColor('#6b7280').text(`Order #${order._id}`, 400, 72, { align: 'right' });
  doc.text(`Date: ${formatDate(order.createdAt)}`, 400, 86, { align: 'right' });

  doc.moveTo(50, 110).lineTo(545, 110).strokeColor('#e5e7eb').stroke();

  // ---- Buyer / Seller ----
  let y = 125;
  doc.fontSize(10).fillColor('#374151').text('Buyer', 50, y).text('Seller', 300, y);
  y += 15;
  doc.fontSize(9).fillColor('#111827')
    .text(order.buyer?.name || '-', 50, y).text(order.seller?.name || '-', 300, y);
  y += 13;
  doc.fillColor('#6b7280')
    .text(order.buyer?.email || '-', 50, y).text(order.seller?.email || '-', 300, y);
  y += 25;

  // ---- Item table ----
  doc.moveTo(50, y).lineTo(545, y).strokeColor('#e5e7eb').stroke();
  y += 10;
  doc.fontSize(9).fillColor('#6b7280')
    .text('Item', 50, y).text('Qty (kg)', 300, y).text('Price/kg', 380, y).text('Subtotal', 470, y, { align: 'right' });
  y += 15;
  doc.moveTo(50, y).lineTo(545, y).strokeColor('#e5e7eb').stroke();
  y += 10;
  doc.fontSize(10).fillColor('#111827')
    .text(order.materialTitle, 50, y, { width: 240 })
    .text(String(order.quantityKg), 300, y)
    .text(money(order.pricePerKg), 380, y)
    .text(money(order.subtotal), 470, y, { align: 'right' });
  y += 30;

  doc.moveTo(300, y).lineTo(545, y).strokeColor('#e5e7eb').stroke();
  y += 10;
  doc.fontSize(9).fillColor('#6b7280').text('Subtotal', 380, y).text(money(order.subtotal), 470, y, { align: 'right' });
  y += 16;
  doc.text('Delivery Fee', 380, y).text(money(order.deliveryFee), 470, y, { align: 'right' });
  y += 16;
  doc.fontSize(11).fillColor('#0f766e').text('Total', 380, y).text(money(order.totalAmount), 470, y, { align: 'right' });
  y += 35;

  // ---- Delivery & Payment ----
  doc.moveTo(50, y).lineTo(545, y).strokeColor('#e5e7eb').stroke();
  y += 15;
  doc.fontSize(10).fillColor('#374151').text('Delivery Address', 50, y).text('Payment', 300, y);
  y += 15;
  const addr = order.deliveryAddress;
  doc.fontSize(9).fillColor('#111827')
    .text(addr.fullName, 50, y).text(order.paymentMethod === 'card' ? 'Card (simulated)' : 'Cash on Delivery', 300, y);
  y += 13;
  doc.fillColor('#6b7280')
    .text(addr.addressLine, 50, y).text(`Status: ${order.paymentStatus}`, 300, y);
  y += 13;
  doc.text(`${addr.city}, ${addr.district}${addr.postalCode ? ' ' + addr.postalCode : ''}`, 50, y)
    .text(`Order Status: ${order.orderStatus}`, 300, y);
  y += 13;
  doc.text(addr.phone, 50, y).text(`Est. Delivery: ${formatDate(order.estimatedDeliveryDate)}`, 300, y);

  // ---- Footer ----
  doc.fontSize(8).fillColor('#9ca3af')
    .text('This receipt was generated by TexCycle AI. Card payments on this platform are simulated for demo purposes.', 50, 750, { width: 495, align: 'center' });

  doc.end();
});
