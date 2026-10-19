import asyncHandler from 'express-async-handler';
import Notification from '../models/Notification.js';

// @route GET /api/notifications
// Same list for every role - only ever returns the current user's own
// notifications, so a buyer, seller, admin, or super_admin all hit this
// exact endpoint and each only ever sees their own.
export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));

  const filter = { recipient: req.user._id };
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, read: false }),
  ]);

  res.json({ notifications, page: pageNum, pages: Math.max(1, Math.ceil(total / limitNum)), total, unreadCount });
});

// @route GET /api/notifications/unread-count
// Lightweight endpoint for polling - the sidebar bell badge calls this
// every 30s, not the full list, to keep polling cheap.
export const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false });
  res.json({ unreadCount });
});

// @route PUT /api/notifications/:id/read
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  notification.read = true;
  await notification.save();
  res.json(notification);
});

// @route PUT /api/notifications/read-all
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { $set: { read: true } });
  res.json({ message: 'All notifications marked as read' });
});
