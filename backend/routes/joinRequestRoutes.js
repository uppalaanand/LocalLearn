import express from 'express';
import { getTeacherRequests, acceptRequest, rejectRequest } from '../controllers/joinRequestController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('teacher'));

router.get('/teacher', getTeacherRequests);
router.put('/:id/accept', acceptRequest);
router.put('/:id/reject', rejectRequest);

export default router;
