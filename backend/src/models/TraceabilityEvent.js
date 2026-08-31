import mongoose from 'mongoose';

// Answers the report's demo-flow requirement (step 33: "Buyer opens
// listing and reviews traceability data") and FR-15. Rather than a
// separate manual-entry system, this auto-logs at points that already
// exist in the codebase (listing created, AI analysis run, sustainability
// graded, marketplace analyzed, status changed) - so the timeline is
// always accurate and never requires the seller to remember to log
// anything themselves.
const traceabilityEventSchema = new mongoose.Schema(
  {
    material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true, index: true },
    eventType: {
      type: String,
      required: true,
      enum: [
        'Listed',
        'AIAnalyzed',
        'Reanalyzed',
        'SustainabilityGraded',
        'Regraded',
        'MarketplaceAnalyzed',
        'StatusChanged',
        'Sold',
      ],
    },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

traceabilityEventSchema.index({ material: 1, createdAt: 1 });

export default mongoose.model('TraceabilityEvent', traceabilityEventSchema);
