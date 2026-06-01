import type {
  DatasetBadges,
  FormatSuggestion,
  Frequency,
  Granularity,
  License,
  ResourceType,
  SpatialZone,
} from '@/service/types/catalog';
import type {
  Dataset,
  DatasetCreatePayload,
  DatasetFilters,
  DatasetSuggestion,
  DatasetUpdatePayload,
  Resource,
  ResourceCreatePayload,
  ResourceUpdatePayload,
} from '@/service/types/dataset';
import type { Organization } from '@/service/types/identity';
import type { APIResponse } from '@/service/types/shared/core';
import { translateUploadError } from "@/lib/security/translateUploadError";
import { authFetch, getApiBaseUrl, getAuthApiBaseUrl } from "@/service/utils/API";

/**
 * Aggregated response for the /pages/datasets listing page. Replaces the 14
 * parallel calls (listing + 9 filter counts + sidebar lookups) with one (LEDG-1836).
 * Inherits the LEDG-1831 error/errorStatus signal when the fetch failed.
 */
export interface DatasetsListingResponse {
  listing: APIResponse<Dataset>;
  filter_counts: Record<string, number>;
  organizations: Organization[];
  licenses: License[];
  frequencies: Frequency[];
  granularities: Granularity[];
  error?: boolean;
  errorStatus?: number | "network";
}

const API_BASE_URL = getApiBaseUrl(1);
const API_AUTH_URL = getAuthApiBaseUrl();

function translateUploadErrorPayload(
  data: Record<string, unknown>
): Record<string, unknown> {
  if (typeof data?.message !== "string") return data;
  return { ...data, message: translateUploadError(data.message) };
}

/**
 * Fetch the authenticated user's personal datasets (owner = current user).
 * Backend returns a flat array; we filter out org-owned and wrap into APIResponse.
 */
