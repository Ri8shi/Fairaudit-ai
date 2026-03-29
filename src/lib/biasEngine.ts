import { BiasMetrics, DatasetRow } from "../types";

/**
 * Calculates bias metrics for a given dataset and protected attribute.
 * Assumes binary classification (0 or 1).
 */
export function calculateBiasMetrics(
  data: DatasetRow[],
  protectedAttr: string,
  targetAttr: string,
  predictionAttr: string
): BiasMetrics {
  const groups = Array.from(new Set(data.map((row) => String(row[protectedAttr]))));
  
  const demographicParity: Record<string, number> = {};
  const disparateImpact: Record<string, number> = {};
  const equalizedOdds: Record<string, number> = {};
  const sampleSizes: Record<string, number> = {};

  // Find a reference group (usually the one with the highest positive outcome rate or just the first one)
  // For Disparate Impact, we often compare against the "privileged" group.
  // We'll calculate rates for everyone first.

  const groupStats = groups.map((group) => {
    const groupData = data.filter((row) => String(row[protectedAttr]) === group);
    const total = groupData.length;
    const positivePredictions = groupData.filter((row) => Number(row[predictionAttr]) === 1).length;
    const selectionRate = total > 0 ? positivePredictions / total : 0;

    // For Equalized Odds (True Positive Rate)
    const actualPositives = groupData.filter((row) => Number(row[targetAttr]) === 1);
    const truePositives = actualPositives.filter((row) => Number(row[predictionAttr]) === 1).length;
    const tpr = actualPositives.length > 0 ? truePositives / actualPositives.length : 0;

    return { group, selectionRate, tpr, total };
  });

  // Find reference group (highest selection rate for simplicity in this MVP)
  const referenceGroup = groupStats.reduce((prev, current) => 
    (current.selectionRate > prev.selectionRate) ? current : prev
  , groupStats[0]);

  groupStats.forEach((stat) => {
    demographicParity[stat.group] = stat.selectionRate;
    disparateImpact[stat.group] = referenceGroup.selectionRate > 0 
      ? stat.selectionRate / referenceGroup.selectionRate 
      : 1;
    equalizedOdds[stat.group] = stat.tpr;
    sampleSizes[stat.group] = stat.total;
  });

  return {
    demographicParity,
    disparateImpact,
    equalizedOdds,
    sampleSizes,
  };
}
