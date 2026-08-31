import Notification from '../models/Notification.js';
import User from '../models/User.js';

// Same pattern as logTraceabilityEvent: a notification failing to save
// should never break the real action (an order, a status change, a
// registration) that triggered it.
export async function createNotification(recipientId, type, title, message, link = '', relatedId = null) {
  try {
    await Notification.create({ recipient: recipientId, type, title, message, link, relatedId });
  } catch (err) {
    console.warn(`[notifications] failed to create "${type}" for user ${recipientId}:`, err.message);
  }
}

// Notifies every admin/super_admin at once (e.g. "new user registered") -
// fetches the recipient list itself so callers don't need to import User
// just to notify the admin group.
export async function notifyAdmins(type, title, message, link = '', relatedId = null) {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } }).select('_id');
    await Promise.all(
      admins.map((admin) => createNotification(admin._id, type, title, message, link, relatedId))
    );
  } catch (err) {
    console.warn(`[notifications] failed to notify admins for "${type}":`, err.message);
  }
}
