import { analyzeImage } from './mlClient.js';

const mostFrequent = (values) => {
  const counts = new Map();
  let best = values[0];
  let bestCount = 0;
  for (const v of values) {
    const count = (counts.get(v) || 0) + 1;
    counts.set(v, count);
    if (count > bestCount) {
      best = v;
      bestCount = count;
    }
  }
  return best;
};

const average = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;

/**
 * Runs each file through the ML service's fabric/defect analysis and
 * combines the results (most-frequent for categorical fields, average for
 * numeric ones). Shared by the initial upload-wizard analysis and by
 * re-analyzing an already-published listing's stored photos, so both
 * paths combine multi-image results identically.
 *
 * @param {{path: string, mimetype: string}[]} files
 * @returns {Promise<object|null>} combined AI result, or null if every
 *   image failed to analyze (e.g. ml-service unreachable).
 */
export async function analyzeImagesCombined(files) {
  const perImageResults = [];
  for (const file of files) {
    try {
      const result = await analyzeImage(file.path, file.mimetype);
      perImageResults.push(result);
    } catch (err) {
      console.error(`[ai] analysis failed for ${file.path}:`, err.message);
    }
  }

  if (perImageResults.length === 0) return null;

  return {
    fabricType: mostFrequent(perImageResults.map((r) => r.fabricType)),
    confidence: Math.round(average(perImageResults.map((r) => r.confidence)) * 100) / 100,
    defectArea: Math.round(average(perImageResults.map((r) => r.defectArea)) * 100) / 100,
    healthScore: Math.round(average(perImageResults.map((r) => r.healthScore)) * 100) / 100,
    repairability: mostFrequent(perImageResults.map((r) => r.repairability)),
    remainingLifespan: Math.round(average(perImageResults.map((r) => r.remainingLifespan)) * 100) / 100,
  };
}

export function guessMimeType(filePath) {
  const ext = filePath.toLowerCase().split('.').pop();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}
