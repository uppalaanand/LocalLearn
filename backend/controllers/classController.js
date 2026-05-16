import Class from '../models/Class.js';
import TeacherProfile from '../models/TeacherProfile.js';
import Review from '../models/Review.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import cacheManager from '../cache/cacheManager.js';

/**
 * @desc    Get all classes with filtering, sorting, pagination
 * @route   GET /api/classes
 * @access  Public
 */
export const getClasses = asyncHandler(async (req, res) => {
  const {
    q, category, minPrice, maxPrice, minRating, sortBy,
    page = 1, limit = 20, distance,
  } = req.query;

  // Build query
  const query = { isActive: true };

  // Text search
  if (q) {
    query.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
    ];
  }

  // Category filter
  if (category) {
    query.category = category;
  }

  // Price filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Rating filter
  if (minRating) {
    query.rating = { $gte: Number(minRating) };
  }

  // Sorting
  let sort = {};
  switch (sortBy) {
    case 'price':
      sort = { price: 1 };
      break;
    case 'rating':
      sort = { rating: -1 };
      break;
    case 'distance':
      sort = { distance: 1 };
      break;
    default:
      sort = { createdAt: -1 };
  }

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);

  const [classes, total] = await Promise.all([
    Class.find(query)
      .populate('teacher', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Class.countDocuments(query),
  ]);

  // Attach teacher profile data
  const classesWithTeacher = await Promise.all(
    classes.map(async (cls) => {
      const teacherProfile = await TeacherProfile.findOne({ user: cls.teacher._id }).lean();
      return {
        ...cls,
        id: cls._id,
        teacherId: cls.teacher._id,
        teacherName: cls.teacher.name,
        teacherPhoto: teacherProfile?.photo || cls.teacher.avatar || '',
        teacherRating: teacherProfile?.rating || 0,
        teacherReviewsCount: teacherProfile?.reviewsCount || 0,
      };
    })
  );

  const response = ApiResponse.success({
    classes: classesWithTeacher,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });

  res.status(response.statusCode).json(response);
});

/**
 * @desc    Get featured classes for homepage
 * @route   GET /api/classes/featured
 * @access  Public
 */
