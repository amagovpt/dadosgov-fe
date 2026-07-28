export function flattenData(
  data: Record<string, unknown>,
  preferredLocales: string | string[] = ["pt", "pt-PT", "en"]
): Record<string, unknown> {
  if (!data || typeof data !== "object") return {};

  const locales = Array.isArray(preferredLocales) ? preferredLocales : [preferredLocales];

  const isLocaleKey = (k: string) => /^[a-z]{2,3}(?:-[a-zA-Z0-9]+)?$/i.test(k);

  function deepFlatten(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(deepFlatten);
    if (value === null || typeof value !== "object") return value;

    const obj = value as Record<string, unknown>;
    const cleaned = Object.keys(obj).reduce<Record<string, unknown>>((acc, k) => {
      if (k !== "__typename" && k !== "schemaId" /*&& k !== "schemaName"*/) acc[k] = obj[k];
      return acc;
    }, {});

    const keys = Object.keys(cleaned);
    if (keys.length === 0) return {};

    // Resolve locale-keyed objects (e.g. { pt: "...", en: "..." } or { pt: {...} })
    if (keys.every(isLocaleKey)) {
      for (const loc of locales) {
        if (loc in cleaned) return deepFlatten(cleaned[loc]);
      }
      return deepFlatten(cleaned[keys[0]]);
    }

    // Unwrap single-key structural wrappers (e.g. { iv: ... }, { data: ... }, { metadata: ... })
    // In Squidex's GraphQL output, objects with a single non-locale key are always structural
    // wrappers, never meaningful content — content objects always have multiple fields.
    // This includes null values (e.g. { iv: null } → null).
    if (keys.length === 1) {
      return deepFlatten(cleaned[keys[0]]);
    }

    const out: Record<string, unknown> = {};
    for (const k of keys) out[k] = deepFlatten(cleaned[k]);
    return out;
  }

  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) result[k] = deepFlatten(v);
  return result;
}
