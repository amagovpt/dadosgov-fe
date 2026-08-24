import type { HarvestBackend, HarvestSource } from "@/service/types/harvester";

/**
 * The harvest filter keys we carry a translation for, under
 * `admin-harvesters:form.filterLabels`.
 *
 * Keyed on the filter key and not on the label the API sends: that label is a
 * `lazy_gettext` string marshalled through `get_locale()`, and `/api/1` sets
 * `g.lang_code` to the deployment's `DEFAULT_LANGUAGE` (`pt`) when the request
 * carries no `lang`, so the endpoint answers "Etiqueta" and "Editor" rather
 * than "Tag" and "Publisher". A map keyed on the English labels never matched.
 * The key is the same value the backend validates and puts in the CKAN Solr
 * query, so it does not move with the caller's locale.
 */
const TRANSLATED_FILTER_KEYS = new Set(["organization", "tags", "publisher"]);

/**
 * Localizes a backend filter, falling back to the label the API sent when we
 * carry no translation for the key — a filter a backend adds later shows up
 * under the API's own wording instead of as a raw i18n key.
 *
 * `translate` takes the key as the subkey under
 * `admin-harvesters:form.filterLabels`, so each caller keeps its own namespace
 * prefix.
 */
export function localizeFilterLabel(
  filter: { key: string; label: string },
  translate: (subkey: string) => string,
): string {
  return TRANSLATED_FILTER_KEYS.has(filter.key) ? translate(filter.key) : filter.label;
}

/** The features we carry a translation for, under `form.featureLabels`. */
const TRANSLATED_FEATURE_KEYS = new Set(["geodcatap", "inspire"]);

/** The extra configs we carry a translation for, under `form.extraConfigLabels`. */
const TRANSLATED_EXTRA_CONFIG_KEYS = new Set(["remote_url_prefix"]);

/** Same key-not-label lookup as `localizeFilterLabel`, for a backend feature. */
export function localizeFeatureLabel(
  feature: { key: string; label: string },
  translate: (subkey: string) => string,
): string {
  return TRANSLATED_FEATURE_KEYS.has(feature.key) ? translate(feature.key) : feature.label;
}

/** Same key-not-label lookup as `localizeFilterLabel`, for an extra config. */
export function localizeExtraConfigLabel(
  extraConfig: { key: string; label: string },
  translate: (subkey: string) => string,
): string {
  return TRANSLATED_EXTRA_CONFIG_KEYS.has(extraConfig.key)
    ? translate(extraConfig.key)
    : extraConfig.label;
}

/**
 * The filters the given backend declares. Both harvester screens derive the
 * filter key options and the visibility of their filters block from this: a
 * hardcoded list drifts from what the API accepts, and `HarvestConfigField`
 * rejects any key the selected backend does not declare.
 */
export function selectBackendFilters(
  backends: HarvestBackend[],
  backendId: string,
): HarvestBackend["filters"] {
  return backends.find((backend) => backend.id === backendId)?.filters ?? [];
}

/**
 * The features the given backend declares — the flags under `config.features`.
 * Only `csw-dcat` (`geodcatap`) and `odspt` (`inspire`) declare any today, and
 * the wizard used to gate the GeoDCAT-AP switch on a hardcoded backend id,
 * which is why `inspire` was impossible to set through the UI at all.
 */
export function selectBackendFeatures(
  backends: HarvestBackend[],
  backendId: string,
): HarvestBackend["features"] {
  return backends.find((backend) => backend.id === backendId)?.features ?? [];
}

/**
 * The extra configs the given backend declares — the `{key, value}` entries
 * under `config.extra_configs`.
 */
export function selectBackendExtraConfigs(
  backends: HarvestBackend[],
  backendId: string,
): HarvestBackend["extra_configs"] {
  return backends.find((backend) => backend.id === backendId)?.extra_configs ?? [];
}

/**
 * The feature flags a backend starts with, from the `default` each feature
 * declares. `has_feature` falls back to that same default server-side, so this
 * only makes the starting state of the form match what the harvest would do.
 */
export function seedFeatureValues(features: HarvestBackend["features"]): Record<string, boolean> {
  return Object.fromEntries(features.map((feature) => [feature.key, feature.default ?? false]));
}

/**
 * The features and extra configs already stored on a source, in the shape the
 * payload builders and the form controls take.
 *
 * The API replaces the whole `config` on update, so a save that omits them
 * erases them: the edit screen seeds its controls from this, and what it sends
 * back is what the user sees.
 */
export function readStoredConfig(source: HarvestSource | null) {
  const config = (source?.config ?? {}) as {
    features?: Record<string, boolean>;
    extra_configs?: { key?: string; value?: string }[];
  };

  return {
    features: config.features ?? {},
    extraConfigs: Object.fromEntries(
      (config.extra_configs ?? [])
        .filter((entry) => entry.key)
        .map((entry) => [entry.key as string, entry.value ?? ""]),
    ),
  };
}

/**
 * Keeps only the entries whose key the selected backend declares, the same way
 * the filters are gated by their valid keys.
 *
 * Switching the implementation type leaves the previous type's values in the
 * form state, and `HarvestConfigField` rejects any key the new backend does not
 * declare — so an untouched leftover would turn a save into a 400.
 */
export function keepDeclaredKeys<T>(
  values: Record<string, T>,
  declared: { key: string }[],
): Record<string, T> {
  const keys = new Set(declared.map((entry) => entry.key));
  return Object.fromEntries(Object.entries(values).filter(([key]) => keys.has(key)));
}
