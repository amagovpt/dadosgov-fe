import type { FormErrors } from "@/hooks/forms/useFormErrors";
import type { DatasetUpdatePayload } from "@/service/types/dataset";

export type DatasetEditField = "title" | "description" | "temporalEnd";

interface DatasetEditValidationValues {
  title: string;
  description: string;
  temporalStart: string;
  temporalEnd: string;
}

interface DatasetEditValidationMessages {
  titleRequired: string;
  descriptionRequired: string;
  invalidRange: string;
}

interface DatasetEditPayloadValues {
  title: string;
  description: string;
  shortDescription: string;
  acronym: string;
  featured: boolean;
  keywords: string;
  license: string;
  frequency: string;
  temporalStart: string;
  temporalEnd: string;
  spatialGeom?: object | null;
  spatialZones?: string[];
  spatialGranularity?: string;
  existingSpatialZones?: string[];
}

function parsePortugueseDate(value: string): Date {
  const [day, month, year] = value.split("/");
  return new Date(`${year}-${month}-${day}`);
}

function toPortugueseDateIso(value: string): string {
  const [day, month, year] = value.split("/");
  return new Date(`${year}-${month}-${day}T00:00:00.000Z`).toISOString();
}

export function validateDatasetEditMetadata(
  values: DatasetEditValidationValues,
  messages: DatasetEditValidationMessages,
): FormErrors<DatasetEditField> {
  const errors: FormErrors<DatasetEditField> = {};

  if (!values.title.trim()) errors.title = messages.titleRequired;
  if (!values.description.trim()) {
    errors.description = messages.descriptionRequired;
  }

  if (values.temporalStart && values.temporalEnd) {
    const startDate = parsePortugueseDate(values.temporalStart);
    const endDate = parsePortugueseDate(values.temporalEnd);
    if (endDate <= startDate) {
      errors.temporalEnd = messages.invalidRange;
    }
  }

  return errors;
}

export function buildDatasetEditPayload(
  values: DatasetEditPayloadValues,
): DatasetUpdatePayload {
  const tags = values.keywords ? values.keywords.split(",").filter(Boolean) : [];
  const hasSpatialUpdate = Boolean(values.spatialGranularity || values.spatialZones);

  return {
    title: values.title.trim(),
    description: values.description.trim(),
    description_short: values.shortDescription.trim() || undefined,
    acronym: values.acronym.trim() || undefined,
    featured: values.featured,
    tags,
    license: values.license || undefined,
    frequency: values.frequency || undefined,
    temporal_coverage: values.temporalStart
      ? {
          start: toPortugueseDateIso(values.temporalStart),
          ...(values.temporalEnd
            ? { end: toPortugueseDateIso(values.temporalEnd) }
            : {}),
        }
      : undefined,
    ...(hasSpatialUpdate
      ? {
          spatial: {
            geom: values.spatialGeom ?? null,
            zones: values.spatialZones ?? values.existingSpatialZones ?? [],
            granularity: values.spatialGranularity ?? null,
          },
        }
      : {}),
  };
}
