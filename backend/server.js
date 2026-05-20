import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import connectDB from './config/db.js';
import config from './config/index.js';
import { initChatSocket } from './sockets/chatSocket.js';

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: config.clientUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Share io instance with express app
app.set('io', io);

// Initialize chat sockets
initChatSocket(io);

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();

    server.listen(config.port, () => {
      console.log(`\n🚀 ==========================================`);
      console.log(`   LocalLearn API Server`);
      console.log(`   Environment: ${config.env}`);
      console.log(`   Port: ${config.port}`);
      console.log(`   API: http://localhost:${config.port}/api`);
      console.log(`   Health: http://localhost:${config.port}/api/health`);
      console.log(`==========================================\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

startServer();
