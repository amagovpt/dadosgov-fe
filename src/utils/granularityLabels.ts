/**
 * PT-PT fallback labels for spatial granularities.
 *
 * The public dataset page resolves these through the `datasets` i18n namespace
 * (`granularity.<id>`) by passing `t`; this map stays as the fallback for the
 * call sites that have no translator yet (backoffice).
 */
export const granularityLabelsMap: Record<string, string> = {
  // Portugal-specific (IDs from pt: namespace)
  "pt:distrito": "Distrito",
  "pt:concelho": "Concelho",
  "pt:freguesia": "Freguesia",
  // Generic levels
  "country-group": "Grupo de países",
  country: "País",
  canton: "Cantão",
  town: "Cidade",
  commune: "Município",
  district: "Distrito",
  municipality: "Município",
  parish: "Freguesia",
  // French administrative levels
  epci: "EPCI",
  iris: "IRIS",
  "fr:commune": "Município",
  "fr:departement": "Departamento",
  "fr:region": "Região",
  "fr:arrondissement": "Distrito",
  // Other
  poi: "Ponto de interesse",
  other: "Outro",
};

/**
 * Resolves a granularity label. Pass `t` (from the `datasets` namespace) to get
 * the label in the active locale; without it the PT map is used.
 *
 * Namespaced ids (`pt:distrito`, `fr:commune`, …) are stored in the namespace
 * with `_` instead of `:`, because i18next reads `:` as its namespace separator.
 */
export function getGranularityLabel(
  id: string,
  fallbackLabel: string,
  t?: (key: string, options?: { defaultValue?: string }) => string
): string {
  const fallback = granularityLabelsMap[id] || fallbackLabel;
  return t ? t(`granularity.${id.replace(/:/g, "_")}`, { defaultValue: fallback }) : fallback;
}
