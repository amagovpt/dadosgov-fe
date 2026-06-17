import { DataserviceListFilters } from "@/service/api/dataservices";

// Values are the sort KEYS accepted by the /api/1/dataservices/ endpoint
// (generated from the model's sortable fields), not the underlying columns.
export const DATASERVICE_SORT_OPTIONS: Record<string, string> = {
  relevancia: "",
  recentes: "-created",
};

export const DATASERVICE_SORT_LABELS: Record<string, string> = {
  relevancia: "Relevância",
  recentes: "Mais recentes",
};

const DATASERVICE_SORT_REVERSE_MAP: Record<string, string> = {
  "-created": "recentes",
};

export function parseDataservicesFilters(params: URLSearchParams): DataserviceListFilters {
  const tags = params.getAll("tag");
  const organizations = params.getAll("organization");

  return {
    ...(params.get("q") && { q: params.get("q") as string }),
    ...(params.get("sort") && { sort: params.get("sort") as string }),
    ...(params.get("access_type") && { access_type: params.get("access_type") as string }),
    ...(params.get("organization_badge") && {
      organization_badge: params.get("organization_badge") as string,
    }),
    ...(params.get("modified_since") && {
      modified_since: params.get("modified_since") as string,
    }),
    ...(tags.length > 0 && { tag: tags.length === 1 ? tags[0] : tags }),
    ...(organizations.length > 0 && {
      organization: organizations.length === 1 ? organizations[0] : organizations,
    }),
  };
}

export function getDataserviceSortDefault(sortParam: string | null): string {
  return DATASERVICE_SORT_REVERSE_MAP[sortParam || ""] || "relevancia";
}
