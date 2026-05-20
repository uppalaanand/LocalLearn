import TrialBooking from '../models/TrialBooking.js';
import Class from '../models/Class.js';
import Notification from '../models/Notification.js';
import DirectMessage from '../models/DirectMessage.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Book a trial class (student)
 * @route   POST /api/classes/:id/book-trial
 * @access  Private (Student only)
 */
export const bookTrial = asyncHandler(async (req, res, next) => {
  const cls = await Class.findById(req.params.id);

  if (!cls) {
    return next(ApiError.notFound('Class not found'));
  }

  if (!cls.trialAvailable) {
    return next(ApiError.badRequest('Trial class is not available for this class'));
  }

  const { selectedSlot } = req.body;

  if (!selectedSlot) {
    return next(ApiError.badRequest('Please select a trial slot'));
  }

  // Validate that the selected slot exists in the class
  if (cls.trialSlots.length > 0 && !cls.trialSlots.includes(selectedSlot)) {
    return next(ApiError.badRequest('Invalid trial slot selected'));
  }

  // Check if student already has a pending or accepted trial for this class
  const existingTrial = await TrialBooking.findOne({
    student: req.user._id,
    class: cls._id,
    status: { $in: ['pending', 'accepted'] },
  });

  if (existingTrial) {
    return next(ApiError.conflict('You already have a pending or accepted trial for this class'));
  }

  const trialBooking = await TrialBooking.create({
    student: req.user._id,
    teacher: cls.teacher,
    class: cls._id,
    selectedSlot,
  });

  // Create notification for teacher
  await Notification.create({
    user: cls.teacher,
    type: 'system',
    classId: cls._id,
    title: 'New Trial Request',
    message: `${req.user.name} has requested a trial class for "${cls.title}" at ${selectedSlot}.`,
    time: 'Just now',
  });

  const response = ApiResponse.created(trialBooking, 'Trial booking request sent successfully');
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Get student's trial booking status for a class
 * @route   GET /api/classes/:id/trial-status
 * @access  Private (Student only)
 */
export const getTrialStatus = asyncHandler(async (req, res) => {
  const existingTrial = await TrialBooking.findOne({
    student: req.user._id,
    class: req.params.id,
  }).sort({ createdAt: -1 });

  const status = existingTrial ? existingTrial.status : 'none';

  const response = ApiResponse.success({ status, trial: existingTrial });
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Get all pending trial requests for a teacher
 * @route   GET /api/trials/teacher
 * @access  Private (Teacher only)
 */
export const getTeacherTrialRequests = asyncHandler(async (req, res) => {
  const requests = await TrialBooking.find({
    teacher: req.user._id,
    status: 'pending',
  })
    .populate('student', 'name avatar email')
    .populate('class', 'title')
    .sort({ createdAt: -1 })
    .lean();

  const formattedRequests = requests.map((r) => ({
    id: r._id,
    studentId: r.student._id,
    studentName: r.student.name,
    studentAvatar: r.student.avatar,
    studentEmail: r.student.email,
    status: r.status,
    classId: r.class._id,
    className: r.class.title,
    selectedSlot: r.selectedSlot,
    date: r.createdAt,
  }));

  const response = ApiResponse.success(formattedRequests);
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Accept a trial request
 * @route   PUT /api/trials/:id/accept
 * @access  Private (Teacher only)
 */
export const acceptTrialRequest = asyncHandler(async (req, res, next) => {
  const trialBooking = await TrialBooking.findById(req.params.id).populate('class');

  if (!trialBooking) {
    return next(ApiError.notFound('Trial request not found'));
  }

  if (trialBooking.teacher.toString() !== req.user._id.toString()) {
    return next(ApiError.forbidden('Not authorized to accept this request'));
  }

  if (trialBooking.status !== 'pending') {
    return next(ApiError.badRequest('Request is already processed'));
  }

  trialBooking.status = 'accepted';
  await trialBooking.save();

  const cls = trialBooking.class;

  // Create notification for student
  const notification = await Notification.create({
    user: trialBooking.student,
    type: 'system',
    classId: cls._id,
    title: 'Trial Request Accepted',
    message: `Your trial request for "${cls.title}" at ${trialBooking.selectedSlot} has been accepted!`,
    time: 'Just now',
  });

  // Send a direct message from teacher to student
  const dmText = `Great news! Your trial class for "${cls.title}" at ${trialBooking.selectedSlot} has been approved. See you there!`;
  const directMessage = await DirectMessage.create({
    sender: req.user._id,
    receiver: trialBooking.student,
    text: dmText,
    isRead: false,
  });

  // Broadcast via socket to student's personal room
  const io = req.app.get('io');
  if (io) {
    io.to(`user_${trialBooking.student}`).emit('newNotification', notification);
    const messageData = {
      _id: directMessage._id,
      sender: directMessage.sender,
      receiver: directMessage.receiver,
      text: directMessage.text,
      isRead: directMessage.isRead,
      createdAt: directMessage.createdAt,
    };
    io.to(`user_${trialBooking.student}`).emit('newDirectMessage', messageData);
  }

  const response = ApiResponse.success(trialBooking, 'Trial request accepted');
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Reject a trial request
 * @route   PUT /api/trials/:id/reject
 * @access  Private (Teacher only)
 */
export const rejectTrialRequest = asyncHandler(async (req, res, next) => {
  const trialBooking = await TrialBooking.findById(req.params.id).populate('class');

  if (!trialBooking) {
    return next(ApiError.notFound('Trial request not found'));
  }

  if (trialBooking.teacher.toString() !== req.user._id.toString()) {
    return next(ApiError.forbidden('Not authorized to reject this request'));
  }

  if (trialBooking.status !== 'pending') {
    return next(ApiError.badRequest('Request is already processed'));
  }

  trialBooking.status = 'rejected';
  await trialBooking.save();

  const cls = trialBooking.class;

  // Create notification for student
  const notification = await Notification.create({
    user: trialBooking.student,
    type: 'system',
    classId: cls._id,
    title: 'Trial Request Rejected',
    message: `Your trial request for "${cls.title}" at ${trialBooking.selectedSlot} has been rejected by the teacher.`,
    time: 'Just now',
  });

  const io = req.app.get('io');
  if (io) {
    io.to(`user_${trialBooking.student}`).emit('newNotification', notification);
  }

  const response = ApiResponse.success({}, 'Trial request rejected');
  res.status(response.statusCode).json(response);
});
