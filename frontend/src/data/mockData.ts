export const categories = [
  { id: 'sports', name: 'Sports', icon: 'Trophy' },
  { id: 'dance', name: 'Dance', icon: 'Music' },
  { id: 'music', name: 'Music', icon: 'Mic' },
  { id: 'academics', name: 'Academics', icon: 'BookOpen' },
  { id: 'fitness', name: 'Fitness', icon: 'Dumbbell' },
  { id: 'coding', name: 'Coding', icon: 'Code' },
  { id: 'arts', name: 'Arts', icon: 'Palette' },
  { id: 'languages', name: 'Languages', icon: 'Languages' },
];

export const teachers = [
  {
    id: 't1',
    name: 'Rahul Sharma',
    photo: 'https://picsum.photos/seed/rahul/200/200',
    experience: '8 years',
    skills: ['Cricket coaching', 'Fitness training', 'Kids coaching'],
    certifications: ['BCCI Level 1 Coach', 'First Aid Certified'],
    location: 'Gachibowli',
    rating: 4.7,
    reviewsCount: 124,
    about: 'Passionate cricket coach dedicated to nurturing young talent. I believe in strong fundamentals and a positive learning environment.',
  },
  {
    id: 't2',
    name: 'Priya Patel',
    photo: 'https://picsum.photos/seed/priya/200/200',
    experience: '5 years',
    skills: ['Classical dance', 'Bollywood dance', 'Zumba'],
    certifications: ['Diploma in Bharatanatyam', 'Zumba Instructor'],
    location: 'Madhapur',
    rating: 4.9,
    reviewsCount: 89,
    about: 'Dance is my life. I love teaching kids and adults alike, helping them find joy in movement and expression.',
  },
  {
    id: 't3',
    name: 'Amit Kumar',
    photo: 'https://picsum.photos/seed/amit/200/200',
    experience: '12 years',
    skills: ['Mathematics', 'Physics', 'Competitive Exams'],
    certifications: ['M.Sc Mathematics', 'B.Ed'],
    location: 'Kondapur',
    rating: 4.8,
    reviewsCount: 210,
    about: 'Making math easy and fun for over a decade. I focus on conceptual clarity rather than rote memorization.',
  }
];

