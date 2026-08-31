import fs from 'fs/promises';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';

/**
 * Sends a single image file (from disk, as saved by multer) to the ML
 * service's /analyze endpoint and returns fabric type + defect analysis.
 */
export async function analyzeImage(filePath, mimeType) {
  const buffer = await fs.readFile(filePath);
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimeType }), 'image');

  const response = await fetch(`${ML_SERVICE_URL}/analyze`, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`ML service /analyze failed (${response.status}): ${body}`);
  }

  return response.json();
}

/**
 * Runs the sustainability grading pipeline for a material batch.
 */
export async function gradeSustainability(payload) {
  const response = await fetch(`${ML_SERVICE_URL}/grade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`ML service /grade failed (${response.status}): ${body}`);
  }

  return response.json();
}

/**
 * Runs the price -> demand -> buyer-recommendation cascade for a material.
 */
export async function analyzeMarketplace(payload) {
  const response = await fetch(`${ML_SERVICE_URL}/marketplace/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`ML service /marketplace/analyze failed (${response.status}): ${body}`);
  }

  return response.json();
}

export async function checkMlServiceHealth() {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/health`, { signal: AbortSignal.timeout(3000) });
    return response.ok;
  } catch {
    return false;
  }
}
