import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Announcement text is required'],
      maxlength: [2000, 'Announcement cannot exceed 2000 characters'],
    },
    date: {
      type: String,
      default: () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    },
  },
  {
    timestamps: true,
  }
);

announcementSchema.index({ class: 1, createdAt: -1 });

const Announcement = mongoose.model('Announcement', announcementSchema);
export default Announcement;
