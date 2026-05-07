import { DatasetFilters } from "@/types/api";

export const DATASET_SORT_OPTIONS: Record<string, string> = {
  relevancia: "",
  criacao: "-created",
  antigo: "created",
  subscritores: "-followers",
};

export const DATASET_SORT_LABELS: Record<string, string> = {
  relevancia: "Relevância",
  criacao: "Mais recente",
  antigo: "Mais antigo",
  subscritores: "Subscritores",
};

export function parseDatasetsFilters(params: URLSearchParams): DatasetFilters {
  const tags = params
    .getAll("tag")
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  const licenses = params.getAll("license");
  const formats = params.getAll("format");
  const organizations = params.getAll("organization");
  const badges = params.getAll("badge");
  const frequencies = params.getAll("frequency");

  const filters: DatasetFilters = {
    ...(params.get("q") && { q: params.get("q") as string }),
    ...(params.get("schema") && { schema: params.get("schema") as string }),
    ...(params.get("geozone") && { geozone: params.get("geozone") as string }),
    ...(params.get("granularity") && { granularity: params.get("granularity") as string }),
    ...(params.get("sort") && { sort: params.get("sort") as string }),
    ...(params.get("modified_since") && {
      modified_since: params.get("modified_since") as string,
    }),
    ...(params.get("featured") && { featured: params.get("featured") === "true" }),
    ...(tags.length > 0 && { tag: tags.length === 1 ? tags[0] : tags }),
    ...(licenses.length > 0 && { license: licenses.length === 1 ? licenses[0] : licenses }),
    ...(formats.length > 0 && { format: formats.length === 1 ? formats[0] : formats }),
    ...(organizations.length > 0 && {
      organization: organizations.length === 1 ? organizations[0] : organizations,
    }),
    ...(badges.length > 0 && { badge: badges.length === 1 ? badges[0] : badges }),
    ...(frequencies.length > 0 && {
      frequency: frequencies.length === 1 ? frequencies[0] : frequencies,
    }),
  };

  if (!filters.sort && !filters.q) {
    filters.sort = "-created";
  }

  return filters;
}

export function getDatasetSortDefault(sortParam: string | null): string {
  return (
    Object.entries(DATASET_SORT_OPTIONS).find(([, value]) => value === (sortParam || ""))?.[0] ||
    "relevancia"
  );
}

