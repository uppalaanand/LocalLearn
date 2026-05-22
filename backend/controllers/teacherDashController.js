import Class from '../models/Class.js';
import Enrollment from '../models/Enrollment.js';
import Payment from '../models/Payment.js';
import Message from '../models/Message.js';
import Announcement from '../models/Announcement.js';
import Schedule from '../models/Schedule.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Get teacher dashboard data
 * @route   GET /api/teacher/dashboard
 * @access  Private (Teacher only)
 */
export const getTeacherDashboard = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;

  // Get active classes
  const classes = await Class.find({ teacher: teacherId, isActive: true }).lean();

  const activeClasses = await Promise.all(
    classes.map(async (cls) => {
      const enrollmentCount = await Enrollment.countDocuments({ class: cls._id, status: 'active' });
      const pendingPayments = await Enrollment.countDocuments({
        class: cls._id,
        status: 'active',
        paymentStatus: 'pending',
      });

      return {
        classId: cls._id,
        title: cls.title,
        studentsCount: enrollmentCount || cls.studentsCount,
        nextSession: 'Today, ' + (cls.time?.split('-')[0]?.trim() || '5:00 PM'),
        pendingPayments,
      };
    })
  );

  // Get recent messages across all classes
  const classIds = classes.map((c) => c._id);
  const recentMessages = await Message.find({ class: { $in: classIds }, isTeacher: false })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const formattedMessages = recentMessages.map((msg) => ({
    id: msg._id,
    from: msg.senderName,
    text: msg.text,
    time: msg.time,
  }));

  // Get recent announcements across all classes
  const recentAnnouncementsRaw = await Announcement.find({ class: { $in: classIds } })
    .populate('class', 'title')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const recentAnnouncements = recentAnnouncementsRaw.map((ann) => ({
    id: ann._id,
    className: ann.class?.title || 'Unknown Class',
    title: 'New Announcement', // Using a default title or just no title if model doesn't have it
    text: ann.text,
    date: ann.date,
    timestamp: ann.createdAt,
  }));

  // Get combined schedule for teacher
  const schedulesRaw = await Schedule.find({ class: { $in: classIds } })
    .sort({ createdAt: 1 })
    .lean();

  const combinedSchedule = await Promise.all(
    schedulesRaw.map(async (session) => {
      const cls = await Class.findById(session.class);
      return {
        id: session._id,
        classId: session.class,
        title: cls?.title || '',
        date: session.date,
        day: session.day,
        time: session.time,
        startTime: session.startTime,
        endTime: session.endTime,
        topic: session.topic,
      };
    })
  );

  // Calculate stats
  const totalStudents = await Enrollment.countDocuments({
    class: { $in: classIds },
    status: 'active',
  });

  const monthlyPayments = await Payment.aggregate([
    {
      $match: {
        class: { $in: classIds },
        status: 'paid',
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const revenue = monthlyPayments[0]?.total || 0;
  const unreadMessages = await Message.countDocuments({
    class: { $in: classIds },
    isTeacher: false,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });

  const response = ApiResponse.success({
    teacherName: req.user.name,
    activeClasses,
    recentMessages: formattedMessages,
    recentAnnouncements,
    combinedSchedule,
    stats: {
      totalStudents,
      revenue,
      classesToday: classes.length,
      unreadMessages,
    },
  });

  res.status(response.statusCode).json(response);
});
