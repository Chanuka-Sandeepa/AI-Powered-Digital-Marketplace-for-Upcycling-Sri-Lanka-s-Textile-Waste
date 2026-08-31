import mongoose from 'mongoose';

const deliveryAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    postalCode: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

// One Order per (material, buyer) checkout - a cart spanning multiple
// listings creates one Order per listing, since each listing already has
// its own seller/price/available-quantity and that keeps order fulfillment
// naturally scoped to one seller per order (standard marketplace pattern -
// same reason Etsy/Amazon Marketplace split a multi-seller cart into
// separate orders at checkout).
const orderSchema = new mongoose.Schema(
  {
    // Human-readable tracking code (e.g. TXC-20260816-K3F9Q) - what buyers
    // and sellers actually reference, since a raw Mongo ObjectId isn't
    // something you'd read over the phone or put in an email subject line.
    orderCode: { type: String, unique: true, index: true },

    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },

    // Snapshot of what was actually bought - kept even if the listing is
    // later edited or removed, so order history stays meaningful.
    materialTitle: String,
    materialImageUrl: String,

    quantityKg: { type: Number, required: true, min: 0.1 },
    pricePerKg: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    // Simple, transparent flat-rate estimate (see checkout logic for exact
    // rule) - not a real courier-partner rate, since no logistics
    // integration exists. Shown clearly as an estimate, not a locked-in fee.
    deliveryFee: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    estimatedDeliveryDate: { type: Date },

    deliveryAddress: { type: deliveryAddressSchema, required: true },

    // "card" is a simulated/demo payment (no real payment gateway
    // integration exists) - collected for UI realism and marked paid
    // immediately. "cash" is cash-on-delivery, paymentStatus stays
    // pending until the seller marks it received.
    paymentMethod: { type: String, enum: ['card', 'cash'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },

    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Generates a readable code like TXC-20260816-K3F9Q. Retried on collision
// (astronomically unlikely at this scale, but cheap to guard against) -
// unique index on orderCode is the real safety net, this just makes a
// duplicate a silent retry instead of a failed order.
orderSchema.pre('validate', async function generateOrderCode(next) {
  if (this.orderCode) return next();
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid misreads
  for (let attempt = 0; attempt < 5; attempt++) {
    let suffix = '';
    for (let i = 0; i < 5; i++) suffix += CHARS[Math.floor(Math.random() * CHARS.length)];
    const candidate = `TXC-${datePart}-${suffix}`;
    const exists = await this.constructor.exists({ orderCode: candidate });
    if (!exists) {
      this.orderCode = candidate;
      return next();
    }
  }
  next(new Error('Could not generate a unique order code, please try again'));
});

export default mongoose.model('Order', orderSchema);
