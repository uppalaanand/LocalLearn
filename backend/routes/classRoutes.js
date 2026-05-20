import express from 'express';
import {
  getClasses, getFeaturedClasses, getClassById,
  createClass, updateClass, enrollInClass,
  createJoinRequest, getJoinStatus,
  addReview, getReviews, updateReview, deleteReview,
} from '../controllers/classController.js';
import { bookTrial, getTrialStatus } from '../controllers/trialBookingController.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createClassSchema, updateClassSchema, createReviewSchema } from '../validations/classValidation.js';
import { uploadPhotos } from '../middleware/upload.js';

const router = express.Router();

/**
 * Middleware to parse multipart form fields into proper types
 * (multer provides all fields as strings, so we convert them here)
 */
const parseFormFields = (req, res, next) => {
  if (req.body.price) req.body.price = Number(req.body.price);
  if (req.body.maxStudents) req.body.maxStudents = Number(req.body.maxStudents);
  if (req.body.trialPrice) req.body.trialPrice = Number(req.body.trialPrice);
  if (req.body.trialAvailable !== undefined) {
    req.body.trialAvailable = req.body.trialAvailable === 'true' || req.body.trialAvailable === true;
  }
  if (typeof req.body.trialSlots === 'string') {
    try {
      req.body.trialSlots = JSON.parse(req.body.trialSlots);
    } catch {
      req.body.trialSlots = req.body.trialSlots.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  next();
};

// Public routes
router.get('/', optionalAuth, getClasses);
router.get('/featured', getFeaturedClasses);
router.get('/:id', getClassById);
router.get('/:id/reviews', getReviews);

// Protected routes (teacher class CRUD)
router.post('/', protect, authorize('teacher', 'admin'), uploadPhotos, parseFormFields, validate(createClassSchema), createClass);
router.put('/:id', protect, authorize('teacher', 'admin'), uploadPhotos, parseFormFields, validate(updateClassSchema), updateClass);

// Student routes
router.post('/:id/enroll', protect, authorize('student'), enrollInClass);
router.post('/:id/join-request', protect, authorize('student'), createJoinRequest);
router.get('/:id/join-status', protect, authorize('student'), getJoinStatus);
router.post('/:id/reviews', protect, authorize('student'), validate(createReviewSchema), addReview);
router.put('/:id/reviews/:reviewId', protect, authorize('student'), validate(createReviewSchema), updateReview);
router.delete('/:id/reviews/:reviewId', protect, authorize('student'), deleteReview);

// Trial booking routes
router.post('/:id/book-trial', protect, authorize('student'), bookTrial);
router.get('/:id/trial-status', protect, authorize('student'), getTrialStatus);

export default router;

