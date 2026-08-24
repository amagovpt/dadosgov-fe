import type { HarvestBackend } from "@/service/types/harvester";

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
