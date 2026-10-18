import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reviewerRole: { type: String, enum: ['buyer', 'seller'], required: true },
    rating: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
    comment: { type: String, required: true, trim: true, minlength: 5, maxlength: 1000 },
    materialTitle: { type: String, default: '' },
  },
  { timestamps: true }
);

// Each participant can leave one review for the other on a delivered order.
reviewSchema.index({ order: 1, reviewer: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);
