import User from '../models/User.js';
import TeacherProfile from '../models/TeacherProfile.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/tokenUtils.js';
import config from '../config/index.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, phone, location } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(ApiError.conflict('A user with this email already exists.'));
  }

  const userData = { name, email, password, role, phone };
  
  if (location) {
    userData.location = {
      type: 'Point',
      address: typeof location === 'string' ? location : location?.address,
    };
  }

  // Create user
  const user = await User.create(userData);

  // If teacher, create teacher profile
  if (role === 'teacher') {
    await TeacherProfile.create({
      user: user._id,
      photo: `https://picsum.photos/seed/${user._id}/200/200`,
    });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  const response = ApiResponse.created({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      location: user.location,
    },
    accessToken,
  }, 'Registration successful');

  res.status(response.statusCode).json(response);
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user with password field
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(ApiError.unauthorized('Invalid email or password.'));
  }

  // Compare password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(ApiError.unauthorized('Invalid email or password.'));
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const response = ApiResponse.success({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      location: user.location,
      avatar: user.avatar,
    },
    accessToken,
  }, 'Login successful');

  res.status(response.statusCode).json(response);
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  // Clear refresh token from DB
  await User.findByIdAndUpdate(req.user._id, { refreshToken: '' });

  // Clear cookie
  res.clearCookie('refreshToken');

  const response = ApiResponse.success(null, 'Logged out successfully');
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public (requires refresh token cookie)
 */
export const refreshAccessToken = asyncHandler(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    return next(ApiError.unauthorized('No refresh token provided.'));
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    return next(ApiError.unauthorized('Invalid or expired refresh token.'));
  }

  // Find user with matching refresh token
  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    return next(ApiError.unauthorized('Invalid refresh token.'));
  }

  // Generate new tokens
  const newAccessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id);

  // Update refresh token
  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const response = ApiResponse.success({
    accessToken: newAccessToken,
  }, 'Token refreshed');

  res.status(response.statusCode).json(response);
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('favorites');

  let teacherProfile = null;
  if (user.role === 'teacher') {
    teacherProfile = await TeacherProfile.findOne({ user: user._id });
  }

  const response = ApiResponse.success({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      location: user.location,
      favorites: user.favorites,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    },
    teacherProfile,
  });

  res.status(response.statusCode).json(response);
});

/**
 * @desc    Update current user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res, next) => {
  const { name, email, phone, location, avatar } = req.body;

  const updateFields = {};
  if (name) updateFields.name = name;
  if (email) updateFields.email = email;
  if (phone !== undefined) updateFields.phone = phone;
  if (avatar) updateFields.avatar = avatar;
  
  if (location && location.address) {
    updateFields['location.address'] = location.address;
    if (location.coordinates) {
      updateFields['location.coordinates'] = location.coordinates;
    }
  }

  // Check if email is already taken by another user
  if (email) {
    const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (existingUser) {
      return next(ApiError.conflict('Email is already in use by another account.'));
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateFields },
    { new: true, runValidators: true }
  ).select('-password -refreshToken');

  const response = ApiResponse.success({
    user: updatedUser
  }, 'Profile updated successfully');

  res.status(response.statusCode).json(response);
});
