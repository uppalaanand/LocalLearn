import mongoose from 'mongoose';

const teacherProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    featured: { type: Boolean, default: true },
    photo: {
      type: String,
      default: '',
    },
    experience: {
      type: String,
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    certifications: {
      type: [String],
      default: [],
    },
    locationName: {
      type: String,
      default: '',
    },
    about: {
      type: String,
      default: '',
      maxlength: [2000, 'About cannot exceed 2000 characters'],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    subjects: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

teacherProfileSchema.index({ rating: -1 });
teacherProfileSchema.index({ user: 1 });

const TeacherProfile = mongoose.model('TeacherProfile', teacherProfileSchema);
export default TeacherProfile;
