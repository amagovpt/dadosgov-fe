import type { SpatialZone, TagSuggestion } from "@/service/types/catalog";
import type { Dataset } from "@/service/types/dataset";
import type { Organization, UserSuggestion } from "@/service/types/identity";
import type { Reuse } from "@/service/types/reuse";
import type { GlobalSearchSuggestion } from "@/service/types/search";
import type { APIResponse } from "@/service/types/shared";
import { API_AUTH_URL, API_BASE_URL } from "@/service/utils/API";


export async function searchDatasets(
  query: string,
  page: number = 1,
  pageSize: number = 10
): Promise<APIResponse<Dataset>> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/datasets/?q=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      throw new Error(`Failed to search datasets: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error searching datasets:", error);
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


export async function searchOrganizations(
  query: string,
  page: number = 1,
  pageSize: number = 10
): Promise<APIResponse<Organization>> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/organizations/?q=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      throw new Error(`Failed to search organizations: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error searching organizations:", error);
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


export async function searchReuses(
  query: string,
  page: number = 1,
  pageSize: number = 10
): Promise<APIResponse<Reuse>> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/reuses/?q=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      throw new Error(`Failed to search reuses: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error searching reuses:", error);
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


export async function suggestTags(query: string, size: number = 10): Promise<TagSuggestion[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/tags/suggest/?q=${encodeURIComponent(query)}&size=${size}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Failed to suggest tags: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error suggesting tags:", error);
    return [];
  }
}


export async function suggestGlobalSearch(
  query: string,
  size: number = 5
): Promise<GlobalSearchSuggestion[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/datasets/suggest/?q=${encodeURIComponent(query)}&size=${size}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch search suggestions: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching search suggestions:", error);
    return [];
  }
}


// --- Spatial / Geographic ---

export async function suggestSpatialZones(
  query: string,
  size: number = 10
): Promise<SpatialZone[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/spatial/zones/suggest/?q=${encodeURIComponent(query)}&size=${size}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Failed to suggest spatial zones: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error suggesting spatial zones:", error);
    return [];
  }
}


export async function suggestUsers(query: string, size: number = 20): Promise<UserSuggestion[]> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/users/suggest/?q=${encodeURIComponent(query)}&size=${size}`,
      { cache: "no-store", credentials: "include" }
    );

    if (!res.ok) {
      throw new Error(`Failed to suggest users: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error suggesting users:", error);
    return [];
  }
}
