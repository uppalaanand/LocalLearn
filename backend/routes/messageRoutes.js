import express from 'express';
import {
  getConversations, sendDirectMessage, deleteDirectMessage,
  getDirectMessages,
  markAsRead,
  getUnreadCount,
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All message routes require authentication
router.use(protect);

router.get('/conversations', getConversations);
router.get('/unread-count', getUnreadCount);
router.get('/:userId', getDirectMessages);
router.post('/:userId/read', markAsRead);

router.post('/:userId', sendDirectMessage);
router.delete('/:userId/:messageId', deleteDirectMessage);

export default router;
