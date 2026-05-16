import Enrollment from '../models/Enrollment.js';
import Class from '../models/Class.js';
import Schedule from '../models/Schedule.js';
import Notification from '../models/Notification.js';
import Assignment from '../models/Assignment.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import TeacherProfile from '../models/TeacherProfile.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Get student dashboard data
 * @route   GET /api/student/dashboard
 * @access  Private (Student only)
 */
export const getStudentDashboard = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  // Get enrolled classes
  const enrollments = await Enrollment.find({ student: studentId, status: 'active' })
    .populate('class')
    .lean();

  const joinedClasses = await Promise.all(
    enrollments.map(async (enrollment) => {
      const cls = enrollment.class;
      const teacher = await User.findById(cls.teacher);
      const assignments = await Assignment.find({ class: cls._id, student: studentId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      const attendanceRecords = await Attendance.find({ class: cls._id, student: studentId })
        .sort({ date: -1 })
        .limit(4)
        .lean();

      return {
        classId: cls._id,
        title: cls.title,
        teacherName: teacher?.name || 'Unknown',
        nextSession: 'Today, ' + cls.time?.split('-')[0]?.trim() || '5:00 PM',
        attendance: enrollment.attendance,
        grade: enrollment.grade,
        paymentStatus: enrollment.paymentStatus === 'paid' ? 'Paid' : 'Pending',
        progress: enrollment.progress,
        assignments: assignments.map((a) => ({
          id: a._id,
          title: a.title,
          grade: a.grade,
          date: a.date,
        })),
        attendanceHistory: attendanceRecords.map((r) => ({
          date: r.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          status: r.status.charAt(0).toUpperCase() + r.status.slice(1),
        })),
      };
    })
  );

  // Get combined schedule
  const classIds = enrollments.map((e) => e.class._id);
  const schedules = await Schedule.find({ class: { $in: classIds } })
    .sort({ createdAt: 1 })
    .lean();

  const combinedSchedule = await Promise.all(
    schedules.map(async (session) => {
      const cls = await Class.findById(session.class);
      return {
        id: session._id,
        classId: session.class,
        title: cls?.title || '',
        date: session.date,
        day: session.day,
        time: session.time,
        topic: session.topic,
      };
    })
  );

  // Get notifications
  const notifications = await Notification.find({ user: studentId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const formattedNotifications = notifications.map((n) => ({
    id: n._id,
    type: n.type,
    classId: n.classId,
    title: n.title,
    message: n.message,
    time: n.time,
    read: n.read,
  }));

  const response = ApiResponse.success({
    studentName: req.user.name,
    joinedClasses,
    combinedSchedule,
    notifications: formattedNotifications,
  });

  res.status(response.statusCode).json(response);
});

/**
 * @desc    Get student favorites
 * @route   GET /api/student/favorites
 * @access  Private
 */
export const getStudentFavorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('favorites');

  const favorites = await Promise.all(
    (user.favorites || []).map(async (cls) => {
      const teacherProfile = await TeacherProfile.findOne({ user: cls.teacher }).lean();
      const teacher = await User.findById(cls.teacher);
      return {
        ...cls.toObject(),
        id: cls._id,
        teacherId: cls.teacher,
        teacherName: teacher?.name || '',
        teacherPhoto: teacherProfile?.photo || '',
      };
    })
  );

  const response = ApiResponse.success(favorites);
  res.status(response.statusCode).json(response);
});
