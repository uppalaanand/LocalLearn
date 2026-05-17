import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import config from './config/index.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import classRoutes from './routes/classRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import teacherDashRoutes from './routes/teacherDashRoutes.js';
import classManagementRoutes from './routes/classManagementRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
const app = express();

// =============================================
// Security Middleware
// =============================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: [
    'https://local-learn-frontend.vercel.app',
    'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', cors());

// =============================================
// Body Parsing & Utilities
// =============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// MongoDB injection prevention
app.use(mongoSanitize());

// Logging (development only)
if (config.env === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
// app.use('/api', apiLimiter);

// Static files (uploads)
app.use('/uploads', express.static('uploads'));

// =============================================
// API Routes
// =============================================
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherDashRoutes);
app.use('/api/class-management', classManagementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/messages', messageRoutes);
// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'LocalLearn API is running',
    environment: config.env,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
