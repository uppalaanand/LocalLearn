import mongoose from 'mongoose';

const trialBookingSchema = new mongoose.Schema(
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
    selectedSlot: {
      type: String,
      required: [true, 'A trial slot must be selected'],
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

// A student can only have one pending/accepted trial per class
trialBookingSchema.index({ student: 1, class: 1 });
trialBookingSchema.index({ teacher: 1, status: 1 });

const TrialBooking = mongoose.model('TrialBooking', trialBookingSchema);
export default TrialBooking;
