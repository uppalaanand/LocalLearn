/**
 * Database Seeder
 * Seeds MongoDB with the exact mock data from the frontend
 * ensuring seamless transition from mock to real data.
 *
 * Usage:
 *   node database/seed.js          # Seed data (skip if exists)
 *   node database/seed.js --reset  # Reset and re-seed all data
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

// Import models
import User from '../models/User.js';
import TeacherProfile from '../models/TeacherProfile.js';
import Category from '../models/Category.js';
import Class from '../models/Class.js';
import Review from '../models/Review.js';
import Enrollment from '../models/Enrollment.js';
import Announcement from '../models/Announcement.js';
import Schedule from '../models/Schedule.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import Assignment from '../models/Assignment.js';
import Attendance from '../models/Attendance.js';
import Payment from '../models/Payment.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/locallearn';
const shouldReset = process.argv.includes('--reset');

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    if (shouldReset) {
      console.log('🔄 Resetting database...');
      await Promise.all([
        User.deleteMany({}),
        TeacherProfile.deleteMany({}),
        Category.deleteMany({}),
        Class.deleteMany({}),
        Review.deleteMany({}),
        Enrollment.deleteMany({}),
        Announcement.deleteMany({}),
        Schedule.deleteMany({}),
        Message.deleteMany({}),
        Notification.deleteMany({}),
        Assignment.deleteMany({}),
        Attendance.deleteMany({}),
        Payment.deleteMany({}),
      ]);
      console.log('✅ Database cleared');
    }

    // =========================================
    // 1. SEED CATEGORIES
    // =========================================
    const existingCategories = await Category.countDocuments();
    if (existingCategories === 0) {
      const categories = [
        { name: 'Sports', slug: 'sports', icon: 'Trophy' },
        { name: 'Dance', slug: 'dance', icon: 'Music' },
        { name: 'Music', slug: 'music', icon: 'Mic' },
        { name: 'Academics', slug: 'academics', icon: 'BookOpen' },
        { name: 'Fitness', slug: 'fitness', icon: 'Dumbbell' },
        { name: 'Coding', slug: 'coding', icon: 'Code' },
        { name: 'Arts', slug: 'arts', icon: 'Palette' },
        { name: 'Languages', slug: 'languages', icon: 'Languages' },
      ];
      await Category.insertMany(categories);
      console.log('✅ Categories seeded');
    }

    // =========================================
    // 2. SEED USERS (Teachers + Students + Admin)
    // =========================================
    const existingUsers = await User.countDocuments();
    if (existingUsers === 0) {
      const hashedPassword = await bcrypt.hash('password123', 12);

      // Create teacher users
      const teacher1 = await User.create({
        name: 'Rahul Sharma',
        email: 'rahul@locallearn.com',
        password: hashedPassword,
        role: 'teacher',
        phone: '+91 98765 12345',
        location: { type: 'Point', coordinates: [78.3486, 17.4400], address: 'Gachibowli, Hyderabad' },
      });

      const teacher2 = await User.create({
        name: 'Priya Patel',
        email: 'priya@locallearn.com',
        password: hashedPassword,
        role: 'teacher',
        phone: '+91 98765 12346',
        location: { type: 'Point', coordinates: [78.3878, 17.4486], address: 'Madhapur, Hyderabad' },
      });

      const teacher3 = await User.create({
        name: 'Amit Kumar',
        email: 'amit@locallearn.com',
        password: hashedPassword,
        role: 'teacher',
        phone: '+91 98765 12347',
        location: { type: 'Point', coordinates: [78.3530, 17.4600], address: 'Kondapur, Hyderabad' },
      });

      // Create teacher profiles (matching mock data exactly)
      await TeacherProfile.create({
        user: teacher1._id,
        photo: 'https://picsum.photos/seed/rahul/200/200',
        experience: '8 years',
        skills: ['Cricket coaching', 'Fitness training', 'Kids coaching'],
        certifications: ['BCCI Level 1 Coach', 'First Aid Certified'],
        locationName: 'Gachibowli',
        rating: 4.7,
        reviewsCount: 124,
        about: 'Passionate cricket coach dedicated to nurturing young talent. I believe in strong fundamentals and a positive learning environment.',
        isVerified: true,
      });

      await TeacherProfile.create({
        user: teacher2._id,
        photo: 'https://picsum.photos/seed/priya/200/200',
        experience: '5 years',
        skills: ['Classical dance', 'Bollywood dance', 'Zumba'],
        certifications: ['Diploma in Bharatanatyam', 'Zumba Instructor'],
        locationName: 'Madhapur',
        rating: 4.9,
        reviewsCount: 89,
        about: 'Dance is my life. I love teaching kids and adults alike, helping them find joy in movement and expression.',
        isVerified: true,
      });

      await TeacherProfile.create({
        user: teacher3._id,
        photo: 'https://picsum.photos/seed/amit/200/200',
        experience: '12 years',
        skills: ['Mathematics', 'Physics', 'Competitive Exams'],
        certifications: ['M.Sc Mathematics', 'B.Ed'],
        locationName: 'Kondapur',
        rating: 4.8,
        reviewsCount: 210,
        about: 'Making math easy and fun for over a decade. I focus on conceptual clarity rather than rote memorization.',
        isVerified: true,
      });

      // Create student users
      const student1 = await User.create({
        name: 'Aarav M.',
        email: 'student@locallearn.com',
        password: hashedPassword,
        role: 'student',
        phone: '+91 98765 43210',
        location: { type: 'Point', coordinates: [78.3700, 17.4500], address: 'Mumbai, Maharashtra' },
      });

      const student2 = await User.create({
        name: 'Rohan K.',
        email: 'rohan@locallearn.com',
        password: hashedPassword,
        role: 'student',
        phone: '+91 98765 43211',
      });

      const student3 = await User.create({
        name: 'Kabir D.',
        email: 'kabir@locallearn.com',
        password: hashedPassword,
        role: 'student',
        phone: '+91 98765 43212',
      });

      // Admin user
      await User.create({
        name: 'Admin',
        email: 'admin@locallearn.com',
        password: hashedPassword,
        role: 'admin',
      });

      console.log('✅ Users seeded');

      // =========================================
      // 3. SEED CLASSES (matching mock data)
      // =========================================
      const class1 = await Class.create({
        title: 'Beginner Cricket Coaching',
        teacher: teacher1._id,
        academyName: 'Rising Stars Cricket Academy',
        distance: '1.2 km',
        rating: 4.7,
        price: 2500,
        priceUnit: 'month',
        pricingTiers: { first50: 2000, next100: 2200, standard: 2500, currentEnrolled: 45 },
        description: 'Perfect for kids starting their cricket journey. We cover batting, bowling, and fielding basics.',
        schedule: 'Mon, Wed, Fri',
        time: '5:00 PM - 6:30 PM',
        ageGroup: '10–15 years',
        skillLevel: 'Beginner',
        category: 'sports',
        photos: ['https://picsum.photos/seed/cricket1/600/400', 'https://picsum.photos/seed/cricket2/600/400'],
        studentsCount: 45,
        maxStudents: 200,
        trialAvailable: true,
        trialPrice: 100,
        location: { type: 'Point', coordinates: [78.3486, 17.4400], address: 'Gachibowli' },
      });

      const class2 = await Class.create({
        title: 'Bollywood Dance for Kids',
        teacher: teacher2._id,
        academyName: 'Rhythm Dance Studio',
        distance: '2.5 km',
        rating: 4.9,
        price: 1500,
        priceUnit: 'month',
        pricingTiers: { first50: 1000, next100: 1200, standard: 1500, currentEnrolled: 60 },
        description: 'Fun and energetic Bollywood dance classes for children. Great for fitness and building confidence.',
        schedule: 'Tue, Thu',
        time: '4:30 PM - 5:30 PM',
        ageGroup: '6–12 years',
        skillLevel: 'All Levels',
        category: 'dance',
        photos: ['https://picsum.photos/seed/dance1/600/400'],
        studentsCount: 60,
        maxStudents: 150,
        trialAvailable: true,
        trialPrice: 0,
        location: { type: 'Point', coordinates: [78.3878, 17.4486], address: 'Madhapur' },
      });

      const class3 = await Class.create({
        title: 'Class 10 Math Tuition',
        teacher: teacher3._id,
        academyName: 'Kumar Tutorials',
        distance: '0.8 km',
        rating: 4.8,
        price: 3000,
        priceUnit: 'month',
        pricingTiers: { first50: 2500, next100: 2800, standard: 3000, currentEnrolled: 160 },
        description: 'Comprehensive math tuition covering the entire syllabus with regular tests and doubt-clearing sessions.',
        schedule: 'Mon to Sat',
        time: '6:00 PM - 7:00 PM',
        ageGroup: '14-16 years',
        skillLevel: 'Intermediate',
        category: 'academics',
        photos: ['https://picsum.photos/seed/math1/600/400'],
        studentsCount: 160,
        maxStudents: 200,
        trialAvailable: false,
        trialPrice: 0,
        location: { type: 'Point', coordinates: [78.3530, 17.4600], address: 'Kondapur' },
      });

      console.log('✅ Classes seeded');

      // =========================================
      // 4. SEED REVIEWS
      // =========================================
      await Review.create({
        class: class1._id,
        student: student1._id,
        studentName: 'Aarav M.',
        rating: 5,
        text: 'Rahul sir is the best! I learned so much in just one month.',
      });

      await Review.create({
        class: class1._id,
        student: student2._id,
        studentName: 'Neha S. (Parent)',
        rating: 4,
        text: 'Great coaching, but sometimes the batch is a bit crowded.',
      });

      await Review.create({
        class: class2._id,
        student: student1._id,
        studentName: 'Riya K.',
        rating: 5,
        text: 'I love dancing to my favorite songs!',
      });

      console.log('✅ Reviews seeded');

      // =========================================
      // 5. SEED ENROLLMENTS
      // =========================================
      await Enrollment.create({
        student: student1._id,
        class: class1._id,
        status: 'active',
        paymentStatus: 'paid',
        attendance: '85%',
        grade: 'A',
        progress: 75,
      });

      await Enrollment.create({
        student: student1._id,
        class: class3._id,
        status: 'active',
        paymentStatus: 'pending',
        attendance: '95%',
        grade: 'A+',
        progress: 90,
      });

      await Enrollment.create({
        student: student2._id,
        class: class1._id,
        status: 'active',
        paymentStatus: 'pending',
        attendance: '90%',
        grade: 'B+',
        progress: 70,
      });

      await Enrollment.create({
        student: student3._id,
        class: class1._id,
        status: 'active',
        paymentStatus: 'paid',
        attendance: '70%',
        grade: 'B',
        progress: 60,
      });

      // Add favorites for student
      student1.favorites = [class1._id, class2._id];
      await student1.save({ validateBeforeSave: false });

      console.log('✅ Enrollments seeded');

      // =========================================
      // 6. SEED ANNOUNCEMENTS
      // =========================================
      await Announcement.create({
        class: class1._id,
        author: teacher1._id,
        authorName: 'Rahul Sharma',
        text: 'Tomorrow class starts at 5:30 PM instead of 5:00 PM due to ground maintenance.',
        date: 'Oct 24, 2023',
      });

      await Announcement.create({
        class: class1._id,
        author: teacher1._id,
        authorName: 'Rahul Sharma',
        text: 'Please bring your own water bottles.',
        date: 'Oct 20, 2023',
      });

      await Announcement.create({
        class: class2._id,
        author: teacher2._id,
        authorName: 'Priya Patel',
        text: 'Annual performance is scheduled for next month. Please ensure regular attendance.',
        date: 'Nov 1, 2023',
      });

      await Announcement.create({
        class: class3._id,
        author: teacher3._id,
        authorName: 'Amit Kumar',
        text: 'Mock test this Sunday. Please be prepared.',
        date: 'Nov 5, 2023',
      });

      console.log('✅ Announcements seeded');

      // =========================================
      // 7. SEED SCHEDULES
      // =========================================
      await Schedule.create({ class: class1._id, date: 'Oct 25, 2023', day: 'Wednesday', time: '5:30 PM - 7:00 PM', topic: 'Batting stance and grip' });
      await Schedule.create({ class: class1._id, date: 'Oct 27, 2023', day: 'Friday', time: '5:00 PM - 6:30 PM', topic: 'Fielding drills' });
      await Schedule.create({ class: class1._id, date: 'Oct 30, 2023', day: 'Monday', time: '5:00 PM - 6:30 PM', topic: 'Practice match' });
      await Schedule.create({ class: class3._id, date: 'Oct 25, 2023', day: 'Wednesday', time: '6:30 PM - 7:30 PM', topic: 'Quadratic Equations' });
      await Schedule.create({ class: class3._id, date: 'Oct 27, 2023', day: 'Friday', time: '6:30 PM - 7:30 PM', topic: 'Trigonometry Basics' });

      console.log('✅ Schedules seeded');

      // =========================================
      // 8. SEED CHAT MESSAGES
      // =========================================
      await Message.create({ class: class1._id, sender: teacher1._id, senderName: 'Rahul Sharma', text: 'Welcome to the new batch everyone!', isTeacher: true, time: '10:00 AM' });
      await Message.create({ class: class1._id, sender: student2._id, senderName: 'Neha S.', text: 'Thank you sir, Aarav is very excited.', isTeacher: false, time: '10:15 AM' });
      await Message.create({ class: class1._id, sender: teacher1._id, senderName: 'Rahul Sharma', text: 'Please remember to wear proper sports shoes.', isTeacher: true, time: '10:20 AM' });

      console.log('✅ Messages seeded');

      // =========================================
      // 9. SEED NOTIFICATIONS
      // =========================================
      await Notification.create({ user: student1._id, type: 'message', classId: class1._id, title: 'New Message in Cricket', message: 'Coach Rahul: Please bring your own water bottles.', time: '2 hours ago', read: false });
      await Notification.create({ user: student1._id, type: 'payment', classId: class3._id, title: 'Payment Reminder', message: 'Fee for Math Tuition is due in 3 days.', time: '1 day ago', read: true });
      await Notification.create({ user: student1._id, type: 'schedule', classId: class1._id, title: 'Schedule Change', message: 'Cricket class tomorrow moved to 5:30 PM.', time: '2 days ago', read: true });

      console.log('✅ Notifications seeded');

      // =========================================
      // 10. SEED ASSIGNMENTS
      // =========================================
      await Assignment.create({ class: class1._id, student: student1._id, title: 'Batting Stance Video', grade: 'A', date: 'Oct 15' });
      await Assignment.create({ class: class1._id, student: student1._id, title: 'Fielding Drill Quiz', grade: 'B+', date: 'Oct 20' });
      await Assignment.create({ class: class3._id, student: student1._id, title: 'Algebra Worksheet', grade: 'A+', date: 'Oct 10' });
      await Assignment.create({ class: class3._id, student: student1._id, title: 'Geometry Test', grade: 'A', date: 'Oct 18' });

      console.log('✅ Assignments seeded');

      // =========================================
      // 11. SEED ATTENDANCE RECORDS
      // =========================================
      const dates = [new Date('2023-10-25'), new Date('2023-10-23'), new Date('2023-10-20'), new Date('2023-10-18')];
      const statuses = ['present', 'present', 'absent', 'present'];

      for (let i = 0; i < dates.length; i++) {
        await Attendance.create({ class: class1._id, student: student1._id, status: statuses[i], markedBy: teacher1._id, date: dates[i] });
      }

      for (let i = 0; i < 4; i++) {
        await Attendance.create({ class: class3._id, student: student1._id, status: 'present', markedBy: teacher3._id, date: dates[i] });
      }

      console.log('✅ Attendance records seeded');

      // Print login credentials
      console.log('\n========================================');
      console.log('  📋 SEED COMPLETE - Login Credentials');
      console.log('========================================');
      console.log('  Student: student@locallearn.com / password123');
      console.log('  Teacher: rahul@locallearn.com   / password123');
      console.log('  Teacher: priya@locallearn.com   / password123');
      console.log('  Teacher: amit@locallearn.com    / password123');
      console.log('  Admin:   admin@locallearn.com   / password123');
      console.log('========================================\n');
    } else {
      console.log('ℹ️  Users already exist. Skipping seed. Use --reset to re-seed.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();
