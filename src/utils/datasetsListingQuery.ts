import { DatasetFilters } from "@/service/types/dataset";

export const DATASET_SORT_OPTIONS: Record<string, string> = {
  relevancia: "",
  criacao: "-created",
  antigo: "created",
  subscritores: "-followers",
};

// Query params the dataset API accepts more than once, each repeat OR'ed with
// the others. They must reach the backend as repeats (`?geozone=a&geozone=b`),
// never collapsed into one value.
const MULTI_VALUE_PARAMS = [
  "tag",
  "license",
  "format",
  "format_family",
  "organization",
  "badge",
  "frequency",
  "geozone",
  "granularity",
] as const;

// Only `tag` is ever written comma-separated elsewhere in the app.
const COMMA_SEPARATED_PARAMS = new Set(["tag"]);

function readValues(params: URLSearchParams, name: string): string[] {
  const values = params.getAll(name);
  if (!COMMA_SEPARATED_PARAMS.has(name)) return values;
  return values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

/**
 * Turn the listing URL's query string into the filters the API layer sends.
 *
 * Single source of truth on purpose: the datasets page used to parse the same
 * params itself, and the two copies drifted — the page read `geozone` and
 * `granularity` with `String(...)`, so selecting two values sent the array
 * stringified as `"a,b"` and the listing came back empty.
 */
export function parseDatasetsFilters(params: URLSearchParams): DatasetFilters {
  const filters: DatasetFilters = {
    ...(params.get("q") && { q: params.get("q") as string }),
    ...(params.get("schema") && { schema: params.get("schema") as string }),
    ...(params.get("sort") && { sort: params.get("sort") as string }),
    ...(params.get("modified_since") && {
      modified_since: params.get("modified_since") as string,
    }),
    ...(params.get("featured") && { featured: params.get("featured") === "true" }),
  };

  for (const name of MULTI_VALUE_PARAMS) {
    const values = readValues(params, name);
    if (values.length === 0) continue;
    // A single value stays a plain string so the URL keeps its usual shape.
    filters[name] = values.length === 1 ? values[0] : values;
  }

  if (!filters.sort && !filters.q) {
    filters.sort = "-created";
  }

  return filters;
}

/**
 * Build the listing filters from a Next.js `searchParams` object.
 *
 * Server Components receive `Record<string, string | string[]>`, so the values
 * are fed into a `URLSearchParams` one repeat at a time and parsed by the same
 * function the client side uses.
 */
export function parseDatasetsFiltersFromSearchParams(
  resolved: Record<string, string | string[] | undefined> | undefined
): DatasetFilters {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(resolved ?? {})) {
    if (value === undefined) continue;
    for (const entry of Array.isArray(value) ? value : [value]) {
      params.append(name, entry);
    }
  }
  return parseDatasetsFilters(params);
}

export function getDatasetSortDefault(sortParam: string | null): string {
  return (
    Object.entries(DATASET_SORT_OPTIONS).find(([, value]) => value === (sortParam || ""))?.[0] ||
    "relevancia"
  );
}
