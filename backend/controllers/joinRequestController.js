import JoinRequest from '../models/JoinRequest.js';
import Enrollment from '../models/Enrollment.js';
import Class from '../models/Class.js';
import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import cacheManager from '../cache/cacheManager.js';

/**
 * @desc    Get all pending join requests for a teacher
 * @route   GET /api/join-requests/teacher
 * @access  Private (Teacher only)
 */
export const getTeacherRequests = asyncHandler(async (req, res) => {
  const requests = await JoinRequest.find({
    teacher: req.user._id,
    status: 'pending',
  })
    .populate('student', 'name avatar email')
    .populate('class', 'title')
    .sort({ createdAt: -1 })
    .lean();

  const formattedRequests = requests.map((req) => ({
    id: req._id,
    studentId: req.student._id,
    studentName: req.student.name,
    studentAvatar: req.student.avatar,
    studentEmail: req.student.email,
    classId: req.class._id,
    className: req.class.title,
    date: req.createdAt,
  }));

  const response = ApiResponse.success(formattedRequests);
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Accept a join request
 * @route   PUT /api/join-requests/:id/accept
 * @access  Private (Teacher only)
 */
export const acceptRequest = asyncHandler(async (req, res, next) => {
  const joinRequest = await JoinRequest.findById(req.params.id).populate('class');

  if (!joinRequest) {
    return next(ApiError.notFound('Join request not found'));
  }

  // Verify ownership
  if (joinRequest.teacher.toString() !== req.user._id.toString()) {
    return next(ApiError.forbidden('Not authorized to accept this request'));
  }

  if (joinRequest.status !== 'pending') {
    return next(ApiError.badRequest('Request is already processed'));
  }

  const cls = joinRequest.class;

  if (cls.studentsCount >= cls.maxStudents) {
    return next(ApiError.badRequest('This class is full'));
  }

  // Create enrollment
  const enrollment = await Enrollment.create({
    student: joinRequest.student,
    class: cls._id,
    paymentStatus: 'pending',
  });

  // Update class student count
  cls.studentsCount += 1;
  cls.pricingTiers.currentEnrolled = cls.studentsCount;
  await cls.save();

  // Update request status
  joinRequest.status = 'accepted';
  await joinRequest.save();

  // Create notification for student
  await Notification.create({
    user: joinRequest.student,
    type: 'system',
    classId: cls._id,
    title: 'Join Request Accepted',
    message: `Your request to join ${cls.title} has been accepted. You are now a member.`,
    time: 'Just now',
  });

  cacheManager.delByPrefix('featured_classes');

  const response = ApiResponse.success(enrollment, 'Request accepted successfully');
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Reject a join request
 * @route   PUT /api/join-requests/:id/reject
 * @access  Private (Teacher only)
 */
export const rejectRequest = asyncHandler(async (req, res, next) => {
  const joinRequest = await JoinRequest.findById(req.params.id);

  if (!joinRequest) {
    return next(ApiError.notFound('Join request not found'));
  }

  // Verify ownership
  if (joinRequest.teacher.toString() !== req.user._id.toString()) {
    return next(ApiError.forbidden('Not authorized to reject this request'));
  }

  if (joinRequest.status !== 'pending') {
    return next(ApiError.badRequest('Request is already processed'));
  }

  // Update request status
  joinRequest.status = 'rejected';
  await joinRequest.save();

  const response = ApiResponse.success({}, 'Request rejected successfully');
  res.status(response.statusCode).json(response);
});
