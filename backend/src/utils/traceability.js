import TraceabilityEvent from '../models/TraceabilityEvent.js';

// Fire-and-forget by design: a logging failure should never break the
// actual operation it's describing. Errors are logged, not thrown.
export async function logTraceabilityEvent(materialId, eventType, actorId, details = {}) {
  try {
    await TraceabilityEvent.create({ material: materialId, eventType, actor: actorId, details });
  } catch (err) {
    console.warn(`[traceability] failed to log ${eventType} for material ${materialId}:`, err.message);
  }
}