export const getFeaturedClasses = asyncHandler(async (req, res) => {
  // Check cache first
  const cached = cacheManager.get('featured_classes');
  if (cached) {
    return res.status(200).json(ApiResponse.success(cached, 'From cache'));
  }

  const classes = await Class.find({ isActive: true })
    .populate('teacher', 'name avatar')
    .sort({ rating: -1 })
    .limit(6)
    .lean();

  const classesWithTeacher = await Promise.all(
    classes.map(async (cls) => {
      const teacherProfile = await TeacherProfile.findOne({ user: cls.teacher._id }).lean();
      const reviews = await Review.find({ class: cls._id }).lean();
      return {
        ...cls,
        id: cls._id,
        teacherId: cls.teacher._id,
        teacherName: cls.teacher.name,
        teacherPhoto: teacherProfile?.photo || '',
        reviews,
      };
    })
  );

  // Cache for 5 minutes
  cacheManager.set('featured_classes', classesWithTeacher, 300);

  const response = ApiResponse.success(classesWithTeacher);
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Get single class by ID
 * @route   GET /api/classes/:id
 * @access  Public
 */
export const getClassById = asyncHandler(async (req, res, next) => {
  const cls = await Class.findById(req.params.id)
    .populate('teacher', 'name avatar')
    .lean();

  if (!cls) {
    return next(ApiError.notFound('Class not found'));
  }

  // Get teacher profile
  const teacherProfile = await TeacherProfile.findOne({ user: cls.teacher._id }).lean();

  // Get reviews
  const reviews = await Review.find({ class: cls._id }).sort({ createdAt: -1 }).lean();

  // Get announcements
  const Announcement = (await import('../models/Announcement.js')).default;
  const announcements = await Announcement.find({ class: cls._id }).sort({ createdAt: -1 }).lean();

  const classData = {
    ...cls,
    id: cls._id,
    teacherId: cls.teacher._id,
    reviews,
    announcements: announcements.map((a) => ({
      id: a._id,
      text: a.text,
      date: a.date,
      author: a.authorName,
    })),
    teacher: {
      id: cls.teacher._id,
      name: cls.teacher.name,
      photo: teacherProfile?.photo || cls.teacher.avatar || '',
      experience: teacherProfile?.experience || '',
      skills: teacherProfile?.skills || [],
      certifications: teacherProfile?.certifications || [],
      location: teacherProfile?.locationName || '',
      rating: teacherProfile?.rating || 0,
      reviewsCount: teacherProfile?.reviewsCount || 0,
      about: teacherProfile?.about || '',
    },
  };

  const response = ApiResponse.success(classData);
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Create a new class
 * @route   POST /api/classes
 * @access  Private (Teacher only)
 */
export const createClass = asyncHandler(async (req, res) => {
  const classData = {
    ...req.body,
    teacher: req.user._id,
    pricingTiers: {
      first50: req.body.pricingTiers?.first50 || Math.round(req.body.price * 0.8),
      next100: req.body.pricingTiers?.next100 || Math.round(req.body.price * 0.9),
      standard: req.body.pricingTiers?.standard || req.body.price,
      currentEnrolled: 0,
    },
    photos: [`https://picsum.photos/seed/${Date.now()}/600/400`],
  };

  const newClass = await Class.create(classData);

  // Invalidate caches
  cacheManager.delByPrefix('featured_classes');

  const response = ApiResponse.created(newClass, 'Class created successfully');
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Update a class
 * @route   PUT /api/classes/:id
 * @access  Private (Owner teacher only)
 */
export const updateClass = asyncHandler(async (req, res, next) => {
  let cls = await Class.findById(req.params.id);

  if (!cls) {
    return next(ApiError.notFound('Class not found'));
  }

  // Check ownership
  if (cls.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(ApiError.forbidden('You can only update your own classes'));
  }

  cls = await Class.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  cacheManager.delByPrefix('featured_classes');

  const response = ApiResponse.success(cls, 'Class updated successfully');
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Enroll in a class
 * @route   POST /api/classes/:id/enroll
 * @access  Private (Student only)
 */
export const enrollInClass = asyncHandler(async (req, res, next) => {
  const cls = await Class.findById(req.params.id);

  if (!cls) {
    return next(ApiError.notFound('Class not found'));
  }

  if (cls.studentsCount >= cls.maxStudents) {
    return next(ApiError.badRequest('This class is full'));
  }

  // Check if already enrolled
  const existingEnrollment = await Enrollment.findOne({
    student: req.user._id,
    class: cls._id,
  });

  if (existingEnrollment) {
    return next(ApiError.conflict('You are already enrolled in this class'));
  }

  // Create enrollment
  const enrollment = await Enrollment.create({
    student: req.user._id,
    class: cls._id,
    paymentStatus: 'pending',
  });

  // Update class student count
  cls.studentsCount += 1;
  cls.pricingTiers.currentEnrolled = cls.studentsCount;
  await cls.save();

  cacheManager.delByPrefix('featured_classes');

  const response = ApiResponse.created(enrollment, 'Enrolled successfully');
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Add review for a class
 * @route   POST /api/classes/:id/reviews
 * @access  Private (Enrolled student only)
 */
export const addReview = asyncHandler(async (req, res, next) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) {
    return next(ApiError.notFound('Class not found'));
  }

  // Check if enrolled
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    class: cls._id,
  });

  if (!enrollment) {
    return next(ApiError.forbidden('You must be enrolled to review this class'));
  }

  const review = await Review.create({
    class: cls._id,
    student: req.user._id,
    studentName: req.user.name,
    rating: req.body.rating,
    text: req.body.text,
  });

  const response = ApiResponse.created(review, 'Review added successfully');
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Get reviews for a class
 * @route   GET /api/classes/:id/reviews
 * @access  Public
 */
export const getReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ class: req.params.id })
    .sort({ createdAt: -1 })
    .lean();

  const response = ApiResponse.success(reviews);
  res.status(response.statusCode).json(response);
});
