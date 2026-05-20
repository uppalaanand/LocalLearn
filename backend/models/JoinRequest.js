import mongoose from 'mongoose';

const joinRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teacher: {
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
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// One student can only have one pending/accepted request per class
joinRequestSchema.index({ student: 1, class: 1 }, { unique: true });
joinRequestSchema.index({ teacher: 1, status: 1 }); // For teacher dashboard queries

const JoinRequest = mongoose.model('JoinRequest', joinRequestSchema);
export default JoinRequest;
