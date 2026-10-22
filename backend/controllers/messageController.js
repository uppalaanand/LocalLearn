import mongoose from 'mongoose';
import DirectMessage from '../models/DirectMessage.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Get all conversations for the current user
 * @route   GET /api/messages/conversations
 * @access  Private
 */
export const getConversations = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);

  const conversations = await DirectMessage.aggregate([
    {
      $match: {
        $or: [{ sender: userId }, { receiver: userId }],
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: {
          $cond: [{ $eq: ['$sender', userId] }, '$receiver', '$sender'],
        },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$isRead', false] }] },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: '$user',
    },
    {
      $project: {
        _id: 0,
        user: {
          _id: '$user._id',
          name: '$user.name',
          avatar: '$user.avatar',
          role: '$user.role',
        },
        lastMessage: {
          text: '$lastMessage.text',
          createdAt: '$lastMessage.createdAt',
          isRead: '$lastMessage.isRead',
          sender: '$lastMessage.sender',
        },
        unreadCount: 1,
      },
    },
    {
      $sort: { 'lastMessage.createdAt': -1 },
    },
  ]);

  // For each conversation, also populate teacher photo if they are a teacher
  // To avoid complexity, we just use avatar if present. 

  const response = ApiResponse.success(conversations);
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Get direct messages with a specific user
 * @route   GET /api/messages/:userId
 * @access  Private
 */
export const getDirectMessages = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const otherUserId = req.params.userId;
  if (!await User.exists({ _id: otherUserId })) return next(ApiError.notFound('User not found'));

  const messages = await DirectMessage.find({
    $or: [
      { sender: userId, receiver: otherUserId },
      { sender: otherUserId, receiver: userId },
    ],
  }).sort({ createdAt: 1 });

  const response = ApiResponse.success(messages);
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Mark all messages from a specific user as read
 * @route   POST /api/messages/:userId/read
 * @access  Private
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const otherUserId = req.params.userId;

  await DirectMessage.updateMany(
    { sender: otherUserId, receiver: userId, isRead: false },
    { $set: { isRead: true } }
  );

  const response = ApiResponse.success({ success: true }, 'Messages marked as read');
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Get total unread message count
 * @route   GET /api/messages/unread-count
 * @access  Private
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const count = await DirectMessage.countDocuments({
    receiver: userId,
    isRead: false,
  });

  const response = ApiResponse.success({ count });
  res.status(response.statusCode).json(response);
});

export default {
  getConversations,
  getDirectMessages,
  markAsRead,
  getUnreadCount,
};

export const sendDirectMessage = asyncHandler(async (req, res, next) => {
  const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
  if (!text || text.length > 2000) return next(ApiError.badRequest('Message must contain 1 to 2000 characters'));
  if (!await User.exists({ _id: req.params.userId })) return next(ApiError.notFound('Recipient not found'));
  const message = await DirectMessage.create({ sender: req.user._id, receiver: req.params.userId, text });
  const io = req.app?.get('io');
  io?.to(`user_${req.params.userId}`).to(`user_${req.user._id}`).emit('newDirectMessage', message);
  res.status(201).json(ApiResponse.created(message, 'Message sent'));
});
export const deleteDirectMessage = asyncHandler(async (req, res, next) => {
  const message = await DirectMessage.findOne({ _id: req.params.messageId, sender: req.user._id, receiver: req.params.userId });
  if (!message) return next(ApiError.notFound('Your message was not found'));
  await message.deleteOne();
  req.app?.get('io')?.to(`user_${message.receiver}`).to(`user_${message.sender}`).emit('directMessageDeleted', { id: message._id });
  res.json(ApiResponse.success(null, 'Message deleted'));
});
