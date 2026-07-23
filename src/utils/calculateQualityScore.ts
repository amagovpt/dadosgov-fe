import { Dataset } from "@/service/types/dataset";
import type { QualityCriterion } from "@/utils/datasetQuality";

export function calculateQualityScore(
  qualityCriteria: readonly QualityCriterion[],
  quality?: Dataset["quality"] | undefined
): number {
  if (!quality) return 0;
  if (quality.score > 0) return Math.round(quality.score * 100);
  const met = qualityCriteria.filter((key) => quality[key] === true).length;
  return Math.round((met / qualityCriteria.length) * 100);
}
