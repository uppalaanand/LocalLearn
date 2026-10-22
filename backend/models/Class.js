import mongoose from 'mongoose';

const classSchema = new mongoose.Schema(
  {
    chatMuted: { type: Boolean, default: false },
    title: {
      type: String,
      required: [true, 'Class title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    academyName: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [78.3800, 17.4400],
      },
      address: {
        type: String,
        default: '',
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    priceUnit: {
      type: String,
      enum: ['month', 'session', 'hour', 'week'],
      default: 'month',
    },
    pricingTiers: {
      first50: { type: Number, default: 0 },
      next100: { type: Number, default: 0 },
      standard: { type: Number, default: 0 },
      currentEnrolled: { type: Number, default: 0 },
    },
    schedule: {
      type: String,
      default: '',
    },
    time: {
      type: String,
      default: '',
    },
    ageGroup: {
      type: String,
      default: '',
    },
    skillLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
      default: 'All Levels',
    },
    photos: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    studentsCount: {
      type: Number,
      default: 0,
    },
    maxStudents: {
      type: Number,
      default: 200,
    },
    trialAvailable: {
      type: Boolean,
      default: false,
    },
    trialPrice: {
      type: Number,
      default: 0,
    },
    trialSlots: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    distance: {
      type: String,
      default: '0 km',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for reviews
classSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'class',
});

// Virtual for announcements
classSchema.virtual('announcements', {
  ref: 'Announcement',
  localField: '_id',
  foreignField: 'class',
});

// Indexes
classSchema.index({ category: 1 });
classSchema.index({ teacher: 1 });
classSchema.index({ price: 1 });
classSchema.index({ rating: -1 });
classSchema.index({ location: '2dsphere' });
classSchema.index({ title: 'text', description: 'text' });

const Class = mongoose.model('Class', classSchema);
export default Class;
