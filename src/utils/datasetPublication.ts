import type { Dataset } from "@/service/types/dataset";
import { parseDatasetDateToTime } from "@/components/admin/datasets/publication-wizard/datasetFormModel";

const MISSING_FIELDS_KEY = "draft:missing_fields";

export type DatasetPublicationIssue =
  | "title"
  | "description"
  | "frequency"
  | "producer"
  | "resources"
  | "temporalCoverage";

export function getDatasetDraftExtras(
  existing: Dataset["extras"],
  frequency: string
): Record<string, unknown> {
  const extras = { ...existing };
  const previous = extras[MISSING_FIELDS_KEY];
  const missing = Array.isArray(previous)
    ? previous.filter(
        (field): field is string => typeof field === "string" && field !== "frequency"
      )
    : [];
  if (!frequency.trim()) missing.push("frequency");
  if (missing.length) extras[MISSING_FIELDS_KEY] = missing;
  else delete extras[MISSING_FIELDS_KEY];
  return extras;
}

export function hasMissingDraftFrequency(dataset: Dataset): boolean {
  const fields = dataset.extras?.[MISSING_FIELDS_KEY];
  return Array.isArray(fields) && fields.includes("frequency");
}

export function getDatasetPublicationIssues(dataset: Dataset): DatasetPublicationIssue[] {
  const issues: DatasetPublicationIssue[] = [];
  if (!dataset.title?.trim() || dataset.title.trim().length > 350) issues.push("title");
  if (!dataset.description?.trim() || dataset.description.trim().length > 3000)
    issues.push("description");
  // The API defaults an omitted frequency to "unknown". Keep an unselected
  // draft value distinct from an explicit selection of that valid option.
  if (!dataset.frequency?.trim() || hasMissingDraftFrequency(dataset)) issues.push("frequency");
  if (!dataset.organization?.id && !dataset.owner?.id) issues.push("producer");
  if (!dataset.resources?.length) issues.push("resources");
  const start = dataset.temporal_coverage?.start;
  const end = dataset.temporal_coverage?.end;
  const startTime = start ? parseDatasetDateToTime(start) : null;
  const endTime = end ? parseDatasetDateToTime(end) : null;
  if (
    (start && startTime === null) ||
    (end && endTime === null) ||
    (startTime !== null && endTime !== null && startTime > endTime)
  )
    issues.push("temporalCoverage");
  return issues;
}