export async function fetchMyDatasets(
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<Dataset>> {
  try {
    const res = await authFetch("/me/datasets/", { cache: "no-store" });

    if (!res.ok) {
      throw new Error(`Failed to fetch my datasets: ${res.statusText}`);
    }

    const raw: Dataset[] = await res.json();
    // Keep only personal datasets: owner must exist and organization must be absent
    const allDatasets = raw.filter((d) => !!d.owner && !d.organization);
    const total = allDatasets.length;
    const start = (page - 1) * pageSize;
    const data = allDatasets.slice(start, start + pageSize);

    return {
      data,
      page,
      page_size: pageSize,
      total,
      next_page: start + pageSize < total ? String(page + 1) : null,
      previous_page: page > 1 ? String(page - 1) : null,
    };
  } catch (error) {
    console.error("Error fetching my datasets:", error);
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
 * Fetch datasets from the authenticated user's organizations.
 * Backend returns a flat array; we wrap it into APIResponse for consistency.
 */
export async function fetchMyOrgDatasets(
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<Dataset>> {
  try {
    const res = await authFetch("/me/org_datasets/", { cache: "no-store" });

    if (!res.ok) {
      throw new Error(`Failed to fetch my org datasets: ${res.statusText}`);
    }

    const allDatasets: Dataset[] = await res.json();
    const total = allDatasets.length;
    const start = (page - 1) * pageSize;
    const data = allDatasets.slice(start, start + pageSize);

    return {
      data,
      page,
      page_size: pageSize,
      total,
      next_page: start + pageSize < total ? String(page + 1) : null,
      previous_page: page > 1 ? String(page - 1) : null,
    };
  } catch (error) {
    console.error("Error fetching my org datasets:", error);
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

export async function fetchDatasets(
  page: number = 1,
  pageSize: number = 20,
  filters?: DatasetFilters
): Promise<APIResponse<Dataset>> {
  try {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));

    if (filters) {
      if (filters.q) params.set("q", filters.q);
      if (filters.schema) params.set("schema", filters.schema);
      if (filters.geozone) params.set("geozone", filters.geozone);
      if (filters.granularity) params.set("granularity", filters.granularity);
      if (filters.sort) params.set("sort", filters.sort);
      if (filters.featured !== undefined) params.set("featured", String(filters.featured));
      if (filters.owner) params.set("owner", filters.owner);
      if (filters.modified_since) params.set("modified_since", filters.modified_since);

      const arrayParams: [string, string | string[] | undefined][] = [
        ["tag", filters.tag],
        ["license", filters.license],
        ["format", filters.format],
        ["frequency", filters.frequency],
        ["badge", filters.badge],
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

    const url = `${API_BASE_URL}/datasets/?${params.toString()}`;
    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`Error fetching datasets: ${res.status} ${res.statusText}`);
      return {
        data: [],
        page: 1,
        page_size: pageSize,
        total: 0,
        next_page: null,
        previous_page: null,
        error: true,
        errorStatus: res.status,
      };
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching datasets:", error);
    return {
      data: [],
      page: 1,
      page_size: pageSize,
      total: 0,
      next_page: null,
      previous_page: null,
      error: true,
      errorStatus: "network",
    };
  }
}

/**
 * Aggregated fetch for the /pages/datasets listing page.
 *
 * Hits /api/1/site/datasets-listing/ which returns the paginated listing,
 * sidebar filter counts and metadata in one response — replaces the prior
 * Promise.all of 14 calls (LEDG-1836). On failure, surfaces `error` and
 * `errorStatus` on the response itself so the listing page renders the
 * LEDG-1831 banner with the right status code.
 */
export async function fetchDatasetsListing(
  page: number = 1,
  pageSize: number = 20,
  filters?: DatasetFilters
): Promise<DatasetsListingResponse> {
  const emptyShape: DatasetsListingResponse = {
    listing: {
      data: [],
      page: 1,
      page_size: pageSize,
      total: 0,
      next_page: null,
      previous_page: null,
    },
    filter_counts: {},
    organizations: [],
    licenses: [],
    frequencies: [],
    granularities: [],
  };

  try {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));

    if (filters) {
      if (filters.q) params.set("q", filters.q);
      if (filters.schema) params.set("schema", filters.schema);
      if (filters.geozone) params.set("geozone", filters.geozone);
      if (filters.granularity) params.set("granularity", filters.granularity);
      if (filters.sort) params.set("sort", filters.sort);
      if (filters.featured !== undefined) params.set("featured", String(filters.featured));
      if (filters.owner) params.set("owner", filters.owner);
      if (filters.modified_since) params.set("modified_since", filters.modified_since);

      const arrayParams: [string, string | string[] | undefined][] = [
        ["tag", filters.tag],
        ["license", filters.license],
        ["format", filters.format],
        ["frequency", filters.frequency],
        ["badge", filters.badge],
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

    const url = `${API_BASE_URL}/site/datasets-listing/?${params.toString()}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.error(`Error fetching datasets listing: ${res.status} ${res.statusText}`);
      return {
        ...emptyShape,
        listing: { ...emptyShape.listing, error: true, errorStatus: res.status },
        error: true,
        errorStatus: res.status,
      };
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching datasets listing:", error);
    return {
      ...emptyShape,
      listing: { ...emptyShape.listing, error: true, errorStatus: "network" },
      error: true,
      errorStatus: "network",
    };
  }
}

/**
 * Fetch datasets with authentication (for admin pages).
 * Sends cookies so backend can return private/archived/deleted datasets.
 */
export async function fetchAdminDatasets(
  page: number = 1,
  pageSize: number = 20,
  filters?: DatasetFilters
): Promise<APIResponse<Dataset>> {
  try {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));

    if (filters) {
      if (filters.q) params.set("q", filters.q);
      if (filters.schema) params.set("schema", filters.schema);
      if (filters.geozone) params.set("geozone", filters.geozone);
      if (filters.granularity) params.set("granularity", filters.granularity);
      if (filters.sort) params.set("sort", filters.sort);
      if (filters.featured !== undefined) params.set("featured", String(filters.featured));
      if (filters.private !== undefined) params.set("private", String(filters.private));
      if (filters.archived !== undefined) params.set("archived", String(filters.archived));
      if (filters.deleted !== undefined) params.set("deleted", String(filters.deleted));

      const arrayParams: [string, string | string[] | undefined][] = [
        ["tag", filters.tag],
        ["license", filters.license],
        ["format", filters.format],
        ["frequency", filters.frequency],
        ["badge", filters.badge],
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

    const res = await authFetch(`/datasets/?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch datasets: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching datasets:", error);
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

export async function fetchLicenses(): Promise<License[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/datasets/licenses/`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch licenses: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching licenses:", error);
    return [];
  }
}

export async function fetchFrequencies(): Promise<Frequency[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/datasets/frequencies/`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch frequencies: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching frequencies:", error);
    return [];
  }
}

export async function fetchSchemas(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/datasets/schemas/`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch schemas: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching schemas:", error);
    return [];
  }
}

export async function fetchDatasetBadges(): Promise<DatasetBadges> {
  try {
    const res = await fetch(`${API_BASE_URL}/datasets/badges/`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch dataset badges: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching dataset badges:", error);
    return {};
  }
}

export async function fetchResourceTypes(): Promise<ResourceType[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/datasets/resource_types/`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch resource types: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching resource types:", error);
    return [];
  }
}

export async function fetchGranularities(): Promise<Granularity[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/spatial/granularities/`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch granularities: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching granularities:", error);
    return [];
  }
}

export async function fetchSpatialZonesByIds(ids: string[]): Promise<SpatialZone[]> {
  if (!ids.length) return [];
  try {
    const res = await fetch(`${API_BASE_URL}/spatial/zones/${ids.join(",")}/`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Failed to fetch spatial zones: ${res.statusText}`);
    const geojson = (await res.json()) as {
      features?: Array<{
        id: string;
        properties: { name: string; code: string; uri?: string; level?: unknown };
      }>;
    };
    return (geojson.features ?? []).map((f) => ({
      id: f.id,
      name: f.properties.name,
      code: f.properties.code,
      uri: f.properties.uri ?? "",
      // Backend may include a flexible level reference (id or object).
      level: f.properties.level ?? "",
    })) as SpatialZone[];
  } catch (error) {
    console.error("Error fetching spatial zones by ids:", error);
    return [];
  }
}

export async function fetchDataset(slug: string): Promise<Dataset> {
  try {
    const res = await fetch(`${API_AUTH_URL}/datasets/${slug}/`, {
      cache: "no-store",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch dataset: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching dataset:", error);
    throw error;
  }
}

export async function createDataset(payload: DatasetCreatePayload): Promise<Dataset> {
  const res = await fetch(`${API_AUTH_URL}/datasets/`, {
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

export async function updateDataset(id: string, payload: DatasetUpdatePayload): Promise<Dataset> {
  const res = await fetch(`${API_AUTH_URL}/datasets/${id}/`, {
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

export async function deleteDataset(id: string): Promise<void> {
  const res = await fetch(`${API_AUTH_URL}/datasets/${id}/`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to delete dataset: ${res.statusText}`);
}

export async function createResource(
  datasetId: string,
  payload: ResourceCreatePayload
): Promise<Resource> {
  const res = await fetch(`${API_AUTH_URL}/datasets/${datasetId}/resources/`, {
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

export async function uploadResource(datasetId: string, file: File): Promise<Resource> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_AUTH_URL}/datasets/${datasetId}/upload/`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const text = await res.text();
  if (!res.ok) {
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text);
    } catch {
      if (text) data = { message: text };
    }
    throw { status: res.status, data: translateUploadErrorPayload(data) };
  }
  try {
    return JSON.parse(text) as Resource;
  } catch {
    throw new Error(
      `Upload returned ${res.status} but response is not valid JSON: ${text.slice(0, 200)}`
    );
  }
}

export async function updateResource(
  datasetId: string,
  resourceId: string,
  payload: ResourceUpdatePayload
): Promise<Resource> {
  const res = await fetch(`${API_AUTH_URL}/datasets/${datasetId}/resources/${resourceId}/`, {
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

export async function replaceResourceFile(
  datasetId: string,
  resourceId: string,
  file: File
): Promise<Resource> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_AUTH_URL}/datasets/${datasetId}/resources/${resourceId}/upload/`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const text = await res.text();
  if (!res.ok) {
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text);
    } catch {
      if (text) data = { message: text };
    }
    throw { status: res.status, data: translateUploadErrorPayload(data) };
  }
  try {
    return JSON.parse(text);
  } catch {
    return {} as Resource;
  }
}

export async function deleteResource(datasetId: string, resourceId: string): Promise<void> {
  const res = await fetch(`${API_AUTH_URL}/datasets/${datasetId}/resources/${resourceId}/`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to delete resource: ${res.statusText}`);
}

export async function reorderResources(datasetId: string, resourceIds: string[]): Promise<void> {
  const res = await fetch(`${API_AUTH_URL}/datasets/${datasetId}/resources/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(resourceIds),
  });
  if (!res.ok) throw new Error(`Failed to reorder resources: ${res.statusText}`);
}

export async function toggleDatasetFeatured(id: string, featured: boolean): Promise<Dataset> {
  const res = await fetch(`${API_AUTH_URL}/datasets/${id}/featured/`, {
    method: featured ? "POST" : "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to toggle dataset featured: ${res.statusText}`);
  return await res.json();
}

export async function fetchAllowedExtensions(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/datasets/extensions/`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Failed to fetch allowed extensions: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching allowed extensions:", error);
    return [];
  }
}

export async function suggestFormats(query: string): Promise<FormatSuggestion[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/datasets/suggest/formats/?q=${encodeURIComponent(query)}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Failed to suggest formats: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error suggesting formats:", error);
    return [];
  }
}

export async function suggestDatasets(
  query: string,
  size: number = 5
): Promise<DatasetSuggestion[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/datasets/suggest/?q=${encodeURIComponent(query)}&size=${size}`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      throw new Error(`Failed to fetch dataset suggestions: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching dataset suggestions:", error);
    return [];
  }
}

