import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
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
    studentName: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    text: {
      type: String,
      required: [true, 'Review text is required'],
      maxlength: [1000, 'Review cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reviews: one review per student per class
reviewSchema.index({ class: 1, student: 1 }, { unique: true });

// Static method to calculate average rating for a class
reviewSchema.statics.calcAverageRating = async function (classId) {
  const stats = await this.aggregate([
    { $match: { class: classId } },
    {
      $group: {
        _id: '$class',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const ClassModel = mongoose.model('Class');
  if (stats.length > 0) {
    await ClassModel.findByIdAndUpdate(classId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
    });
  } else {
    await ClassModel.findByIdAndUpdate(classId, { rating: 0 });
  }
};

// Update rating after save
reviewSchema.post('save', function () {
  this.constructor.calcAverageRating(this.class);
});

// Update rating after delete
reviewSchema.post('findOneAndDelete', function (doc) {
  if (doc) {
    doc.constructor.calcAverageRating(doc.class);
  }
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
