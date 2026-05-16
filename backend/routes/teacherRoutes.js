import express from 'express';
import { getTeachers, getTeacherById, updateTeacherProfile } from '../controllers/teacherController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getTeachers);
router.get('/:id', getTeacherById);
router.put('/profile', protect, authorize('teacher'), updateTeacherProfile);

export default router;