export const classes = [
  {
    id: 'c1',
    title: 'Beginner Cricket Coaching',
    teacherId: 't1',
    academyName: 'Rising Stars Cricket Academy',
    distance: '1.2 km',
    rating: 4.7,
    price: 2500,
    priceUnit: 'month',
    pricingTiers: {
      first50: 2000,
      next100: 2200,
      standard: 2500,
      currentEnrolled: 45 // To show they get the first 50 discount
    },
    description: 'Perfect for kids starting their cricket journey. We cover batting, bowling, and fielding basics.',
    schedule: 'Mon, Wed, Fri',
    time: '5:00 PM - 6:30 PM',
    ageGroup: '10–15 years',
    skillLevel: 'Beginner',
    category: 'sports',
    photos: ['https://picsum.photos/seed/cricket1/600/400', 'https://picsum.photos/seed/cricket2/600/400'],
    reviews: [
      { id: 'r1', studentName: 'Aarav M.', rating: 5, text: 'Rahul sir is the best! I learned so much in just one month.' },
      { id: 'r2', studentName: 'Neha S. (Parent)', rating: 4, text: 'Great coaching, but sometimes the batch is a bit crowded.' }
    ],
    announcements: [
      { id: 'a1', text: 'Tomorrow class starts at 5:30 PM instead of 5:00 PM due to ground maintenance.', date: 'Oct 24, 2023', author: 'Rahul Sharma' },
      { id: 'a2', text: 'Please bring your own water bottles.', date: 'Oct 20, 2023', author: 'Rahul Sharma' }
    ],
    studentsCount: 45,
    maxStudents: 200,
    trialAvailable: true,
    trialPrice: 100,
  },
  {
    id: 'c2',
    title: 'Bollywood Dance for Kids',
    teacherId: 't2',
    academyName: 'Rhythm Dance Studio',
    distance: '2.5 km',
    rating: 4.9,
    price: 1500,
    priceUnit: 'month',
    pricingTiers: {
      first50: 1000,
      next100: 1200,
      standard: 1500,
      currentEnrolled: 60 // To show they get the next 100 discount
    },
    description: 'Fun and energetic Bollywood dance classes for children. Great for fitness and building confidence.',
    schedule: 'Tue, Thu',
    time: '4:30 PM - 5:30 PM',
    ageGroup: '6–12 years',
    skillLevel: 'All Levels',
    category: 'dance',
    photos: ['https://picsum.photos/seed/dance1/600/400'],
    reviews: [
      { id: 'r3', studentName: 'Riya K.', rating: 5, text: 'I love dancing to my favorite songs!' }
    ],
    announcements: [
      { id: 'a3', text: 'Annual performance is scheduled for next month. Please ensure regular attendance.', date: 'Nov 1, 2023', author: 'Priya Patel' }
    ],
    studentsCount: 60,
    maxStudents: 150,
    trialAvailable: true,
    trialPrice: 0,
  },
  {
    id: 'c3',
    title: 'Class 10 Math Tuition',
    teacherId: 't3',
    academyName: 'Kumar Tutorials',
    distance: '0.8 km',
    rating: 4.8,
    price: 3000,
    priceUnit: 'month',
    pricingTiers: {
      first50: 2500,
      next100: 2800,
      standard: 3000,
      currentEnrolled: 160 // To show they pay standard
    },
    description: 'Comprehensive math tuition covering the entire syllabus with regular tests and doubt-clearing sessions.',
    schedule: 'Mon to Sat',
    time: '6:00 PM - 7:00 PM',
    ageGroup: '14-16 years',
    skillLevel: 'Intermediate',
    category: 'academics',
    photos: ['https://picsum.photos/seed/math1/600/400'],
    reviews: [],
    announcements: [
      { id: 'a4', text: 'Mock test this Sunday. Please be prepared.', date: 'Nov 5, 2023', author: 'Amit Kumar' }
    ],
    studentsCount: 160,
    maxStudents: 200,
    trialAvailable: false,
    trialPrice: 0,
  }
];

export const studentDashboardData = {
  studentName: 'Aarav M.',
  joinedClasses: [
    {
      classId: 'c1',
      title: 'Beginner Cricket Coaching',
      teacherName: 'Rahul Sharma',
      nextSession: 'Today, 5:00 PM',
      attendance: '85%',
      grade: 'A',
      paymentStatus: 'Paid',
      progress: 75,
      assignments: [
        { id: 'a1', title: 'Batting Stance Video', grade: 'A', date: 'Oct 15' },
        { id: 'a2', title: 'Fielding Drill Quiz', grade: 'B+', date: 'Oct 20' }
      ],
      attendanceHistory: [
        { date: 'Oct 25', status: 'Present' },
        { date: 'Oct 23', status: 'Present' },
        { date: 'Oct 20', status: 'Absent' },
        { date: 'Oct 18', status: 'Present' }
      ]
    },
    {
      classId: 'c3',
      title: 'Class 10 Math Tuition',
      teacherName: 'Amit Kumar',
      nextSession: 'Today, 6:00 PM',
      attendance: '95%',
      grade: 'A+',
      paymentStatus: 'Pending',
      progress: 90,
      assignments: [
        { id: 'm1', title: 'Algebra Worksheet', grade: 'A+', date: 'Oct 10' },
        { id: 'm2', title: 'Geometry Test', grade: 'A', date: 'Oct 18' }
      ],
      attendanceHistory: [
        { date: 'Oct 25', status: 'Present' },
        { date: 'Oct 24', status: 'Present' },
        { date: 'Oct 23', status: 'Present' },
        { date: 'Oct 20', status: 'Present' }
      ]
    }
  ],
  combinedSchedule: [
    { id: 'cs1', classId: 'c1', title: 'Beginner Cricket Coaching', date: 'Oct 25, 2023', day: 'Wednesday', time: '5:00 PM - 6:30 PM', topic: 'Batting stance and grip' },
    { id: 'cs2', classId: 'c3', title: 'Class 10 Math Tuition', date: 'Oct 25, 2023', day: 'Wednesday', time: '6:30 PM - 7:30 PM', topic: 'Quadratic Equations' },
    { id: 'cs3', classId: 'c1', title: 'Beginner Cricket Coaching', date: 'Oct 27, 2023', day: 'Friday', time: '5:00 PM - 6:30 PM', topic: 'Fielding drills' },
    { id: 'cs4', classId: 'c3', title: 'Class 10 Math Tuition', date: 'Oct 27, 2023', day: 'Friday', time: '6:30 PM - 7:30 PM', topic: 'Trigonometry Basics' },
  ],
  notifications: [
    { id: 'n1', type: 'message', classId: 'c1', title: 'New Message in Cricket', message: 'Coach Rahul: Please bring your own water bottles.', time: '2 hours ago', read: false },
    { id: 'n2', type: 'payment', classId: 'c3', title: 'Payment Reminder', message: 'Fee for Math Tuition is due in 3 days.', time: '1 day ago', read: true },
    { id: 'n3', type: 'schedule', classId: 'c1', title: 'Schedule Change', message: 'Cricket class tomorrow moved to 5:30 PM.', time: '2 days ago', read: true },
  ]
};

