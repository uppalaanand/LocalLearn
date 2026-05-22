import Class from '../models/Class.js';
import Announcement from '../models/Announcement.js';
import Schedule from '../models/Schedule.js';
import Message from '../models/Message.js';
import Attendance from '../models/Attendance.js';
import Enrollment from '../models/Enrollment.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Get full class management data
 * @route   GET /api/class-management/:id
 * @access  Private
 */
export const getClassManagement = asyncHandler(async (req, res, next) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) {
    return next(ApiError.notFound('Class not found'));
  }

  const announcements = await Announcement.find({ class: cls._id })
    .sort({ createdAt: -1 })
    .lean();

  const schedule = await Schedule.find({ class: cls._id })
    .sort({ createdAt: 1 })
    .lean();

  const chat = await Message.find({ class: cls._id })
    .sort({ createdAt: 1 })
    .limit(100)
    .lean();

  const enrollments = await Enrollment.find({ class: cls._id, status: 'active' })
    .populate('student', 'name email')
    .lean();

  const students = enrollments.map((e) => ({
    id: e.student._id,
    name: e.student.name,
    attendance: e.attendance,
    paymentStatus: e.paymentStatus === 'paid' ? 'Paid' : 'Pending',
  }));

  const response = ApiResponse.success({
    classId: cls._id,
    title: cls.title,
    announcements: announcements.map((a) => ({
      id: a._id,
      text: a.text,
      date: a.date,
      author: a.authorName,
    })),
    schedule: schedule.map((s) => ({
      id: s._id,
      date: s.date,
      day: s.day,
      time: s.time,
      startTime: s.startTime,
      endTime: s.endTime,
      topic: s.topic,
    })),
    chat: chat.map((m) => ({
      id: m._id,
      sender: m.senderName,
      text: m.text,
      time: m.time,
      isTeacher: m.isTeacher,
    })),
    students,
  });

  res.status(response.statusCode).json(response);
});

/**
 * @desc    Create announcement
 * @route   POST /api/class-management/:id/announcements
 * @access  Private (Teacher only)
 */
export const createAnnouncement = asyncHandler(async (req, res, next) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) return next(ApiError.notFound('Class not found'));

  if (cls.teacher.toString() !== req.user._id.toString()) {
    return next(ApiError.forbidden('Only the class teacher can post announcements'));
  }

  const announcement = await Announcement.create({
    class: cls._id,
    author: req.user._id,
    authorName: req.user.name,
    text: req.body.text,
  });

  const response = ApiResponse.created({
    id: announcement._id,
    text: announcement.text,
    date: announcement.date,
    author: announcement.authorName,
  }, 'Announcement created');

  res.status(response.statusCode).json(response);
});

/**
 * @desc    Update announcement
 * @route   PUT /api/class-management/:id/announcements/:announcementId
 * @access  Private (Teacher only)
 */
export const updateAnnouncement = asyncHandler(async (req, res, next) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) return next(ApiError.notFound('Class not found'));

  if (cls.teacher.toString() !== req.user._id.toString()) {
    return next(ApiError.forbidden('Only the class teacher can edit announcements'));
  }

  const announcement = await Announcement.findOne({ _id: req.params.announcementId, class: cls._id });
  if (!announcement) return next(ApiError.notFound('Announcement not found'));

  announcement.text = req.body.text || announcement.text;
  await announcement.save();

  const response = ApiResponse.success({
    id: announcement._id,
    text: announcement.text,
    date: announcement.date,
    author: announcement.authorName,
  }, 'Announcement updated');

  res.status(response.statusCode).json(response);
});

/**
 * @desc    Delete announcement
 * @route   DELETE /api/class-management/:id/announcements/:announcementId
 * @access  Private (Teacher only)
 */
export const deleteAnnouncement = asyncHandler(async (req, res, next) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) return next(ApiError.notFound('Class not found'));

  if (cls.teacher.toString() !== req.user._id.toString()) {
    return next(ApiError.forbidden('Only the class teacher can delete announcements'));
  }

  const announcement = await Announcement.findOne({ _id: req.params.announcementId, class: cls._id });
  if (!announcement) return next(ApiError.notFound('Announcement not found'));

  await Announcement.deleteOne({ _id: announcement._id });

  const response = ApiResponse.success(null, 'Announcement deleted');
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Add schedule session
 * @route   POST /api/class-management/:id/schedule
 * @access  Private (Teacher only)
 */
export const addScheduleSession = asyncHandler(async (req, res, next) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) return next(ApiError.notFound('Class not found'));

  const session = await Schedule.create({
    class: cls._id,
    date: req.body.date,
    day: req.body.day,
    time: req.body.time,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    topic: req.body.topic,
  });

  const response = ApiResponse.created({
    id: session._id,
    date: session.date,
    day: session.day,
    time: session.time,
    startTime: session.startTime,
    endTime: session.endTime,
    topic: session.topic,
  }, 'Session added');

  res.status(response.statusCode).json(response);
});

