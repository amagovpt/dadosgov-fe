import type {
  Dataservice,
  DataserviceCreatePayload,
  DataserviceUpdatePayload,
} from "@/service/types/dataservice";
import type { APIResponse } from "@/service/types/shared";
import { API_AUTH_URL, API_BASE_URL } from "@/service/utils/API";


/**
 * Fetch the authenticated user's dataservices (paginated)
 */
export async function fetchMyDataservices(
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<Dataservice>> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/me/dataservices/?page=${page}&page_size=${pageSize}`,
      { cache: "no-store", credentials: "include" }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch my dataservices: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching discussions:", error);
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
export async function fetchDataservices(
  page: number = 1,
  pageSize: number = 20,
  filters?: { q?: string; sort?: string }
): Promise<APIResponse<Dataservice>> {
  try {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));
    if (filters?.q) params.set("q", filters.q);
    if (filters?.sort) params.set("sort", filters.sort);

    const res = await fetch(
      `${API_BASE_URL}/dataservices/?${params.toString()}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch dataservices: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
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


export async function fetchOrgDataservices(
  org: string,
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<Dataservice>> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/dataservices/?organization=${org}&page=${page}&page_size=${pageSize}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch organization dataservices: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
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
    method: "PUT",
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
