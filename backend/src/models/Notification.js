import mongoose from 'mongoose';

// One model shared by all 4 roles - a seller's "new order" notification and
// an admin's "new user registered" notification are both just rows here,
// distinguished by `type` and `recipient`. Kept intentionally generic
// (title/message/link) so new event types can be added later by any
// controller calling createNotification() - see utils/notifications.js -
// without ever needing a schema change.
const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: [
        'order_placed',       // buyer: your order was placed
        'new_order',          // seller: you received an order
        'order_status_changed', // buyer: seller updated your order's status
        'inquiry_received',   // seller: a buyer messaged you
        'listing_sold_out',   // seller: a listing hit 0 quantity
        'user_registered',    // admin/super_admin: a new account signed up
        'account_status_changed', // buyer/seller: your account was suspended/reactivated
      ],
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' }, // frontend route to navigate to on click
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // e.g. the order/material/user this is about
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
