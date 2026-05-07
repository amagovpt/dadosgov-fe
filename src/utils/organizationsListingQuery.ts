import { OrganizationFilters } from "@/types/api";

export const ORGANIZATION_SORT_OPTIONS: Record<string, string> = {
  relevancia: "",
  mais_dados: "-datasets",
  mais_reutilizacoes: "-reuses",
  subscritores: "-followers",
};

export const ORGANIZATION_SORT_LABELS: Record<string, string> = {
  relevancia: "Relevância",
  mais_dados: "Mais dados",
  mais_reutilizacoes: "Mais reutilizações",
  subscritores: "Subscritores",
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

  if (!filters.sort && !filters.q) {
    filters.sort = "-last_modified";
  }

  return filters;
}

export function getOrganizationSortDefault(sortParam: string | null): string {
  return (
    Object.entries(ORGANIZATION_SORT_OPTIONS).find(([, value]) => value === (sortParam || ""))?.[0] ||
    "relevancia"
  );
}

