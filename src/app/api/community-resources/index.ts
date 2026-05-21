import { translateUploadError } from "@/lib/security/translateUploadError";
import type {
  CommunityResource,
  CommunityResourceCreatePayload,
  CommunityResourceUpdatePayload,
} from '@/service/types/community-resource';
import type { APIResponse } from '@/service/types/shared/core';
import { authFetch, getApiBaseUrl, getAuthApiBaseUrl } from "@/service/utils/API";

const API_BASE_URL = getApiBaseUrl(1);
const API_AUTH_URL = getAuthApiBaseUrl();

function translateUploadErrorPayload(
  data: Record<string, unknown>,
): Record<string, unknown> {
  if (typeof data?.message !== "string") return data;
  return { ...data, message: translateUploadError(data.message) };
}

export async function fetchMyCommunityResources(
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<CommunityResource>> {
  try {
    const res = await authFetch("/me/org_community_resources/", { cache: "no-store" });
    if (!res.ok)
      throw new Error(`Failed to fetch my community resources: ${res.statusText}`);

    const raw: CommunityResource[] = await res.json();
    const total = raw.length;
    const start = (page - 1) * pageSize;
    const data = raw.slice(start, start + pageSize);

    return {
      data,
      page,
      page_size: pageSize,
      total,
      next_page: start + pageSize < total ? `${page + 1}` : null,
      previous_page: page > 1 ? `${page - 1}` : null,
    };
  } catch (error) {
    console.error("Error fetching my community resources:", error);
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

export async function fetchMyOrgCommunityResources(
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<CommunityResource>> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/me/org_community_resources/?page=${page}&page_size=${pageSize}`,
      { cache: "no-store", credentials: "include" }
    );
    if (!res.ok)
      throw new Error(`Failed to fetch org community resources: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching org community resources:", error);
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

export async function fetchAllCommunityResources(
  page: number = 1,
  pageSize: number = 20
): Promise<{ data: CommunityResource[]; total: number }> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/datasets/community_resources/?page=${page}&page_size=${pageSize}`,
      { cache: "no-store", credentials: "include" }
    );
    if (!res.ok) return { data: [], total: 0 };
    const json = await res.json();
    return { data: json.data || [], total: json.total || 0 };
  } catch {
    return { data: [], total: 0 };
  }
}

export async function fetchCommunityResourcesByDataset(
  datasetId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ data: CommunityResource[]; total: number }> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/datasets/community_resources/?dataset=${datasetId}&page=${page}&page_size=${pageSize}`,
      { cache: "no-store" }
    );
    if (!res.ok) return { data: [], total: 0 };
    const json = await res.json();
    return { data: json.data || [], total: json.total || 0 };
  } catch {
    return { data: [], total: 0 };
  }
}

export async function createCommunityResource(
  payload: CommunityResourceCreatePayload
): Promise<CommunityResource> {
  const res = await fetch(`${API_AUTH_URL}/datasets/community_resources/`, {
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

export async function fetchCommunityResource(
  id: string
): Promise<CommunityResource> {
  const res = await fetch(`${API_BASE_URL}/datasets/community_resources/${id}/`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch community resource: ${res.statusText}`);
  }
  return await res.json();
}

export async function updateCommunityResource(
  id: string,
  payload: CommunityResourceUpdatePayload
): Promise<CommunityResource> {
  const res = await fetch(`${API_AUTH_URL}/datasets/community_resources/${id}/`, {
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

export async function deleteCommunityResource(id: string): Promise<void> {
  const res = await fetch(`${API_AUTH_URL}/datasets/community_resources/${id}/`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to delete community resource: ${res.statusText}`);
}

export async function uploadCommunityResourceFile(
  id: string,
  file: File
): Promise<CommunityResource> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_AUTH_URL}/datasets/community_resources/${id}/upload/`, {
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

export async function fetchOrgCommunityResources(
  org: string,
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<CommunityResource>> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/datasets/community_resources/?organization=${org}&page=${page}&page_size=${pageSize}`,
      { cache: "no-store", credentials: "include" }
    );
    if (!res.ok)
      throw new Error(`Failed to fetch org community resources: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching org community resources:", error);
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

