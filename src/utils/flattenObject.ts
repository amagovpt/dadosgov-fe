export function flattenData(
  data: Record<string, unknown>,
  preferredLocales: string | string[] = ["pt", "pt-PT", "en"]
): Record<string, unknown> {
  if (!data || typeof data !== "object") return {};

  const locales = Array.isArray(preferredLocales) ? preferredLocales : [preferredLocales];

  const isPrimitive = (v: unknown): v is string | number | boolean | null =>
    v === null || ["string", "number", "boolean"].includes(typeof v);

  const isLocaleKey = (k: string) => /^[a-z]{2,3}(?:-[a-zA-Z0-9]+)?$/i.test(k);

  function deepFlatten(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(deepFlatten);
    if (value === null || typeof value !== "object") return value;

    const obj = value as Record<string, unknown>;
    const cleaned = Object.keys(obj).reduce<Record<string, unknown>>((acc, k) => {
      if (k !== "__typename" && k !== "schemaId" && k !== "schemaName") acc[k] = obj[k];
      return acc;
    }, {});

    const keys = Object.keys(cleaned);
    if (keys.length === 0) return {};

    if (keys.every(isLocaleKey)) {
      for (const loc of locales) {
        if (loc in cleaned) return deepFlatten(cleaned[loc]);
      }
      return deepFlatten(cleaned[keys[0]]);
    }

    if (keys.length === 1) {
      const only = cleaned[keys[0]];
      if (keys[0] === "iv") return deepFlatten(only);
      if (isPrimitive(only)) return only;
      if (typeof only === "object" && only !== null) return deepFlatten(only);
    }

    const out: Record<string, unknown> = {};
    for (const k of keys) out[k] = deepFlatten(cleaned[k]);
    return out;
  }

  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) result[k] = deepFlatten(v);
  return result;
}
