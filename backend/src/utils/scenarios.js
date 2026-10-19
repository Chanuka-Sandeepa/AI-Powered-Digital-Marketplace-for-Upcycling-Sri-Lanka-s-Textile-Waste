// Reuse / recycle / discard scenario comparison (FR-07 in the project
// report, part of Member 2's sustainability intelligence scope). No
// trained model was provided for this specific comparison, so it's a
// transparent, documented derivation from the sustainability grade
// already computed for the listing - not a new prediction, an honest
// re-framing of existing numbers under three different circular pathways.
//
// Assumptions (clearly approximate, not derived from a specific LCA
// study - flag this in the report/viva rather than presenting them as
// precise):
//   - Reuse captures 100% of the modeled CO2/water/energy savings, since
//     reselling/repairing avoids virgin-material production entirely.
//   - Recycling captures a partial share (65% CO2/water, 50% energy) -
//     material recovery still avoids virgin production, but the
//     recycling process itself consumes energy, and some material mass
//     is typically lost in processing (modeled as 90% landfill diversion
//     instead of 100%).
//   - Discard is the zero-benefit baseline, plus a small modeled
//     environmental cost (rough landfill decomposition / incineration
//     emissions estimate) so it isn't presented as merely "neutral".
const RECYCLE_IMPACT_FACTOR = 0.65;
const RECYCLE_ENERGY_FACTOR = 0.5;
const RECYCLE_MASS_RECOVERY = 0.9;
const DISCARD_CO2_COST_PER_KG = 0.5; // kg CO2-equivalent per kg landfilled/incinerated (documented estimate)

export function computeScenarioComparison(material) {
  const sustainability = material.sustainability;
  const healthScore = material.aiAnalysis?.healthScore ?? 50;
  const weightKg = material.quantity || 0;

  if (!sustainability) {
    return null; // nothing to compare without a sustainability grade yet
  }

  const { co2SavedKg = 0, waterSavedLiters = 0, energySavedKwh = 0 } = sustainability;

  const reuse = {
    action: 'Reuse',
    feasible: healthScore >= 60,
    co2SavedKg: Math.round(co2SavedKg * 100) / 100,
    waterSavedLiters: Math.round(waterSavedLiters * 100) / 100,
    energySavedKwh: Math.round(energySavedKwh * 100) / 100,
    landfillDivertedKg: Math.round(weightKg * 100) / 100,
    description: healthScore >= 60
      ? 'Resell or repair for continued use - the highest-value circular option given this item\'s condition.'
      : 'Not generally recommended at this health score - the item likely needs more repair than "reuse as-is" implies.',
  };

  const recycle = {
    action: 'Recycle',
    feasible: true,
    co2SavedKg: Math.round(co2SavedKg * RECYCLE_IMPACT_FACTOR * 100) / 100,
    waterSavedLiters: Math.round(waterSavedLiters * RECYCLE_IMPACT_FACTOR * 100) / 100,
    energySavedKwh: Math.round(energySavedKwh * RECYCLE_ENERGY_FACTOR * 100) / 100,
    landfillDivertedKg: Math.round(weightKg * RECYCLE_MASS_RECOVERY * 100) / 100,
    description: 'Break down into raw fiber/material for reuse in new products - a reliable option regardless of condition.',
  };

  const discard = {
    action: 'Discard',
    feasible: true,
    co2SavedKg: 0,
    waterSavedLiters: 0,
    energySavedKwh: 0,
    landfillDivertedKg: 0,
    environmentalCostCo2Kg: Math.round(weightKg * DISCARD_CO2_COST_PER_KG * 100) / 100,
    description: 'Landfill or incineration - shown as the sustainability baseline, not a recommended action.',
  };

  const recommendedAction = reuse.feasible ? 'Reuse' : 'Recycle';

  return {
    scenarios: [reuse, recycle, discard],
    recommendedAction,
    recommendationReason: reuse.feasible
      ? `Health score ${healthScore.toFixed(0)}/100 supports reuse - this captures the full modeled environmental benefit.`
      : `Health score ${healthScore.toFixed(0)}/100 is below the reuse threshold (60) - recycling is the best realistic option.`,
  };
}
