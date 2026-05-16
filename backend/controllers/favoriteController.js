import User from '../models/User.js';
import Class from '../models/Class.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Get user favorites
 * @route   GET /api/favorites
 * @access  Private
 */
export const getFavorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const response = ApiResponse.success(user.favorites || []);
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Toggle favorite
 * @route   POST /api/favorites/:classId
 * @access  Private
 */
export const toggleFavorite = asyncHandler(async (req, res, next) => {
  const classId = req.params.classId;

  const cls = await Class.findById(classId);
  if (!cls) {
    return next(ApiError.notFound('Class not found'));
  }

  const user = await User.findById(req.user._id);
  const index = user.favorites.indexOf(classId);

  if (index > -1) {
    // Remove from favorites
    user.favorites.splice(index, 1);
    await user.save({ validateBeforeSave: false });
    const response = ApiResponse.success({ favorites: user.favorites, action: 'removed' }, 'Removed from favorites');
    return res.status(response.statusCode).json(response);
  } else {
    // Add to favorites
    user.favorites.push(classId);
    await user.save({ validateBeforeSave: false });
    const response = ApiResponse.success({ favorites: user.favorites, action: 'added' }, 'Added to favorites');
    return res.status(response.statusCode).json(response);
  }
});

/**
 * @desc    Remove from favorites
 * @route   DELETE /api/favorites/:classId
 * @access  Private
 */
export const removeFavorite = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.favorites = user.favorites.filter((id) => id.toString() !== req.params.classId);
  await user.save({ validateBeforeSave: false });

  const response = ApiResponse.success({ favorites: user.favorites }, 'Removed from favorites');
  res.status(response.statusCode).json(response);
});
