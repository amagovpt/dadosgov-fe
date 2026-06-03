import type { Organization } from "@/service/types/identity";
import type {
  Reuse,
  ReuseCreatePayload,
  ReuseFilters,
  ReuseSuggestion,
  ReuseTopic,
  ReuseType,
  ReuseUpdatePayload,
} from "@/service/types/reuse";
import type { APIResponse } from "@/service/types/shared";
import { API_AUTH_URL, API_BASE_URL, translateUploadErrorPayload } from "@/service/utils/API";


/**
 * Fetch the authenticated user's reuses (paginated)
 */
export async function fetchMyReuses(
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<Reuse>> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/me/reuses/`,
      { cache: "no-store", credentials: "include" }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch my reuses: ${res.statusText}`);
    }

    const raw: Reuse[] = await res.json();
    const allReuses = raw;
    const total = allReuses.length;
    const start = (page - 1) * pageSize;
    const data = allReuses.slice(start, start + pageSize);

    return {
      data,
      page,
      page_size: pageSize,
      total,
      next_page: start + pageSize < total ? String(page + 1) : null,
      previous_page: page > 1 ? String(page - 1) : null,
    };
  } catch (error) {
    console.error("Error fetching my reuses:", error);
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


export async function fetchReuses(
  page: number = 1,
  pageSize: number = 20,
  filters?: ReuseFilters
): Promise<APIResponse<Reuse>> {
  const empty: APIResponse<Reuse> = {
    data: [],
    page: 1,
    page_size: pageSize,
    total: 0,
    next_page: null,
    previous_page: null,
  };

  try {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));

    if (filters) {
      if (filters.q) params.set("q", filters.q);
      if (filters.type) params.set("type", filters.type);
      if (filters.owner) params.set("owner", filters.owner);
      if (filters.dataset) params.set("dataset", filters.dataset);
      if (filters.sort) params.set("sort", filters.sort);
      if (filters.modified_since) params.set("modified_since", filters.modified_since);

      const arrayParams: [string, string | string[] | undefined][] = [
        ["tag", filters.tag],
        ["organization", filters.organization],
      ];
      for (const [key, value] of arrayParams) {
        if (!value) continue;
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v));
        } else {
          params.set(key, value);
        }
      }
    }

    const url = `${API_BASE_URL}/reuses/?${params.toString()}`;
    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) {
      return empty;
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching reuses:", error);
    return empty;
  }
}

export async function fetchReuse(rid: string): Promise<Reuse> {
  try {
    const res = await fetch(`${API_BASE_URL}/reuses/${rid}/`, {
      cache: "no-store",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch reuse: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching reuse:", error);
    throw error;
  }
}


export async function fetchReuseTypes(): Promise<ReuseType[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/reuses/types/`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch reuse types: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching reuse types:", error);
    return [];
  }
}


export async function fetchReuseTopics(): Promise<ReuseTopic[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/reuses/topics/`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch reuse topics: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching reuse topics:", error);
    return [];
  }
}


export async function createReuse(payload: ReuseCreatePayload): Promise<Reuse> {
  const res = await fetch(`${API_AUTH_URL}/reuses/`, {
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


export async function updateReuse(
  id: string,
  payload: ReuseUpdatePayload
): Promise<Reuse> {
  const res = await fetch(`${API_AUTH_URL}/reuses/${id}/`, {
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


export async function deleteReuse(id: string): Promise<void> {
  const res = await fetch(`${API_AUTH_URL}/reuses/${id}/`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to delete reuse: ${res.statusText}`);
}


export async function uploadReuseImage(id: string, file: File): Promise<Reuse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_AUTH_URL}/reuses/${id}/image/`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, data: translateUploadErrorPayload(error) };
  }
  return await res.json();
}


export async function linkDatasetToReuse(
  reuseId: string,
  datasetId: string
): Promise<Reuse> {
  const res = await fetch(`${API_AUTH_URL}/reuses/${reuseId}/datasets/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ id: datasetId }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, data: error };
  }
  return await res.json();
}


export async function unlinkDatasetFromReuse(
  reuseId: string,
  datasetId: string
): Promise<void> {
  const res = await fetch(`${API_AUTH_URL}/reuses/${reuseId}/datasets/${datasetId}/`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, data: error };
  }
}


export async function linkDataserviceToReuse(
  reuseId: string,
  dataserviceId: string
): Promise<Reuse> {
  const res = await fetch(`${API_AUTH_URL}/reuses/${reuseId}/dataservices/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ id: dataserviceId }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, data: error };
  }
  return await res.json();
}


export async function suggestReuses(
  query: string,
  size: number = 5
): Promise<ReuseSuggestion[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/reuses/suggest/?q=${encodeURIComponent(query)}&size=${size}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Failed to suggest reuses: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error suggesting reuses:", error);
    return [];
  }
}


export async function followReuse(id: string): Promise<void> {
  const res = await fetch(`${API_AUTH_URL}/reuses/${id}/followers/`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to follow reuse: ${res.statusText}`);
}


export async function unfollowReuse(id: string): Promise<void> {
  const res = await fetch(`${API_AUTH_URL}/reuses/${id}/followers/`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to unfollow reuse: ${res.statusText}`);
}


export interface ReusesListingResponse {
  listing: APIResponse<Reuse>;
  filter_counts: Record<string, number>;
  organizations: Organization[];
  error?: boolean;
  errorStatus?: number | "network";
}


/**
 * Aggregated fetch for the /pages/reuses listing page (LEDG-1836).
 * Replaces 6 parallel calls with 1 to /api/1/site/reuses-listing/.
 */
export async function fetchReusesListing(
  page: number = 1,
  pageSize: number = 12,
  filters?: ReuseFilters
): Promise<ReusesListingResponse> {
  const emptyShape: ReusesListingResponse = {
    listing: { data: [], page: 1, page_size: pageSize, total: 0, next_page: null, previous_page: null },
    filter_counts: {},
    organizations: [],
  };

  try {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));

    if (filters) {
      if (filters.q) params.set("q", filters.q);
      if (filters.type) params.set("type", filters.type);
      if (filters.owner) params.set("owner", filters.owner);
      if (filters.dataset) params.set("dataset", filters.dataset);
      if (filters.sort) params.set("sort", filters.sort);
      if (filters.modified_since) params.set("modified_since", filters.modified_since);

      const arrayParams: [string, string | string[] | undefined][] = [
        ["tag", filters.tag],
        ["organization", filters.organization],
      ];
      for (const [key, value] of arrayParams) {
        if (!value) continue;
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v));
        } else {
          params.set(key, value);
        }
      }
    }

    const url = `${API_BASE_URL}/site/reuses-listing/?${params.toString()}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.error(`Error fetching reuses listing: ${res.status} ${res.statusText}`);
      return {
        ...emptyShape,
        listing: { ...emptyShape.listing, error: true, errorStatus: res.status },
        error: true,
        errorStatus: res.status,
      };
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching reuses listing:", error);
    return {
      ...emptyShape,
      listing: { ...emptyShape.listing, error: true, errorStatus: "network" },
      error: true,
      errorStatus: "network",
    };
  }
}