export const teacherDashboardData = {
  teacherName: 'Rahul Sharma',
  activeClasses: [
    {
      classId: 'c1',
      title: 'Beginner Cricket Coaching',
      studentsCount: 15,
      nextSession: 'Today, 5:00 PM',
      pendingPayments: 2,
    },
    {
      classId: 'c4',
      title: 'Advanced Batting Clinic',
      studentsCount: 8,
      nextSession: 'Tomorrow, 6:00 AM',
      pendingPayments: 0,
    }
  ],
  recentMessages: [
    { id: 'm1', from: 'Neha S.', text: 'Will Aarav need his own kit tomorrow?', time: '1 hour ago' },
    { id: 'm2', from: 'Vikram R.', text: 'I will be late by 10 mins today.', time: '3 hours ago' }
  ]
};

export const classManagementData = {
  classId: 'c1',
  title: 'Beginner Cricket Coaching',
  announcements: [
    { id: 'a1', text: 'Tomorrow class starts at 5:30 PM instead of 5:00 PM due to ground maintenance.', date: 'Oct 24, 2023', author: 'Rahul Sharma' },
    { id: 'a2', text: 'Please bring your own water bottles.', date: 'Oct 20, 2023', author: 'Rahul Sharma' }
  ],
  schedule: [
    { id: 's1', date: 'Oct 25, 2023', day: 'Wednesday', time: '5:30 PM - 7:00 PM', topic: 'Batting stance and grip' },
    { id: 's2', date: 'Oct 27, 2023', day: 'Friday', time: '5:00 PM - 6:30 PM', topic: 'Fielding drills' },
    { id: 's3', date: 'Oct 30, 2023', day: 'Monday', time: '5:00 PM - 6:30 PM', topic: 'Practice match' }
  ],
  chat: [
    { id: 'msg1', sender: 'Rahul Sharma', text: 'Welcome to the new batch everyone!', time: '10:00 AM', isTeacher: true },
    { id: 'msg2', sender: 'Neha S.', text: 'Thank you sir, Aarav is very excited.', time: '10:15 AM', isTeacher: false },
    { id: 'msg3', sender: 'Rahul Sharma', text: 'Please remember to wear proper sports shoes.', time: '10:20 AM', isTeacher: true }
  ],
  students: [
    { id: 'st1', name: 'Aarav M.', attendance: '85%', paymentStatus: 'Paid' },
    { id: 'st2', name: 'Rohan K.', attendance: '90%', paymentStatus: 'Pending' },
    { id: 'st3', name: 'Kabir D.', attendance: '70%', paymentStatus: 'Paid' },
  ]
};
