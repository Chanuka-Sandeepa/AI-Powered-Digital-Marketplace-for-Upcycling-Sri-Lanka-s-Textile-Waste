// Shared scoring helpers. Used by materialController (the listing's
// display-facing "sustainabilityScore") and marketplaceController (which
// needs both "sustainability_score" and "green_score" as plain numeric
// inputs for the price/demand/buyer-recommendation models).

export function computeSustainabilityScore({ healthScore, repairability, remainingLifespan, defectArea }) {
  if (healthScore == null) return undefined;

  let repairabilityScore = 50;
  if (repairability?.includes('Highly')) repairabilityScore = 100;
  else if (repairability?.includes('Moderately')) repairabilityScore = 70;

  const lifespanScore = Math.min(((remainingLifespan || 0) / 30) * 100, 100);
  const defectScore = Math.max(100 - (defectArea || 0) * 5, 0);

  const score = healthScore * 0.4 + repairabilityScore * 0.3 + lifespanScore * 0.2 + defectScore * 0.1;
  return Math.round(score);
}

// "green_score" isn't a field defined anywhere else in the app - the
// marketplace models expect it as a plain input, so this is a documented,
// transparent composite of the sustainability grading model's four
// environmental sub-scores. Falls back to a neutral 50 when no
// sustainability grade exists yet (e.g. mid-upload, before publishing).
export function computeGreenScore(sustainability) {
  if (!sustainability) return 50;
  const {
    circularityScore = 0,
    recyclabilityScore = 0,
    carbonReductionPercent = 0,
    waterReductionPercent = 0,
  } = sustainability;
  return Math.round((circularityScore + recyclabilityScore + carbonReductionPercent + waterReductionPercent) / 4);
}
