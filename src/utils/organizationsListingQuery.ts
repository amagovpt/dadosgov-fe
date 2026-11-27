import { OrganizationFilters } from "@/service/types/identity";

export const ORGANIZATION_SORT_OPTIONS: Record<string, string> = {
  visualizacoes: "-views",
  dados: "-datasets",
  alfabetica: "name",
  reutilizacoes: "-reuses",
  recentes: "-created",
  antigos: "created",
};

export function parseOrganizationsFilters(params: URLSearchParams): OrganizationFilters {
  const badges = params.getAll("badge");
  const organizations = params.getAll("organization");

  const filters: OrganizationFilters = {
    ...(params.get("q") && { q: params.get("q") as string }),
    ...(params.get("sort") && { sort: params.get("sort") as string }),
    ...(badges.length > 0 && { badge: badges.length === 1 ? badges[0] : badges }),
    ...(organizations.length > 0 && {
      organization: organizations.length === 1 ? organizations[0] : organizations,
    }),
  };

  if (!filters.sort) {
    filters.sort = "-created";
  }

  return filters;
}

export function getOrganizationSortDefault(sortParam: string | null): string {
  return (
    Object.entries(ORGANIZATION_SORT_OPTIONS).find(
      ([, value]) => value === (sortParam || "-created")
    )?.[0] || "recentes"
  );
}
