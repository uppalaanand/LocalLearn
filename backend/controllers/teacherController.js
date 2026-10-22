import TeacherProfile from '../models/TeacherProfile.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import cacheManager from '../cache/cacheManager.js';

/**
 * @desc    Get all teachers (top-rated)
 * @route   GET /api/teachers
 * @access  Public
 */
export const getTeachers = asyncHandler(async (req, res) => {
  const cached = cacheManager.get('top_teachers');
  if (cached) {
    return res.status(200).json(ApiResponse.success(cached, 'From cache'));
  }

  const activeTeacherIds = await Class.distinct('teacher', { isActive: true });
  const profiles = await TeacherProfile.find({ user: { $in: activeTeacherIds }, isVerified: true, featured: { $ne: false }, 'skills.0': { $exists: true }, about: { $ne: '' } })
    .populate('user', 'name avatar location')
    .sort({ rating: -1 })
    .lean();

  const teachers = profiles
    .filter(p => p && p.user)
    .map((p) => ({
      id: p.user._id,
      name: p.user.name,
    photo: p.photo || p.user.avatar || '',
    experience: p.experience,
    skills: p.skills,
    certifications: p.certifications,
    location: p.locationName,
    rating: p.rating,
    reviewsCount: p.reviewsCount,
    about: p.about,
  }));

  cacheManager.set('top_teachers', teachers, 300);

  const response = ApiResponse.success(teachers);
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Get teacher profile by user ID
 * @route   GET /api/teachers/:id
 * @access  Public
 */
export const getTeacherById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'teacher') {
    return next(ApiError.notFound('Teacher not found'));
  }

  const profile = await TeacherProfile.findOne({ user: req.params.id }).lean();
  if (!profile) {
    return next(ApiError.notFound('Teacher profile not found'));
  }

  // Get teacher's classes
  const classes = await Class.find({ teacher: req.params.id, isActive: true })
    .sort({ createdAt: -1 })
    .lean();

  const teacher = {
    id: user._id,
    createdAt: user.createdAt,
    name: user.name,
    photo: profile.photo || user.avatar || '',
    experience: profile.experience,
    skills: profile.skills,
    certifications: profile.certifications,
    location: profile.locationName,
    rating: profile.rating,
    reviewsCount: profile.reviewsCount,
    about: profile.about,
    classes: classes.map((c) => ({
      ...c,
      id: c._id,
      teacherId: user._id,
    })),
  };

  const response = ApiResponse.success(teacher);
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Update own teacher profile
 * @route   PUT /api/teachers/profile
 * @access  Private (Teacher only)
 */
export const updateTeacherProfile = asyncHandler(async (req, res, next) => {
  const { name, email, phone, location: locationAddress, experience, skills, certifications, about } = req.body;

  // Update user fields
  if (name !== undefined || email !== undefined || phone !== undefined || locationAddress !== undefined) {
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (phone !== undefined) updateFields.phone = phone;
    if (locationAddress !== undefined) updateFields['location.address'] = locationAddress;
    await User.findByIdAndUpdate(req.user._id, updateFields, { runValidators: true });
  }

  // Update teacher profile
  const profileUpdate = {};
  if (typeof req.body.featured === 'boolean') profileUpdate.featured = req.body.featured;
  if (experience !== undefined) profileUpdate.experience = experience;
  if (skills) profileUpdate.skills = skills;
  if (certifications) profileUpdate.certifications = certifications;
  if (about !== undefined) profileUpdate.about = about;
  if (locationAddress !== undefined) profileUpdate.locationName = locationAddress;

  const profile = await TeacherProfile.findOneAndUpdate(
    { user: req.user._id },
    profileUpdate,
    { new: true, upsert: true, runValidators: true }
  );

  cacheManager.delByPrefix('top_teachers');

  const response = ApiResponse.success(profile, 'Profile updated successfully');
  res.status(response.statusCode).json(response);
});

export default { getTeachers, getTeacherById, updateTeacherProfile };