/**
 * @desc    Update schedule session
 * @route   PUT /api/class-management/:id/schedule/:sessionId
 * @access  Private (Teacher only)
 */
export const updateScheduleSession = asyncHandler(async (req, res, next) => {
  const session = await Schedule.findByIdAndUpdate(
    req.params.sessionId,
    req.body,
    { new: true, runValidators: true }
  );

  if (!session) return next(ApiError.notFound('Session not found'));

  const response = ApiResponse.success(session, 'Session updated');
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Delete schedule session
 * @route   DELETE /api/class-management/:id/schedule/:sessionId
 * @access  Private (Teacher only)
 */
export const deleteScheduleSession = asyncHandler(async (req, res, next) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) return next(ApiError.notFound('Class not found'));

  if (cls.teacher.toString() !== req.user._id.toString()) {
    return next(ApiError.forbidden('Only the class teacher can delete sessions'));
  }

  const session = await Schedule.findOne({ _id: req.params.sessionId, class: cls._id });
  if (!session) return next(ApiError.notFound('Session not found'));

  await Schedule.deleteOne({ _id: session._id });

  const response = ApiResponse.success(null, 'Session deleted');
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Send chat message
 * @route   POST /api/class-management/:id/chat
 * @access  Private
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const message = await Message.create({
    class: req.params.id,
    sender: req.user._id,
    senderName: req.user.name,
    text: req.body.text,
    isTeacher: req.user.role === 'teacher',
  });

  const response = ApiResponse.created({
    id: message._id,
    sender: message.senderName,
    text: message.text,
    time: message.time,
    isTeacher: message.isTeacher,
  }, 'Message sent');

  res.status(response.statusCode).json(response);
});

/**
 * @desc    Get chat messages
 * @route   GET /api/class-management/:id/chat
 * @access  Private
 */
export const getMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({ class: req.params.id })
    .sort({ createdAt: 1 })
    .limit(200)
    .lean();

  const response = ApiResponse.success(
    messages.map((m) => ({
      id: m._id,
      sender: m.senderName,
      text: m.text,
      time: m.time,
      isTeacher: m.isTeacher,
    }))
  );

  res.status(response.statusCode).json(response);
});

/**
 * @desc    Mark attendance for class
 * @route   POST /api/class-management/:id/attendance
 * @access  Private (Teacher only)
 */
export const markAttendance = asyncHandler(async (req, res) => {
  const { records } = req.body; // [{ studentId, status }]

  const attendanceRecords = await Promise.all(
    records.map(async (record) => {
      return Attendance.create({
        class: req.params.id,
        student: record.studentId,
        status: record.status,
        markedBy: req.user._id,
        date: new Date(),
      });
    })
  );

  // Update enrollment attendance percentages
  for (const record of records) {
    const total = await Attendance.countDocuments({
      class: req.params.id,
      student: record.studentId,
    });
    const present = await Attendance.countDocuments({
      class: req.params.id,
      student: record.studentId,
      status: { $in: ['present', 'late'] },
    });
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    await Enrollment.findOneAndUpdate(
      { student: record.studentId, class: req.params.id },
      { attendance: `${percentage}%` }
    );
  }

  const response = ApiResponse.created(attendanceRecords, 'Attendance saved');
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Get attendance records
 * @route   GET /api/class-management/:id/attendance
 * @access  Private
 */
export const getAttendance = asyncHandler(async (req, res) => {
  const records = await Attendance.find({ class: req.params.id })
    .populate('student', 'name')
    .sort({ date: -1 })
    .lean();

  const response = ApiResponse.success(records);
  res.status(response.statusCode).json(response);
});

/**
 * @desc    Get payment status for class
 * @route   GET /api/class-management/:id/payments
 * @access  Private
 */
export const getPayments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ class: req.params.id, status: 'active' })
    .populate('student', 'name')
    .lean();

  const cls = await Class.findById(req.params.id);

  const payments = enrollments.map((e) => ({
    studentId: e.student._id,
    studentName: e.student.name,
    amount: cls?.price || 0,
    status: e.paymentStatus === 'paid' ? 'Paid' : 'Pending',
  }));

  // Calculate totals
  const collected = payments.filter((p) => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
  const pending = payments.filter((p) => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);

  const response = ApiResponse.success({
    students: payments,
    summary: {
      collected,
      pending,
      total: collected + pending,
    },
  });

  res.status(response.statusCode).json(response);
});

/**
 * @desc    Get class members
 * @route   GET /api/class-management/:id/members
 * @access  Private
 */
export const getMembers = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ class: req.params.id, status: 'active' })
    .populate('student', 'name email')
    .lean();

  const members = enrollments.map((e) => ({
    id: e.student._id,
    name: e.student.name,
    attendance: e.attendance,
    paymentStatus: e.paymentStatus === 'paid' ? 'Paid' : 'Pending',
    joinedAt: e.joinedAt,
  }));

  const response = ApiResponse.success(members);
  res.status(response.statusCode).json(response);
});
