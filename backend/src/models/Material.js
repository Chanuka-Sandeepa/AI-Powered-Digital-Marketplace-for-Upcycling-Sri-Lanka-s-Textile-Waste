import mongoose from 'mongoose';

const aiAnalysisSchema = new mongoose.Schema(
  {
    fabricType: String,
    confidence: Number,
    defectArea: Number,
    healthScore: Number,
    repairability: String,
    remainingLifespan: Number,
    analyzedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const sustainabilitySchema = new mongoose.Schema(
  {
    grade: String, // A+, A, B, C, D
    circularityScore: Number,
    recyclabilityScore: Number,
    carbonReductionPercent: Number,
    waterReductionPercent: Number,
    co2SavedKg: Number,
    waterSavedLiters: Number,
    energySavedKwh: Number,
    landfillDivertedKg: Number,
    sdgImpactScore: Number,
    economicImpactScore: Number,
  },
  { _id: false }
);

const materialSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    category: { type: String, required: [true, 'Category is required'], trim: true },
    condition: { type: String, default: 'Good', trim: true },
    quantity: { type: Number, required: [true, 'Quantity (kg) is required'], min: 0 },
    bundles: { type: Number, min: 0 },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    location: { type: String, required: [true, 'Location is required'], trim: true },
    district: { type: String, default: 'Colombo' },
    province: { type: String, default: 'Western' },
    industryType: { type: String, default: 'Apparel Manufacturing' },
    description: { type: String, required: [true, 'Description is required'] },
    imageUrl: { type: String, default: '' },
    images: { type: [String], default: [] },

    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sellerName: { type: String, required: true },

    status: { type: String, enum: ['available', 'pending', 'sold'], default: 'available', index: true },

    aiAnalysis: { type: aiAnalysisSchema, default: undefined },
    sustainability: { type: sustainabilitySchema, default: undefined },
    sustainabilityScore: { type: Number, min: 0, max: 100 },

    soldAt: { type: Date },
  },
  { timestamps: true }
);

materialSchema.index({ title: 'text', description: 'text', category: 'text', location: 'text' });

export default mongoose.model('Material', materialSchema);
