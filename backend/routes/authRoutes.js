import express from 'express';
import { register, login, logout, refreshAccessToken, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validations/authValidation.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', protect, logout);
router.post('/refresh-token', refreshAccessToken);
router.get('/me', protect, getMe);

export default router;
