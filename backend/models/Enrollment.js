import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'completed', 'cancelled'],
      default: 'active',
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending', 'overdue'],
      default: 'pending',
    },
    attendance: {
      type: String,
      default: '0%',
    },
    grade: {
      type: String,
      default: '-',
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// One student can only enroll once per class
enrollmentSchema.index({ student: 1, class: 1 }, { unique: true });
enrollmentSchema.index({ student: 1 });
enrollmentSchema.index({ class: 1 });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
export default Enrollment;
