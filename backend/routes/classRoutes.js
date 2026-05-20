import express from 'express';
import {
  getClasses, getFeaturedClasses, getClassById,
  createClass, updateClass, enrollInClass,
  createJoinRequest, getJoinStatus,
  addReview, getReviews, updateReview, deleteReview,
} from '../controllers/classController.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createClassSchema, updateClassSchema, createReviewSchema } from '../validations/classValidation.js';

const router = express.Router();

// Public routes
router.get('/', optionalAuth, getClasses);
router.get('/featured', getFeaturedClasses);
router.get('/:id', getClassById);
router.get('/:id/reviews', getReviews);

// Protected routes
router.post('/', protect, authorize('teacher', 'admin'), validate(createClassSchema), createClass);
router.put('/:id', protect, authorize('teacher', 'admin'), validate(updateClassSchema), updateClass);

// Student routes
router.post('/:id/enroll', protect, authorize('student'), enrollInClass);
router.post('/:id/join-request', protect, authorize('student'), createJoinRequest);
router.get('/:id/join-status', protect, authorize('student'), getJoinStatus);
router.post('/:id/reviews', protect, authorize('student'), validate(createReviewSchema), addReview);
router.put('/:id/reviews/:reviewId', protect, authorize('student'), validate(createReviewSchema), updateReview);
router.delete('/:id/reviews/:reviewId', protect, authorize('student'), deleteReview);

export default router;
