import Notification from '../models/Notification.js';
import { weekday, validateSession } from '../utils/schedule.js';
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
  const cls = req.classRecord || await Class.findById(req.params.id);
  if (!cls) {
    return next(ApiError.notFound('Class not found'));
  }

  const [announcements, schedule, newestChat, enrollments] = await Promise.all([
    Announcement.find({ class: cls._id }).sort({ createdAt: -1 }).lean(),
    Schedule.find({ class: cls._id }).sort({ date: 1, startTime: 1 }).lean(),
    Message.find({ class: cls._id }).sort({ createdAt: -1 }).limit(100).lean(),
    Enrollment.find({ class: cls._id, status: 'active' }).populate('student', 'name email').lean(),
  ]);
  const chat = newestChat.reverse();

  const attendanceCounts = await Attendance.aggregate([
    { $match: { class: cls._id } },
    { $group: { _id: '$student', total: { $sum: 1 }, present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } } } },
  ]);
  const attendanceByStudent = new Map(attendanceCounts.map(a => [String(a._id), a]));
  const students = enrollments.map((e) => ({
    id: e.student._id,
    joinedAt: e.joinedAt,
    attendedCount: attendanceByStudent.get(String(e.student._id))?.present || 0,
    sessionCount: attendanceByStudent.get(String(e.student._id))?.total || 0,
    name: e.student.name,
    attendance: e.attendance,
    paymentStatus: (req.classRecord?.price === 0) ? 'Free' : e.paymentStatus === 'paid' ? 'Paid' : e.paymentStatus === 'overdue' ? 'Overdue' : 'Pending',
  }));

  const response = ApiResponse.success({
    classId: cls._id,
    title: cls.title,
    teacherId: cls.teacher,
    chatMuted: cls.chatMuted,
    price: cls.price,
    announcements: announcements.map((a) => ({
      id: a._id,
      text: a.text,
      date: a.date,
      author: a.authorName,
    })),
    schedule: schedule.map((s) => ({
      id: s._id,
      date: s.date,
      day: weekday(s.date),
      time: s.time,
      startTime: s.startTime,
      endTime: s.endTime,
      topic: s.topic,
    })),
    chat: chat.map((m) => ({
      id: m._id,
      sender: m.senderName,
      senderId: m.sender,
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
  const cls = req.classRecord || await Class.findById(req.params.id);
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
  const cls = req.classRecord || await Class.findById(req.params.id);
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
  const cls = req.classRecord || await Class.findById(req.params.id);
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
  const cls = req.classRecord || await Class.findById(req.params.id);
  if (!cls) return next(ApiError.notFound('Class not found'));

  const error = validateSession(req.body);
  if (error) return next(ApiError.badRequest(error));
  const session = await Schedule.create({
    class: cls._id,
    date: req.body.date,
    day: weekday(req.body.date),
    time: req.body.time,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    topic: req.body.topic?.trim() || 'Class Session',
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
  const error = validateSession(req.body);
  if (error) return next(ApiError.badRequest(error));
  const { date, startTime, endTime, topic } = req.body;
  const session = await Schedule.findOneAndUpdate(
    { _id: req.params.sessionId, class: req.params.id },
    { date, startTime, endTime, topic: topic?.trim() || 'Class Session', day: weekday(date), time: `${startTime} - ${endTime}` },
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
  const cls = req.classRecord || await Class.findById(req.params.id);
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
export const sendMessage = asyncHandler(async (req, res, next) => {
  if (req.classRecord.chatMuted && String(req.classRecord.teacher) !== String(req.user._id)) return next(ApiError.forbidden('The teacher has muted this chat'));
  if (typeof req.body.text !== 'string' || !req.body.text.trim()) return next(ApiError.badRequest('Message text is required'));
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
    senderId: message.sender,
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
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const response = ApiResponse.success(
    messages.reverse().map((m) => ({
      id: m._id,
      sender: m.senderName,
      senderId: m.sender,
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
export const markAttendance = asyncHandler(async (req, res, next) => {
  const { records } = req.body;
  if (!Array.isArray(records) || !records.length) return next(ApiError.badRequest('No students to mark attendance for'));
  const members = await Enrollment.find({ class: req.params.id, status: 'active' }).distinct('student');
  const memberIds = new Set(members.map(String));
  if (records.some(r => !memberIds.has(String(r.studentId)) || !['present', 'absent', 'late'].includes(r.status))) return next(ApiError.badRequest('Attendance must contain enrolled students and a valid status'));
  if (new Set(records.map(r => String(r.studentId))).size !== records.length) return next(ApiError.badRequest('Duplicate students in attendance'));
  const date = new Date(); date.setUTCHours(0, 0, 0, 0);

  const attendanceRecords = await Promise.all(
    records.map(async (record) => {
      return Attendance.findOneAndUpdate(
        { class: req.params.id, student: record.studentId, date },
        { status: record.status, markedBy: req.user._id },
        { new: true, upsert: true, runValidators: true }
      );
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

  const cls = req.classRecord || await Class.findById(req.params.id);

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
    joinedAt: e.joinedAt,
    name: e.student.name,
    attendance: e.attendance,
    paymentStatus: (req.classRecord?.price === 0) ? 'Free' : e.paymentStatus === 'paid' ? 'Paid' : e.paymentStatus === 'overdue' ? 'Overdue' : 'Pending',
    joinedAt: e.joinedAt,
  }));

  const response = ApiResponse.success(members);
  res.status(response.statusCode).json(response);
});

export const deleteMessage = asyncHandler(async (req, res, next) => {
  const message = await Message.findOne({ _id: req.params.messageId, class: req.params.id });
  if (!message) return next(ApiError.notFound('Message not found'));
  if (String(message.sender) !== String(req.user._id) && String(req.classRecord.teacher) !== String(req.user._id)) return next(ApiError.forbidden('You can only delete your own messages'));
  await message.deleteOne();
  req.app?.get('io')?.to(`class_${req.params.id}`).emit('messageDeleted', { id: req.params.messageId });
  res.json(ApiResponse.success(null, 'Message deleted'));
});
export const sendReminders = asyncHandler(async (req, res) => {
  const cls = req.classRecord;
  const pending = cls.price === 0 ? [] : await Enrollment.find({ class: cls._id, status: 'active', paymentStatus: { $in: ['pending', 'overdue'] } });
  await Notification.insertMany(pending.map(e => ({ user: e.student, classId: cls._id, type: 'payment', title: 'Payment reminder', message: `Payment for ${cls.title} is due. Please contact your teacher.` })));
  res.json(ApiResponse.success({ count: pending.length }, pending.length ? `Reminders sent to ${pending.length} students` : 'No pending payments, nothing to send'));
});
export const inviteStudent = asyncHandler(async (req, res, next) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return next(ApiError.badRequest('Student name and a valid email are required'));
  const student = await User.findOne({ email, role: 'student' });
  if (!student) return next(ApiError.badRequest('No student account has this email. Ask the student to register before sending an in-app invitation.'));
  if (await Enrollment.exists({ class: req.params.id, student: student._id, status: 'active' })) return next(ApiError.conflict('Student is already a member'));
  await Notification.create({ user: student._id, classId: req.params.id, type: 'system', title: 'Class invitation', message: `${req.user.name} invited you to ${req.classRecord.title}. Open the class to request to join.` });
  res.status(201).json(ApiResponse.created(null, 'In-app invitation sent'));
});

export const setChatMuted = asyncHandler(async (req, res, next) => {
  if (String(req.classRecord.teacher) !== String(req.user._id)) return next(ApiError.forbidden('Only the owning teacher can mute chat'));
  if (typeof req.body.muted !== 'boolean') return next(ApiError.badRequest('Muted must be a boolean'));
  req.classRecord.chatMuted = req.body.muted;
  await req.classRecord.save();
  res.json(ApiResponse.success({ muted: req.body.muted }, req.body.muted ? 'Chat muted for students' : 'Chat unmuted'));
});
