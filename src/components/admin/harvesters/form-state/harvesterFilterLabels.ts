/**
 * The backend declares each harvest filter with an English label
 * (`HarvestFilter(_("Tag"), "tags", …)`), translated server-side only when the
 * request carries a locale the API knows. Both harvester screens read the same
 * `GET /api/1/harvest/backends/` payload, so the mapping from that label to our
 * own i18n keys lives here instead of being duplicated per screen.
 *
 * Keyed on the label rather than on the filter key because the key is what goes
 * on the wire to the backend (and into the CKAN Solr query), so it must stay
 * exactly as declared.
 */
const FILTER_KEY_LABELS: Record<string, string> = {
  Organization: "organization",
  Tag: "tag",
  Publisher: "publisher",
  "Remote ID": "remoteId",
};

/**
 * Localizes a backend filter label, falling back to the label as received when
 * we have no translation for it — a new backend filter shows up in English
 * rather than as a raw i18n key.
 *
 * `translate` takes the subkey under `admin-harvesters:form.filterLabels` so
 * each caller keeps its own namespace prefix.
 */
export function localizeFilterLabel(
  label: string,
  translate: (subkey: string) => string,
): string {
  const subkey = FILTER_KEY_LABELS[label];
  return subkey ? translate(subkey) : label;
}
