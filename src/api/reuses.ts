import { translateUploadError } from "@/lib/security/translateUploadError";
import {
  APIResponse,
  Reuse,
  ReuseCreatePayload,
  ReuseFilters,
  ReuseTopic,
  ReuseType,
  ReuseUpdatePayload,
} from "@/types/api";
import { authFetch, getApiBaseUrl, getAuthApiBaseUrl } from "@/service/utils/API";

const API_BASE_URL = getApiBaseUrl(1);
const API_AUTH_URL = getAuthApiBaseUrl();

/**
 * Fetch the authenticated user's reuses (paginated)
 */
export async function fetchMyReuses(
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<Reuse>> {
  try {
    const res = await authFetch("/me/reuses/", { cache: "no-store" });

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
    if (typeof error?.message === "string") {
      error.message = translateUploadError(error.message);
    }
    throw { status: res.status, data: error };
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
): Promise<Reuse> {
  const res = await fetch(`${API_AUTH_URL}/reuses/${reuseId}/datasets/`, {
    method: "DELETE",
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
