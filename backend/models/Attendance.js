import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule',
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      required: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ class: 1, student: 1, date: -1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
