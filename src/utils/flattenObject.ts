export function flattenData(
  data: Record<string, unknown>
): Record<string, unknown> {
  if (!data || typeof data !== "object") {
    return {};
  }

  function deepFlatten(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map(deepFlatten);
    }

    if (typeof value === "object" && value !== null) {
      const obj = value as Record<string, unknown>;

      const cleaned = Object.entries(obj).reduce<Record<string, unknown>>(
        (acc, [k, v]) => {
          if (k !== "__typename" && k !== "schemaId" && k !== "schemaName") {
            acc[k] = v;
          }
          return acc;
        },
        {}
      );

      const keys = Object.keys(cleaned);

      if (
        keys.length === 1 &&
        typeof cleaned[keys[0]] === "object" &&
        cleaned[keys[0]] !== null
      ) {
        return deepFlatten(cleaned[keys[0]]);
      }

      return keys.reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = deepFlatten(cleaned[key]);
        return acc;
      }, {});
    }

    return value;
  }

  return Object.entries(data).reduce<Record<string, unknown>>(
    (acc, [key, value]) => {
      acc[key] = deepFlatten(value);
      return acc;
    },
    {}
  );
}
