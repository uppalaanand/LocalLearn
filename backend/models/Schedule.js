import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    day: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: false,
    },
    startTime: {
      type: String,
      required: true,
      default: '09:00',
    },
    endTime: {
      type: String,
      required: true,
      default: '10:00',
    },
    topic: {
      type: String,
      required: true,
      maxlength: [300, 'Topic cannot exceed 300 characters'],
    },
  },
  {
    timestamps: true,
  }
);

scheduleSchema.index({ class: 1, createdAt: -1 });

const Schedule = mongoose.model('Schedule', scheduleSchema);
export default Schedule;
