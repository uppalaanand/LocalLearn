import Category from '../models/Category.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import cacheManager from '../cache/cacheManager.js';

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
export const getCategories = asyncHandler(async (req, res) => {
  const cached = cacheManager.get('categories');
  if (cached) {
    return res.status(200).json(ApiResponse.success(cached, 'From cache'));
  }

  const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();

  // Map to frontend format
  const formatted = categories.map((c) => ({
    id: c.slug,
    name: c.name,
    icon: c.icon,
  }));

  cacheManager.set('categories', formatted, 600); // Cache for 10 minutes

  const response = ApiResponse.success(formatted);
  res.status(response.statusCode).json(response);
});
