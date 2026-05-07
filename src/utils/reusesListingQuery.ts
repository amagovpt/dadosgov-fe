import { ReuseFilters } from "@/types/api";

export const REUSE_SORT_OPTIONS: Record<string, string> = {
  relevancia: "",
  recentes: "-last_modified",
  antigos: "last_modified",
  subscritores: "-followers",
};

export const REUSE_SORT_LABELS: Record<string, string> = {
  relevancia: "Relevância",
  recentes: "Mais recente",
  antigos: "Mais antigo",
  subscritores: "Subscritores",
};

const REUSE_SORT_REVERSE_MAP: Record<string, string> = {
  "-last_modified": "recentes",
  last_modified: "antigos",
  "-followers": "subscritores",
};

export function parseReusesFilters(params: URLSearchParams): ReuseFilters {
  const tags = params.getAll("tag");
  const organizations = params.getAll("organization");

  return {
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
}

export function getReuseSortDefault(sortParam: string | null): string {
  return REUSE_SORT_REVERSE_MAP[sortParam || ""] || "relevancia";
}

