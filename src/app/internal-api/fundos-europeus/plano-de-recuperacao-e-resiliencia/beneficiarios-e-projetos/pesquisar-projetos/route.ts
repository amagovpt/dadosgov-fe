import { print } from "graphql";
import { getProjectsOfPRR } from "@/service/queries/datastories/datastory";
import { getCmsBaseUrl } from "@/service/utils/cmsBaseUrl";
import { FilterValue } from "@/store/searchBenProj-store";
import {
  PRRSearchProjectItem,
  PRRSearchProjectsResponse,
  ProjectResponseItemPrr,
  SearchProjectsPrrRequestBody,
} from "@/service/types/datastories/prr/prr";


const SEARCH_TIMEOUT_MS = 60_000;

const OOM_RETRY_DELAYS_MS = [1000, 2000, 3000];

type SearchResult = {
  data?: { searchProjectsOfPRR: PRRSearchProjectsResponse };
  error?: unknown;
};

const inflightSearches = new Map<string, Promise<SearchResult>>();
let searchQueue: Promise<unknown> = Promise.resolve();

const isOutOfMemory = (error: unknown) => JSON.stringify(error ?? "").includes("out of memory");

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchProjects(variables: Record<string, FilterValue>): Promise<SearchResult> {
  try {
    const res = await fetch(`${getCmsBaseUrl()}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: print(getProjectsOfPRR()), variables }),
      cache: "no-store",
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    });
    const json = await res.json();
    return { data: json.data, error: json.errors ?? (res.ok ? undefined : res.statusText) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

async function fetchProjectsWithRetry(variables: Record<string, FilterValue>) {
  let result = await fetchProjects(variables);
  for (const delay of OOM_RETRY_DELAYS_MS) {
    if (!isOutOfMemory(result.error)) break;
    await wait(delay);
    result = await fetchProjects(variables);
  }
  return result;
}

function searchProjects(variables: Record<string, FilterValue>): Promise<SearchResult> {
  const key = JSON.stringify(variables);
  const inflight = inflightSearches.get(key);
  if (inflight) return inflight;

  // retries run inside the queue slot, so a retry never overlaps the next search
  const search = searchQueue.then(() => fetchProjectsWithRetry(variables));
  searchQueue = search.catch(() => {});
  const shared = search.finally(() => inflightSearches.delete(key));
  inflightSearches.set(key, shared);
  return shared;
}

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return 0;
};

const toDate = (value: string | null): string => {
  if (!value) return "";
  if (value.includes("T")) return value.split("T")[0];
  return value;
};

// The listing components are shared with PT2030, so PRR rows are renamed onto the
// PT2030 project fields.
const mapToResponseItem = (item: PRRSearchProjectItem): ProjectResponseItemPrr => ({
  operationCode: item.code ?? "",
  operationName: item.description ?? item.investment ?? item.code ?? "",
  dimension: item.dimension ?? "",
  region: item.dsNutsii ?? "",
  municipality: item.dsMunicipality ?? "",
  approvedValue: toNumber(item.budget ?? item.total),
  executedValue: toNumber(item.executedValue),
  // The backend has no paid field yet; agreed mapping for now.
  paidValue: toNumber(item.executedValue),
  plannedConclusionDate: toDate(item.endDate),
  effectiveConclusionDate: null,
});

const mapSortBy = (sortBy?: SearchProjectsPrrRequestBody["sortBy"]) => {
  if (sortBy === "PLANNED_CONCLUSION_DATE") return "END_DATE";
  return "BUDGET";
};

export async function POST(request: Request) {
  const body = (await request.json()) as SearchProjectsPrrRequestBody;

  // prepare variables for the query

  const endDateMin =
    body.conclusionDateMin ?? (body.conclusionDate ? `${body.conclusionDate}-01-01` : "");
  const endDateMax =
    body.conclusionDateMax ?? (body.conclusionDate ? `${body.conclusionDate}-12-31` : "");

  let variables: Record<string, FilterValue> = {
    limit: body.limit ?? 10,
    page: body.page ?? 1,
    code: body.operationCode ?? "",
    description: body.name ?? "",
    sortBy: mapSortBy(body.sortBy),
    sortOrder: body.sortOrder ?? "DESC",
    dimension: body.dimensions ?? "",
    dsNutsii: body.regions ?? "",
    municipality: body.municipalities ?? "",
    endDateMin,
    endDateMax,
  };

  // PRR has a single amount (the budget), whichever indicator is selected
  const budgetMin = body.approvedValueMin ?? body.executedValueMin ?? body.paidValueMin;
  const budgetMax = body.approvedValueMax ?? body.executedValueMax ?? body.paidValueMax;

  if (budgetMin !== undefined) {
    variables = { ...variables, budgetMin: Number(budgetMin) };
  }
  if (budgetMax !== undefined) {
    variables = { ...variables, budgetMax: Number(budgetMax) };
  }

  // make the query request

  const { data, error } = await searchProjects(variables);

  // handle error

  if (!data?.searchProjectsOfPRR || error) {
    console.error("GraphQL error:", error);
    return new Response(JSON.stringify({ error }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  // handle response

  const { searchProjectsOfPRR } = data;
  const budgetMinFilter = toNumber(searchProjectsOfPRR.filters?.budgetMin);
  const budgetMaxFilter = toNumber(searchProjectsOfPRR.filters?.budgetMax);

  return new Response(
    JSON.stringify({
      limit: searchProjectsOfPRR.limit,
      page: searchProjectsOfPRR.page,
      total: searchProjectsOfPRR.total,
      totalFiltered: searchProjectsOfPRR.totalFiltered,
      filters: {
        approvedValueMin: budgetMinFilter,
        approvedValueMax: budgetMaxFilter,
        executedValueMin: budgetMinFilter,
        executedValueMax: budgetMaxFilter,
        paidValueMin: budgetMinFilter,
        paidValueMax: budgetMaxFilter,
        projectsAmountMin: 0,
        projectsAmountMax: 0,
        conclusionDateMin: searchProjectsOfPRR.filters?.endDateMin ?? "",
        conclusionDateMax: searchProjectsOfPRR.filters?.endDateMax ?? "",
      },
      data: (searchProjectsOfPRR.data ?? []).map(mapToResponseItem),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
