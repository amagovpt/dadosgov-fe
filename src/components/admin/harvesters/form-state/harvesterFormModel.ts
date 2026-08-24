import type { FormErrors } from "@/hooks/forms/useFormErrors";
import type {
  HarvestSourceCreatePayload,
  HarvestSourceUpdatePayload,
} from "@/service/types/harvester";

export type HarvesterFormField =
  | "harvesterProducer"
  | "harvesterName"
  | "harvesterUrl"
  | "harvesterType";

export interface HarvesterFilterValue {
  mode: string;
  type: string;
  value: string;
}

interface HarvesterDetailsValues {
  name: string;
  url: string;
  producer?: string;
  requireOrganizationProducer?: boolean;
  backend?: string;
  /**
   * The creation wizard must not submit without a type: an empty `backend`
   * falls back to "dcat" in `buildHarvesterCreatePayload`, which would silently
   * create a DCAT source against, say, a CKAN URL. The edit screen always has
   * the saved backend to fall back to, so it leaves this off.
   */
  requireBackend?: boolean;
  messages?: Partial<Record<HarvesterFormField, string>>;
}

interface HarvesterCreateValues extends HarvesterDetailsValues {
  description: string;
  backend: string;
  active: boolean;
  autoarchive: boolean;
  filters: HarvesterFilterValue[];
}

interface HarvesterUpdateValues {
  name: string;
  description: string;
  url: string;
  backend: string;
  fallbackBackend: string;
  active: boolean;
  autoarchive: boolean;
  filters: HarvesterFilterValue[];
  activeFilterKeys: string[];
}

interface HarvesterPreviewValues
  extends Omit<HarvesterUpdateValues, "activeFilterKeys" | "description"> {
  fallbackName: string;
  fallbackUrl: string;
  schedule: string;
}

export function validateHarvesterDetails(
  values: HarvesterDetailsValues,
): FormErrors<HarvesterFormField> {
  const errors: FormErrors<HarvesterFormField> = {};

  if (
    values.requireOrganizationProducer &&
    (!values.producer || values.producer === "user")
  ) {
    errors.harvesterProducer = values.messages?.harvesterProducer ?? "";
  }
  if (!values.name.trim()) {
    errors.harvesterName = values.messages?.harvesterName ?? "";
  }
  if (!values.url.trim()) {
    errors.harvesterUrl = values.messages?.harvesterUrl ?? "";
  }
  if (values.requireBackend && !values.backend?.trim()) {
    errors.harvesterType = values.messages?.harvesterType ?? "";
  }

  return errors;
}

function mapFilters(filters: HarvesterFilterValue[], validKeys?: Set<string>) {
  return filters
    .filter(
      (filter) =>
        filter.value.trim() &&
        (!validKeys || (filter.type && validKeys.has(filter.type))),
    )
    .map((filter) => ({
      key: filter.type,
      value: filter.value,
      type: filter.mode,
    }));
}

export function buildHarvesterCreatePayload(
  values: HarvesterCreateValues,
): HarvestSourceCreatePayload {
  const producer = values.producer || "";
  const filters = mapFilters(values.filters);

  return {
    name: values.name,
    url: values.url,
    backend: values.backend || "dcat",
    active: values.active,
    autoarchive: values.autoarchive,
    ...(values.description.trim() ? { description: values.description } : {}),
    ...(producer && producer !== "user" ? { organization: producer } : {}),
    ...(values.filters.length > 0 ? { filters } : {}),
  };
}

export function buildHarvesterUpdatePayload(
  values: HarvesterUpdateValues,
): HarvestSourceUpdatePayload {
  const filters = mapFilters(values.filters, new Set(values.activeFilterKeys));

  return {
    name: values.name.trim(),
    description: values.description.trim() || undefined,
    url: values.url.trim(),
    backend: values.backend || values.fallbackBackend,
    active: values.active,
    autoarchive: values.autoarchive,
    ...(filters.length > 0 ? { config: { filters } } : {}),
  };
}

export function buildHarvesterPreviewPayload(
  values: HarvesterPreviewValues,
): HarvestSourceCreatePayload {
  const filters = mapFilters(values.filters).filter((filter) => filter.key);

  return {
    name: values.name.trim() || values.fallbackName,
    url: values.url.trim() || values.fallbackUrl,
    backend: values.backend || values.fallbackBackend,
    schedule: values.schedule.trim() || undefined,
    active: values.active,
    autoarchive: values.autoarchive,
    ...(filters.length > 0 ? { config: { filters } } : {}),
  };
}
