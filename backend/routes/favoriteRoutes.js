import express from 'express';
import { getFavorites, toggleFavorite, removeFavorite } from '../controllers/favoriteController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getFavorites);
router.post('/:classId', protect, toggleFavorite);
router.delete('/:classId', protect, removeFavorite);

export default router;
