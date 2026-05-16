import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    isTeacher: {
      type: Boolean,
      default: false,
    },
    time: {
      type: String,
      default: () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ class: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
