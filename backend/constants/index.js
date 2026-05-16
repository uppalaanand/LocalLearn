// User roles
export const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
};

// Payment statuses
export const PAYMENT_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  OVERDUE: 'overdue',
};

// Enrollment statuses
export const ENROLLMENT_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Attendance statuses
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
};

// Notification types
export const NOTIFICATION_TYPES = {
  MESSAGE: 'message',
  PAYMENT: 'payment',
  SCHEDULE: 'schedule',
  SYSTEM: 'system',
};

// Default categories with icons (matching frontend mock data)
export const DEFAULT_CATEGORIES = [
  { name: 'Sports', slug: 'sports', icon: 'Trophy' },
  { name: 'Dance', slug: 'dance', icon: 'Music' },
  { name: 'Music', slug: 'music', icon: 'Mic' },
  { name: 'Academics', slug: 'academics', icon: 'BookOpen' },
  { name: 'Fitness', slug: 'fitness', icon: 'Dumbbell' },
  { name: 'Coding', slug: 'coding', icon: 'Code' },
  { name: 'Arts', slug: 'arts', icon: 'Palette' },
  { name: 'Languages', slug: 'languages', icon: 'Languages' },
];
