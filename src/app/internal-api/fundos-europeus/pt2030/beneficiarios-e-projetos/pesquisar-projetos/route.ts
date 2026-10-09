import { getProjectsOfPortugal2030 } from "@/service/queries/datastories/datastory";
import apolloClient from "@/service/utils/apollo-client";
import { FilterValue } from "@/store/searchBenProj-store";

export async function POST(request: Request) {
  const { limit, page, sortBy, sortOrder, name, operationCode, ...filters } = await request.json();

  // prepare variables for the query

  let variables: Record<string, FilterValue> = {
    limit,
    page,
    sortBy,
    sortOrder,
    //operationName: name,
    //operationCode,
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

  const { data, error } = await apolloClient.query<{
    searchProjectsOfPortugal2030: unknown;
  }>({
    query: getProjectsOfPortugal2030(),
    variables: variables,
  });

  console.log("\n\n");
  console.log("variables", variables);
  console.log("data", data);
  console.log("error", error);
  console.log("\n\n");

  // handle error

  if (!data || error) {
    console.error("GraphQL error:", error);
    return new Response(JSON.stringify({ error }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // handle response

  return new Response(JSON.stringify(data.searchProjectsOfPortugal2030), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
