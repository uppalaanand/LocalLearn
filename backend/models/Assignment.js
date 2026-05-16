import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    grade: {
      type: String,
      default: '-',
    },
    date: {
      type: String,
      default: () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    },
  },
  {
    timestamps: true,
  }
);

assignmentSchema.index({ class: 1, student: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);
export default Assignment;
