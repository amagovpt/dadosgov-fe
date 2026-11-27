import { ReuseFilters } from "@/service/types/reuse";

export const REUSE_SORT_OPTIONS: Record<string, string> = {
  visualizacoes: "-views",
  dados: "-datasets",
  recentes: "-created",
  antigos: "created",
  favoritos: "-followers",
};

export function parseReusesFilters(params: URLSearchParams): ReuseFilters {
  const tags = params.getAll("tag");
  const organizations = params.getAll("organization");

  const filters: ReuseFilters = {
    ...(params.get("q") && { q: params.get("q") as string }),
    ...(params.get("type") && { type: params.get("type") as string }),
    ...(params.get("sort") && { sort: params.get("sort") as string }),
    ...(params.get("modified_since") && {
      modified_since: params.get("modified_since") as string,
    }),
    ...(tags.length > 0 && { tag: tags.length === 1 ? tags[0] : tags }),
    ...(organizations.length > 0 && {
      organization: organizations.length === 1 ? organizations[0] : organizations,
    }),
  };

  if (!filters.sort) {
    filters.sort = "-views";
  }

  return filters;
}

export function getReuseSortDefault(sortParam: string | null): string {
  return (
    Object.entries(REUSE_SORT_OPTIONS).find(
      ([, value]) => value === (sortParam || "-views")
    )?.[0] || "visualizacoes"
  );
}
