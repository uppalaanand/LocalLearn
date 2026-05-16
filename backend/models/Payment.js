import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    month: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['paid', 'pending', 'overdue'],
      default: 'pending',
    },
    receiptNumber: {
      type: String,
      default: () => `INV-${Date.now().toString().slice(-6)}`,
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ student: 1, class: 1 });
paymentSchema.index({ class: 1, status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
