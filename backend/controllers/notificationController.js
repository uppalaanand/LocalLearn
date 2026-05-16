import Notification from '../models/Notification.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const formatted = notifications.map((n) => ({
    id: n._id,
    type: n.type,
    classId: n.classId,
    title: n.title,
    message: n.message,
    read: n.read,
    time: n.time,
  }));

  const response = ApiResponse.success(formatted);
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { read: true });
  const response = ApiResponse.success(null, 'Notification marked as read');
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  const response = ApiResponse.success(null, 'All notifications marked as read');
  res.status(response.statusCode).json(response);
});
