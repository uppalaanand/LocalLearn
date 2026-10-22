import Class from '../models/Class.js';
import Enrollment from '../models/Enrollment.js';
import Message from '../models/Message.js';
import DirectMessage from '../models/DirectMessage.js';
import { verifyAccessToken } from '../utils/tokenUtils.js';
import User from '../models/User.js';

/**
 * Initialize Socket.IO for real-time class group chat
 */
export const initChatSocket = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.user.name} (${socket.id})`);

    // Join personal room for direct messages
    socket.join(`user_${socket.user._id}`);
    console.log(`📢 ${socket.user.name} joined personal room: user_${socket.user._id}`);

    // Join a class chat room
    const canAccess = async classId => {
      const cls = await Class.findById(classId);
      if (!cls) throw new Error('Class not found');
      if (String(cls.teacher) !== String(socket.user._id) && !await Enrollment.exists({ class: classId, student: socket.user._id, status: 'active' })) throw new Error('Membership required');
      return cls;
    };
    socket.on('joinRoom', async classId => {
      try { await canAccess(classId); socket.join(`class_${classId}`); }
      catch { socket.emit('error', { message: 'Unable to join this class chat' }); }
    });


    // Leave a class chat room
    socket.on('leaveRoom', (classId) => {
      socket.leave(`class_${classId}`);
      console.log(`📤 ${socket.user.name} left room: class_${classId}`);
    });

    // Handle sending a message
    socket.on('sendMessage', async ({ classId, text }) => {
      try {
        const cls = await canAccess(classId);
        if (cls.chatMuted && String(cls.teacher) !== String(socket.user._id)) throw new Error('Chat is muted');
        if (typeof text !== 'string' || !text.trim()) throw new Error('Message required');
        const message = await Message.create({
          class: classId,
          sender: socket.user._id,
          senderName: socket.user.name,
          text,
          isTeacher: socket.user.role === 'teacher',
        });

        const messageData = {
          id: message._id,
          sender: message.senderName,
          text: message.text,
          time: message.time,
          isTeacher: message.isTeacher,
        };

        // Broadcast to all users in the room (including sender)
        io.to(`class_${classId}`).emit('newMessage', messageData);
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle sending a direct message
    socket.on('sendDirectMessage', async ({ receiverId, text }) => {
      try {
        const message = await DirectMessage.create({
          sender: socket.user._id,
          receiver: receiverId,
          text,
          isRead: false,
        });

        const messageData = {
          _id: message._id,
          sender: message.sender,
          receiver: message.receiver,
          text: message.text,
          isRead: message.isRead,
          createdAt: message.createdAt,
        };

        // Broadcast to receiver's personal room
        io.to(`user_${receiverId}`).emit('newDirectMessage', messageData);
        // Also emit back to sender so their UI updates
        socket.emit('newDirectMessage', messageData);
      } catch (error) {
        socket.emit('error', { message: 'Failed to send direct message' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.user.name} (${socket.id})`);
    });
  });
};
