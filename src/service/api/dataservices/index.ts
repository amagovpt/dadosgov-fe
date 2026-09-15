import type {
  Dataservice,
  DataserviceCreatePayload,
  DataserviceUpdatePayload,
} from "@/service/types/dataservice";
import type { APIResponse } from "@/service/types/shared";
import { API_AUTH_URL, API_BASE_URL, authFetch } from "@/service/utils/API";
import { parseOpenApi, type ParsedSwagger } from "@/utils/parseOpenApi";
import { rethrowControlFlow } from "@/service/utils/rethrowControlFlow";

/**
 * Fetch and parse a dataservice's OpenAPI/Swagger spec through the SSRF-guarded
 * same-origin proxy. Returns null when the URL is missing/unreachable or the
 * document is not recognisable JSON spec (e.g. a YAML spec).
 */
export async function fetchSwaggerSpec(
  machineDocumentationUrl: string
): Promise<ParsedSwagger | null> {
  try {
    const res = await fetch(
      `/internal-api/proxy-swagger?url=${encodeURIComponent(machineDocumentationUrl)}`
    );
    if (!res.ok) return null;
    return parseOpenApi(await res.json());
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error fetching Swagger spec:", error);
    return null;
  }
}


/**
 * Fetch the authenticated user's dataservices (paginated)
 */
export async function fetchMyDataservices(
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<Dataservice>> {
  try {
    const res = await authFetch("/me/dataservices/", { cache: "no-store" });

    if (!res.ok) {
      throw new Error(`Failed to fetch my dataservices: ${res.statusText}`);
    }

    // The /me/dataservices endpoint returns a plain list; normalise it into the
    // paginated APIResponse shape and keep only personal entries (owned by the
    // user, not by an organization), mirroring fetchMyDatasets.
    const raw: Dataservice[] = await res.json();
    const personal = raw.filter((d) => !!d.owner && !d.organization);
    const total = personal.length;
    const start = (page - 1) * pageSize;
    const data = personal.slice(start, start + pageSize);

    return {
      data,
      page,
      page_size: pageSize,
      total,
      next_page: start + pageSize < total ? String(page + 1) : null,
      previous_page: page > 1 ? String(page - 1) : null,
    };
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error fetching my dataservices:", error);
    return {
      data: [],
      page: 1,
      page_size: pageSize,
      total: 0,
      next_page: null,
      previous_page: null,
    };
  }
}


/**
 * Fetch all dataservices (paginated, with optional filters)
 */
export interface DataserviceListFilters {
  q?: string;
  sort?: string;
  owner?: string;
  organization?: string | string[];
  access_type?: string;
  organization_badge?: string;
  modified_since?: string;
  dataset?: string;
}

function buildDataserviceListParams(
  page: number,
  pageSize: number,
  filters?: DataserviceListFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", String(pageSize));
  if (filters?.q) params.set("q", filters.q);
  if (filters?.sort) params.set("sort", filters.sort);
  if (filters?.owner) params.set("owner", filters.owner);
  if (filters?.access_type) params.set("access_type", filters.access_type);
  if (filters?.organization_badge) params.set("organization_badge", filters.organization_badge);
  if (filters?.modified_since) params.set("modified_since", filters.modified_since);
  if (filters?.dataset) params.set("dataset", filters.dataset);

  const organization = filters?.organization;
  if (organization) {
    for (const item of Array.isArray(organization) ? organization : [organization]) {
      if (item) params.append("organization", item);
    }
  }
  return params;
}

export async function fetchDataservices(
  page: number = 1,
  pageSize: number = 20,
  filters?: DataserviceListFilters
): Promise<APIResponse<Dataservice>> {
  try {
    const params = buildDataserviceListParams(page, pageSize, filters);

    const res = await fetch(
      `${API_BASE_URL}/dataservices/?${params.toString()}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch dataservices: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error fetching dataservices:", error);
    return {
      data: [],
      page: 1,
      page_size: pageSize,
      total: 0,
      next_page: null,
      previous_page: null,
    };
  }
}

/**
 * Fetch dataservices through the authenticated route. This keeps private
 * personal entries visible while using the normal paginated listing API.
 */
export async function fetchAdminDataservices(
  page: number = 1,
  pageSize: number = 20,
  filters?: DataserviceListFilters,
): Promise<APIResponse<Dataservice>> {
  try {
    const params = buildDataserviceListParams(page, pageSize, filters);
    const res = await authFetch(`/dataservices/?${params.toString()}`, { cache: "no-store" });

    if (!res.ok) {
      throw new Error(`Failed to fetch authenticated dataservices: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error fetching authenticated dataservices:", error);
    return {
      data: [],
      page: 1,
      page_size: pageSize,
      total: 0,
      next_page: null,
      previous_page: null,
    };
  }
}


export async function fetchOrgDataservices(
  org: string,
  page: number = 1,
  pageSize: number = 20,
  filters?: DataserviceListFilters,
): Promise<APIResponse<Dataservice>> {
  try {
    const params = buildDataserviceListParams(page, pageSize, filters);
    params.set("organization", org);
    const res = await fetch(
      `${API_BASE_URL}/dataservices/?${params.toString()}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch organization dataservices: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error fetching organization dataservices:", error);
    return {
      data: [],
      page: 1,
      page_size: pageSize,
      total: 0,
      next_page: null,
      previous_page: null,
    };
  }
}


/**
 * Fetch a single dataservice by ID
 */
export async function fetchDataservice(id: string): Promise<Dataservice> {
  try {
    const res = await fetch(`${API_BASE_URL}/dataservices/${id}/`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch dataservice: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error fetching dataservice:", error);
    throw error;
  }
}


/**
 * Create a new dataservice
 */
export async function createDataservice(
  payload: DataserviceCreatePayload
): Promise<Dataservice> {
  const res = await fetch(`${API_AUTH_URL}/dataservices/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, data: error };
  }
  return await res.json();
}


/**
 * Update an existing dataservice
 */
export async function updateDataservice(
  id: string,
  payload: DataserviceUpdatePayload
): Promise<Dataservice> {
  const res = await fetch(`${API_AUTH_URL}/dataservices/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, data: error };
  }
  return await res.json();
}


/**
 * Delete a dataservice
 */
export async function deleteDataservice(id: string): Promise<void> {
  const res = await fetch(`${API_AUTH_URL}/dataservices/${id}/`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to delete dataservice: ${res.statusText}`);
}


export async function searchDataservices(
  query: string,
  page: number = 1,
  pageSize: number = 10
): Promise<APIResponse<Dataservice>> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/dataservices/?q=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      throw new Error(`Failed to search dataservices: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error searching dataservices:", error);
    return {
      data: [],
      page: 1,
      page_size: pageSize,
      total: 0,
      next_page: null,
      previous_page: null,
    };
  }
}
