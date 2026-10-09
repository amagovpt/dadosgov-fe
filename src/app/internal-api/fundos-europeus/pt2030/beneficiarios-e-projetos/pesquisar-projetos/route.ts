import { print } from "graphql";
import { getProjectsOfPortugal2030 } from "@/service/queries/datastories/datastory";
import { getCmsBaseUrl } from "@/service/utils/cmsBaseUrl";
import { FilterValue } from "@/store/searchBenProj-store";

// The shared apolloClient is tuned for CMS page content: it aborts server-side
// requests after CMS_FETCH_TIMEOUT_MS (5s) and keeps every result in an
// in-memory SWR cache. Neither fits this search: the unpaginated download
// (~21k projects, ~5MB) takes longer than 5s, and caching arbitrary filter
// combinations would pin megabytes per entry. So the query goes out directly.
const SEARCH_TIMEOUT_MS = 60_000;

export async function POST(request: Request) {
  const { limit, page, sortBy, sortOrder, name, operationCode, ...filters } = await request.json();

  // prepare variables for the query

  let variables: Record<string, FilterValue> = {
    limit,
    page,
    sortBy,
    sortOrder,
    operationName: name,
    operationCode,
  };

  // handle optional filters

  const optionalFiltersNames = [
    "funds",
    "policyObjectives",
    "specificObjectiveShortName",
    "programmes",
    "thematicAreas",
    "regions",
    "municipalities",
  ];

  optionalFiltersNames.forEach((filterName) => {
    if (filterName in filters) {
      variables = { ...variables, [filterName]: filters[filterName] };
    }
  });

  // handle ranged amounts
  if ("approvedValueMin" in filters || "approvedValueMax" in filters) {
    if ("approvedValueMin" in filters) {
      variables = {
        ...variables,
        approvedValueMin: filters.approvedValueMin,
      };
    }
    if ("approvedValueMax" in filters) {
      variables = {
        ...variables,
        approvedValueMax: filters.approvedValueMax,
      };
    }
  } else if ("executedValueMin" in filters || "executedValueMax" in filters) {
    if ("executedValueMin" in filters) {
      variables = {
        ...variables,
        executedValueMin: filters.executedValueMin,
      };
    }
    if ("executedValueMax" in filters) {
      variables = {
        ...variables,
        executedValueMax: filters.executedValueMax,
      };
    }
  } else if ("paidValueMin" in filters || "paidValueMax" in filters) {
    if ("paidValueMin" in filters) {
      variables = {
        ...variables,
        paidValueMin: filters.paidValueMin,
      };
    }
    if ("paidValueMax" in filters) {
      variables = {
        ...variables,
        paidValueMax: filters.paidValueMax,
      };
    }
  }

  // make the query request

  let data: { searchProjectsOfPortugal2030: unknown } | undefined;
  let error: unknown;

  try {
    const res = await fetch(`${getCmsBaseUrl()}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: print(getProjectsOfPortugal2030()), variables }),
      cache: "no-store",
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    });
    const json = await res.json();
    data = json.data;
    error = json.errors ?? (res.ok ? undefined : res.statusText);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  // handle error

  if (!data?.searchProjectsOfPortugal2030 || error) {
    console.error("GraphQL error:", error);
    return new Response(JSON.stringify({ error }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  // handle response

  return new Response(JSON.stringify(data.searchProjectsOfPortugal2030), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
