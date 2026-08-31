import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema(
  {
    material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ['open', 'responded', 'closed'], default: 'open' },
  },
  { timestamps: true }
);

export default mongoose.model('Inquiry', inquirySchema);
