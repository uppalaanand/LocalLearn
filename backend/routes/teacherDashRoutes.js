import express from 'express';
import { getTeacherDashboard } from '../controllers/teacherDashController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', protect, authorize('teacher'), getTeacherDashboard);

export default router;
