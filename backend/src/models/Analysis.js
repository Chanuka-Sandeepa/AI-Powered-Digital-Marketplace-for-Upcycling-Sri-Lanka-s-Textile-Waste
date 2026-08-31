import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    images: { type: [String], default: [] },
    fabricType: { type: String, required: true },
    confidence: { type: Number, required: true },
    defectArea: { type: Number, required: true },
    healthScore: { type: Number, required: true },
    repairability: { type: String, required: true },
    remainingLifespan: { type: Number, required: true },
    material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
    analyzedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('Analysis', analysisSchema);
