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
export const getDirectMessages = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const otherUserId = req.params.userId;

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
