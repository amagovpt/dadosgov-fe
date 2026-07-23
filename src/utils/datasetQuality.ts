import type { Dataset } from "@/service/types/dataset";

export type QualityCriterion = keyof NonNullable<Dataset["quality"]>;

/**
 * Criteria that make up the metadata quality score.
 *
 * Only the keys live here: the human-readable label of each criterion comes
 * from the `datasets` i18n namespace (`quality.<key>`), so the public dataset
 * page follows the active locale instead of a hardcoded PT list.
 */
export const QUALITY_CRITERIA: QualityCriterion[] = [
  "dataset_description_quality",
  "has_resources",
  "license",
  "has_open_format",
  "all_resources_available",
  "resources_documentation",
  "spatial",
  "temporal_coverage",
  "update_frequency",
];

/** Criteria the dataset meets. */
export function getQualityDetails(quality?: Dataset["quality"]): QualityCriterion[] {
  if (!quality) return [];
  return QUALITY_CRITERIA.filter((key) => quality[key] === true);
}

/** Criteria the dataset does not meet (all of them when there is no quality block). */
export function getQualityMissing(quality?: Dataset["quality"]): QualityCriterion[] {
  if (!quality) return [...QUALITY_CRITERIA];
  return QUALITY_CRITERIA.filter((key) => quality[key] !== true);
}
