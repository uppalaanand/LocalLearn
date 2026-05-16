import mongoose from 'mongoose';

const directMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index to quickly find conversations between two users
directMessageSchema.index({ sender: 1, receiver: 1 });
directMessageSchema.index({ receiver: 1, isRead: 1 }); // For querying unread count

const DirectMessage = mongoose.model('DirectMessage', directMessageSchema);
export default DirectMessage;
