import express from 'express';
import { getTeacherTrialRequests, acceptTrialRequest, rejectTrialRequest } from '../controllers/trialBookingController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('teacher'));

router.get('/teacher', getTeacherTrialRequests);
router.put('/:id/accept', acceptTrialRequest);
router.put('/:id/reject', rejectTrialRequest);

export default router;
