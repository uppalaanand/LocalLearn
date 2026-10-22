import { classAccess } from '../middleware/classAccess.js';
import express from 'express';
import {
  getClassManagement, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  addScheduleSession, updateScheduleSession, deleteScheduleSession, sendMessage, getMessages,
  markAttendance, getAttendance, getPayments, getMembers, deleteMessage, sendReminders, inviteStudent, setChatMuted,
} from '../controllers/classManagementController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use('/:id', protect, classAccess);

router.get('/:id', protect, getClassManagement);
router.post('/:id/announcements', protect, authorize('teacher'), createAnnouncement);
router.put('/:id/announcements/:announcementId', protect, authorize('teacher'), updateAnnouncement);
router.delete('/:id/announcements/:announcementId', protect, authorize('teacher'), deleteAnnouncement);
router.post('/:id/schedule', protect, authorize('teacher'), addScheduleSession);
router.put('/:id/schedule/:sessionId', protect, authorize('teacher'), updateScheduleSession);
router.delete('/:id/schedule/:sessionId', protect, authorize('teacher'), deleteScheduleSession);
router.get('/:id/chat', protect, getMessages);
router.post('/:id/chat', protect, sendMessage);
router.post('/:id/attendance', protect, authorize('teacher'), markAttendance);
router.get('/:id/attendance', protect, getAttendance);
router.get('/:id/payments', protect, getPayments);
router.get('/:id/members', protect, getMembers);

router.delete('/:id/chat/:messageId', deleteMessage);
router.post('/:id/payments/reminders', sendReminders);
router.post('/:id/members/invite', inviteStudent);

router.put('/:id/chat/settings', setChatMuted);

export default router;
