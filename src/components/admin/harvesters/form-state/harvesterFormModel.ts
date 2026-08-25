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

/**
 * The harvest config the form collects beyond the filters: the features the
 * selected backend declares (`HarvestFeature`, a flag per key) and its extra
 * configs (`HarvestExtraConfig`, a value per key). Both are keyed on what the
 * backend declares, so an entry for a key it does not declare cannot occur.
 */
export interface HarvesterConfigValues {
  features: Record<string, boolean>;
  extraConfigs: Record<string, string>;
}

interface HarvesterCreateValues extends HarvesterDetailsValues, HarvesterConfigValues {
  description: string;
  backend: string;
  active: boolean;
  autoarchive: boolean;
  filters: HarvesterFilterValue[];
}

interface HarvesterUpdateValues extends HarvesterConfigValues {
  /** The source's stored `config`, so keys no screen models are not dropped. */
  storedConfig: Record<string, unknown>;
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
        // A row with no key is dropped rather than sent: clicking the selected
        // option in the key select deselects it, leaving `type: ""`, and
        // `HarvestConfigField` answers 400 `Unknown filter key ""` — which
        // would block the wizard on the very step this fix is about.
        filter.type &&
        filter.value.trim() &&
        (!validKeys || validKeys.has(filter.type)),
    )
    .map((filter) => ({
      key: filter.type,
      value: filter.value,
      // The mode select deselects the same way. The backends read anything
      // other than "exclude" as an include, but say it rather than lean on that.
      type: filter.mode || "include",
    }));
}

/**
 * The parts of `config` this form models, in the shape the API stores them.
 *
 * One function on purpose: `filters`, `features` and `extra_configs` all live
 * inside the same `config`, so spreading `{ config: … }` once per part would
 * leave only the last one and silently drop the others.
 */
function buildManagedConfig(
  filters: ReturnType<typeof mapFilters>,
  { features, extraConfigs }: HarvesterConfigValues,
) {
  return {
    filters,
    // `has_feature` falls back to the feature's declared default, so sending
    // the flags as collected — including the false ones — is what makes turning
    // a default-on feature off actually stick.
    features,
    extra_configs: Object.entries(extraConfigs)
      // An empty value means "not set": sending it would store an empty string
      // where the backend expects the config to be absent.
      .filter(([, value]) => value.trim())
      .map(([key, value]) => ({ key, value: value.trim() })),
  };
}

/**
 * `config` for a source being created: each part omitted when empty, and no
 * `config` at all when nothing was configured.
 */
function buildCreateConfig(
  filters: ReturnType<typeof mapFilters>,
  values: HarvesterConfigValues,
) {
  const { features, extra_configs } = buildManagedConfig(filters, values);

  const config = {
    ...(filters.length > 0 ? { filters } : {}),
    ...(Object.keys(features).length > 0 ? { features } : {}),
    ...(extra_configs.length > 0 ? { extra_configs } : {}),
  };

  return Object.keys(config).length > 0 ? { config } : {};
}

/**
 * `config` for a source being updated or previewed from the edit screen: the
 * three parts this form owns, over whatever else the stored config holds.
 *
 * Always sent, and always with all three keys, because omitting `config` is not
 * an erasure — `wtforms_json` leaves a missing field alone, so the stored value
 * survives and clearing the last filter or extra config would report success
 * and change nothing.
 *
 * Merged onto the stored config rather than rebuilt from scratch: `config` is a
 * free-form dict server-side and holds keys no screen models (`apikey` for the
 * CKAN backends, `default_tag` for CSW), which a rebuilt object would drop.
 */
function buildStoredConfig(
  filters: ReturnType<typeof mapFilters>,
  values: HarvesterConfigValues,
  storedConfig: Record<string, unknown>,
) {
  return { config: { ...storedConfig, ...buildManagedConfig(filters, values) } };
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
    // Everything the API reads lives under `config`: its `HarvestSourceForm`
    // has no top-level `filters` or `features` field, so WTForms dropped them
    // in silence and every harvester created here was created without them.
    ...buildCreateConfig(filters, values),
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
    ...buildStoredConfig(filters, values, values.storedConfig),
  };
}

export function buildHarvesterPreviewPayload(
  values: HarvesterPreviewValues,
): HarvestSourceCreatePayload {
  const filters = mapFilters(values.filters);

  return {
    name: values.name.trim() || values.fallbackName,
    url: values.url.trim() || values.fallbackUrl,
    backend: values.backend || values.fallbackBackend,
    schedule: values.schedule.trim() || undefined,
    active: values.active,
    autoarchive: values.autoarchive,
    ...buildStoredConfig(filters, values, values.storedConfig),
  };
}
