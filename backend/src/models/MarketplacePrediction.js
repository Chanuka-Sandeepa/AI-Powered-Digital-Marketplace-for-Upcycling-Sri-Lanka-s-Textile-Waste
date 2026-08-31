import mongoose from 'mongoose';

const buyerRecommendationSchema = new mongoose.Schema(
  {
    buyerType: String,
    matchScore: Number,
  },
  { _id: false }
);

const marketplacePredictionSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Optional: not every prediction is tied to a saved listing (the
    // upload wizard can predict a price before the listing exists yet).
    material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },

    // Snapshot of the inputs used, so history stays meaningful even if the
    // underlying listing is later edited or deleted.
    fabricType: String,
    weightKg: Number,
    healthScore: Number,
    defectArea: Number,
    condition: String,
    district: String,
    industryType: String,

    // Results
    predictedPricePerKg: Number,
    demandLevel: { type: String, enum: ['Low', 'Medium', 'High'] },
    demandConfidence: Number,
    recommendedBuyers: { type: [buyerRecommendationSchema], default: [] },
    marketplaceTrend: { type: String, enum: ['Decreasing', 'Increasing', 'Stable'] },
    listingWillSell: Boolean,
    listingSuccessProbability: Number,
    estimatedSalesTimeDays: Number,
  },
  { timestamps: true }
);

export default mongoose.model('MarketplacePrediction', marketplacePredictionSchema);
