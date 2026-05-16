import express from 'express';
import { getStudentDashboard, getStudentFavorites } from '../controllers/studentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', protect, authorize('student'), getStudentDashboard);
router.get('/favorites', protect, getStudentFavorites);

export default router;
