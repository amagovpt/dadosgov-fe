import {
  Activity,
  APIResponse,
  ApiToken,
  ApiTokenCreated,
  Dataservice,
  Dataset,
  DatasetBadges,
  DatasetCreatePayload,
  DatasetFilters,
  DatasetSuggestion,
  Discussion,
  DiscussionCreatePayload,
  DatasetUpdatePayload,
  Follow,
  FollowableEntityType,
  FollowResponse,
  UserFollowing,
  FormatSuggestion,
  Frequency,
  License,
  Organization,
  Resource,
  ResourceCreatePayload,
  ResourceType,
  ResourceUpdatePayload,
  Reuse,
  ReuseCreatePayload,
  ReuseFilters,
  ReuseSuggestion,
  ReuseTopic,
  ReuseType,
  ReuseUpdatePayload,
  GeoLevel,
  Granularity,
  Report,
  ReportCreatePayload,
  ReportReason,
  SpatialZone,
  Topic,
  TopicCreatePayload,
  TopicElement,
  TopicElementCreatePayload,
  TopicUpdatePayload,
  UserMetrics,
  UserPublic,
  UserAdmin,
  UserAdminUpdatePayload,
  UserRole,
  UserUpdatePayload,
  CommunityResource,
  CommunityResourceCreatePayload,
  CommunityResourceUpdatePayload,
  HarvestBackend,
  HarvestJob,
  HarvestPreviewJob,
  HarvestSource,
  HarvestSourceCreatePayload,
  HarvestSourceUpdatePayload,
  HarvestValidationPayload,
  Transfer,
  TransferRequestPayload,
} from "@/types/api";
import { translateUploadError } from "@/lib/security/translateUploadError";
export { fetchCsrfToken, login, logout, fetchCurrentUser } from "@/api/auth";
export { fetchMyDatasets, fetchMyOrgDatasets } from "@/api/datasets";
export { fetchMyReuses } from "@/api/reuses";
export {
  fetchUserProfile,
  updateProfile,
  uploadUserAvatar,
  fetchUsers,
  fetchUser,
  updateUser,
  deleteUser,
  fetchUserRoles,
  fetchUserActivity,
} from "@/api/users";
export {
  uploadAvatar,
  deleteAvatar,
  fetchFullProfile,
  fetchApiTokens,
  generateApiKey,
  revokeApiToken,
  requestEmailChange,
  changePassword,
  deleteAccount,
  fetchMyMetrics,
} from "@/api/profile";
export {
  fetchMigrationPending,
  searchMigrationAccount,
  sendMigrationCode,
  confirmMigration,
  skipMigration,
} from "@/api/migration";
export {
  fetchOrganizations,
  fetchOrganization,
  fetchOrgBadges,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  uploadOrgLogo,
  suggestOrganizations,
  fetchOrgRoles,
  requestMembership,
  fetchMembershipRequests,
  acceptMembership,
  refuseMembership,
  addMember,
  updateMemberRole,
  removeMember,
  fetchOrgContactPoints,
  createContactPoint,
  fetchOrgMetrics,
  fetchOrgInvitations,
  fetchOrgDatasets,
  fetchOrgReuses,
} from "@/api/organizations";
export {
  fetchDataservices,
  fetchMyDataservices,
  fetchOrgDataservices,
  fetchDataservice,
  createDataservice,
  updateDataservice,
  deleteDataservice,
  searchDataservices,
} from "@/api/dataservices";
export {
  searchDatasets,
  searchOrganizations,
  searchReuses,
  suggestTags,
  suggestUsers,
  suggestGlobalSearch,
  suggestSpatialZones,
} from "@/api/search";
export {
  fetchPosts,
  fetchPost,
  createPost,
  updatePost,
  fetchAdminPosts,
  publishPost,
  unpublishPost,
  deletePost,
  uploadPostImage,
} from "@/api/posts";
export {
  fetchNotifications,
  markNotificationRead,
} from "@/api/notifications";
export {
  fetchSiteInfo,
  updateSiteConfig,
  fetchHomepageData,
  fetchFeaturedDatasets,
  fetchFeaturedReuses,
  fetchLatestDatasets,
  fetchLatestReuses,
  fetchHomeFeaturedDatasets,
  updateHomeFeaturedDatasets,
  fetchHomeFeaturedReuses,
  updateHomeFeaturedReuses,
  fetchSystemLogs,
  fetchSystemLogContent,
  submitSupportContact,
} from "@/api/system";
export type { SupportTopic } from "@/api/system";

// Server-side (Node.js) needs absolute URLs; client-side uses relative URLs via Next.js proxy
const isServer = typeof window === "undefined";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:7000";
const API_BASE_URL = isServer
  ? `${BACKEND_URL}/api/1`
  : (process.env.NEXT_PUBLIC_API_BASE || "/api/1");
const API_V2_BASE_URL = isServer
  ? `${BACKEND_URL}/api/2`
  : (process.env.NEXT_PUBLIC_API_V2_BASE || "/api/2");
// Relative API URL for authenticated requests (passes through Next.js proxy which forwards cookies)
const API_AUTH_URL = "/api/1";

// Helper: use relative URL for authenticated fetches, public URL for public fetches
function authFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_AUTH_URL}${path}`, {
    ...init,
    credentials: "include",
  });
}

/**
 * Translate `data.message` from an upload failure response so any consumer
 * surfaces a consistent PT-pt warning when the backend reports a security
 * rejection. Other error messages pass through unchanged.
 */
function translateUploadErrorPayload(
  data: Record<string, unknown>,
): Record<string, unknown> {
  if (typeof data?.message !== "string") return data;
  return { ...data, message: translateUploadError(data.message) };
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

/**
 * Fetch datasets with authentication (for admin pages).
 * Sends cookies so the backend recognizes the sysadmin and returns all datasets
 * (including private, archived, deleted).
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

export async function fetchOrgDiscussions(
  orgId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<Discussion>> {
  try {
    const params = new URLSearchParams({
      org: orgId,
      page: String(page),
      page_size: String(pageSize),
    });
    const res = await fetch(`${API_BASE_URL}/discussions/?${params.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch org discussions: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching org discussions:", error);
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

export async function fetchDiscussions(
  subjectId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<Discussion>> {
  try {
    const params = new URLSearchParams({
      for: subjectId,
      page: String(page),
      page_size: String(pageSize),
    });
    const res = await fetch(`${API_BASE_URL}/discussions/?${params.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch discussions: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching discussions:", error);
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

// --- Dataset CRUD ---

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

// --- Resource CRUD ---

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
  const res = await fetch(
    `${API_AUTH_URL}/datasets/${datasetId}/resources/${resourceId}/`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    }
  );
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
  const res = await fetch(
    `${API_AUTH_URL}/datasets/${datasetId}/resources/${resourceId}/upload/`,
    {
      method: "POST",
      credentials: "include",
      body: formData,
    }
  );
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
  const res = await fetch(
    `${API_AUTH_URL}/datasets/${datasetId}/resources/${resourceId}/`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );
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

// --- Dataset Featured Toggle ---

export async function toggleDatasetFeatured(id: string, featured: boolean): Promise<Dataset> {
  const res = await fetch(`${API_AUTH_URL}/datasets/${id}/featured/`, {
    method: featured ? "POST" : "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to toggle dataset featured: ${res.statusText}`);
  return await res.json();
}

// --- Activity ---

export async function fetchActivity(
  relatedTo: string,
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<Activity>> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/activity/?related_to=${relatedTo}&sort=-created_at&page=${page}&page_size=${pageSize}`,
      { cache: "no-store", credentials: "include" }
    );
    if (!res.ok) throw new Error(`Failed to fetch activity: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching activity:", error);
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

export async function fetchAllowedExtensions(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/datasets/extensions/`, { next: { revalidate: 3600 } });
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

// --- Topics (API v2) ---

export async function fetchTopics(
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<Topic>> {
  try {
    const res = await fetch(
      `${API_V2_BASE_URL}/topics/?page=${page}&page_size=${pageSize}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch topics: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching topics:", error);
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

export async function createDiscussion(
  payload: DiscussionCreatePayload
): Promise<Discussion | null> {
  try {
    const res = await fetch(`${API_AUTH_URL}/discussions/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      throw new Error("Authentication required to create a discussion");
    }

    if (!res.ok) {
      throw new Error(`Failed to create discussion: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error creating discussion:", error);
    return null;
  }
}

export async function fetchTopic(slugOrId: string): Promise<Topic | null> {
  try {
    const res = await fetch(`${API_V2_BASE_URL}/topics/${slugOrId}/`, {
      cache: "no-store",
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch topic: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching topic:", error);
    return null;
  }
}

export async function replyToDiscussion(
  discussionId: string,
  comment: string,
  options?: { organization?: string, close?: boolean }
): Promise<Discussion | null> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/discussions/${discussionId}/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ comment, organization: options?.organization }),
      }
    );

    if (res.status === 401) {
      throw new Error("Authentication required to reply to a discussion");
    }

    if (!res.ok) {
      throw new Error(`Failed to reply to discussion: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error replying to discussion:", error);
    return null;
  }
}

export async function fetchTopicElements(
  topicId: string,
  page: number = 1,
  pageSize: number = 50
): Promise<APIResponse<TopicElement>> {
  try {
    const res = await fetch(
      `${API_V2_BASE_URL}/topics/${topicId}/elements/?page=${page}&page_size=${pageSize}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch topic elements: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching topic elements:", error);
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

export async function createTopic(
  payload: TopicCreatePayload
): Promise<Topic | null> {
  try {
    const res = await fetch(`${API_V2_BASE_URL}/topics/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      throw new Error("Authentication required to create a topic");
    }

    if (!res.ok) {
      throw new Error(`Failed to create topic: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error creating topic:", error);
    return null;
  }
}

export async function updateTopic(
  id: string,
  payload: TopicUpdatePayload
): Promise<Topic | null> {
  try {
    const res = await fetch(`${API_V2_BASE_URL}/topics/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      throw new Error("Authentication required to update a topic");
    }

    if (!res.ok) {
      throw new Error(`Failed to update topic: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error updating topic:", error);
    return null;
  }
}

export async function deleteTopic(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_V2_BASE_URL}/topics/${id}/`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.status === 401) {
      throw new Error("Authentication required to delete a topic");
    }

    if (!res.ok) {
      throw new Error(`Failed to delete topic: ${res.statusText}`);
    }

    return true;
  } catch (error) {
    console.error("Error deleting topic:", error);
    return false;
  }
}

export async function addTopicElement(
  topicId: string,
  payload: TopicElementCreatePayload
): Promise<TopicElement | null> {
  try {
    const res = await fetch(`${API_V2_BASE_URL}/topics/${topicId}/elements/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      throw new Error("Authentication required to add a topic element");
    }

    if (!res.ok) {
      throw new Error(`Failed to add topic element: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error adding topic element:", error);
    return null;
  }
}

export async function removeTopicElement(
  topicId: string,
  elementId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_V2_BASE_URL}/topics/${topicId}/elements/${elementId}/`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (res.status === 401) {
      throw new Error("Authentication required to remove a topic element");
    }

    if (!res.ok) {
      throw new Error(`Failed to remove topic element: ${res.statusText}`);
    }

    return true;
  } catch (error) {
    console.error("Error removing topic element:", error);
    return false;
  }
}

export async function updateTopicElements(
  topicId: string,
  elements: TopicElementCreatePayload[]
): Promise<TopicElement[] | null> {
  try {
    const res = await fetch(`${API_V2_BASE_URL}/topics/${topicId}/elements/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(elements),
    });

    if (res.status === 401) {
      throw new Error("Authentication required to update topic elements");
    }

    if (!res.ok) {
      throw new Error(`Failed to update topic elements: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error updating topic elements:", error);
    return null;
  }
}

export async function closeDiscussion(
  discussionId: string,
  comment?: string
): Promise<Discussion | null> {
  try {
    const body: Record<string, unknown> = { close: true };
    if (comment) body.comment = comment;

    const res = await fetch(
      `${API_AUTH_URL}/discussions/${discussionId}/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      }
    );

    if (res.status === 401) {
      throw new Error("Authentication required to close a discussion");
    }

    if (!res.ok) {
      throw new Error(`Failed to close discussion: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error closing discussion:", error);
    return null;
  }
}

export async function deleteDiscussion(
  discussionId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/discussions/${discussionId}/`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (res.status === 401) {
      throw new Error("Authentication required to delete a discussion");
    }

    if (!res.ok) {
      throw new Error(`Failed to delete discussion: ${res.statusText}`);
    }

    return true;
  } catch (error) {
    console.error("Error deleting discussion:", error);
    return false;
  }
}

export async function updateDiscussion(
  discussionId: string,
  title: string
): Promise<Discussion | null> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/discussions/${discussionId}/`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title }),
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to update discussion: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error updating discussion:", error);
    return null;
  }
}

export async function editDiscussionComment(
  discussionId: string,
  commentIndex: number,
  comment: string
): Promise<Discussion | null> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/discussions/${discussionId}/comments/${commentIndex}/`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ comment }),
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to edit comment: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error editing comment:", error);
    return null;
  }
}

export async function deleteDiscussionComment(
  discussionId: string,
  commentIndex: number
): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/discussions/${discussionId}/comments/${commentIndex}/`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to delete comment: ${res.statusText}`);
    }

    return true;
  } catch (error) {
    console.error("Error deleting comment:", error);
    return false;
  }
}

// --- Spatial / Geographic ---

export async function fetchSpatialZones(ids: string[]): Promise<object> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/spatial/zones/${ids.join(",")}/`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Failed to fetch spatial zones: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching spatial zones:", error);
    return { type: "FeatureCollection", features: [] };
  }
}

export async function fetchSpatialZonesByIds(ids: string[]): Promise<SpatialZone[]> {
  if (!ids.length) return [];
  try {
    const res = await fetch(
      `${API_BASE_URL}/spatial/zones/${ids.join(",")}/`,
      { cache: "no-store" }
    );
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
      // Some backends include a level reference; keep it flexible (could be id or object)
      level: f.properties.level ?? "",
    })) as SpatialZone[];
  } catch (error) {
    console.error("Error fetching spatial zones by ids:", error);
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

export async function fetchGeoLevels(): Promise<GeoLevel[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/spatial/levels/`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch geo levels: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching geo levels:", error);
    return [];
  }
}

// --- Reports ---

export async function fetchReportReasons(): Promise<ReportReason[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/reports/reasons/`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch report reasons: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching report reasons:", error);
    return [];
  }
}

export async function createReport(payload: ReportCreatePayload): Promise<Report> {
  const res = await fetch(`${API_AUTH_URL}/reports/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Failed to create report: ${res.statusText}`);
  }

  return await res.json();
}

export async function fetchReports(
  page: number = 1,
  status?: string,
  sort?: string,
  pageSize: number = 20
): Promise<APIResponse<Report>> {
  try {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });
    if (status) params.set("status", status);
    if (sort) params.set("sort", sort);

    const res = await fetch(`${API_AUTH_URL}/reports/?${params.toString()}`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Failed to fetch reports: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching reports:", error);
    return { data: [], page, page_size: pageSize, total: 0, next_page: null, previous_page: null };
  }
}

export async function dismissReport(id: string): Promise<Report> {
  const res = await fetch(`${API_AUTH_URL}/reports/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status: "handled" }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Failed to dismiss report: ${res.statusText}`);
  }

  return await res.json();
}

// --- CSV Export URL Builders ---

type OrgExportType = "datasets" | "dataservices" | "discussions" | "datasets-resources";
type SiteExportType =
  | "datasets"
  | "resources"
  | "organizations"
  | "reuses"
  | "dataservices"
  | "harvests"
  | "tags";

export function getOrgExportUrl(org: string, type: OrgExportType): string {
  return `${API_BASE_URL}/organizations/${org}/${type}.csv`;
}

export function getSiteExportUrl(type: SiteExportType): string {
  return `${API_BASE_URL}/site/${type}.csv`;
}

// --- Followers ---

export async function fetchFollowers(
  entityType: FollowableEntityType,
  id: string,
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<Follow>> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/${entityType}/${id}/followers/?page=${page}&page_size=${pageSize}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Failed to fetch followers: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching followers:", error);
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

export async function fetchUserFollowers(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<Follow>> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/users/${userId}/followers/?page=${page}&page_size=${pageSize}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Failed to fetch user followers: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching user followers:", error);
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

export async function fetchMyFollowing(
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<UserFollowing>> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/me/following/?page=${page}&page_size=${pageSize}`,
      { cache: "no-store", credentials: "include" }
    );
    if (!res.ok) throw new Error(`Failed to fetch following: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching following:", error);
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

export async function fetchUserFollowing(
  userId: string,
  page: number = 1,
  pageSize: number = 100
): Promise<APIResponse<UserFollowing>> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/users/${userId}/following/?page=${page}&page_size=${pageSize}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Failed to fetch user following: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching user following:", error);
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

export async function followEntity(
  entityType: FollowableEntityType,
  id: string
): Promise<FollowResponse> {
  const res = await fetch(`${API_AUTH_URL}/${entityType}/${id}/followers/`, {
    method: "POST",
    credentials: "include",
  });

  if (res.status === 401) {
    throw new Error("Authentication required to follow");
  }

  if (!res.ok) {
    throw new Error(`Failed to follow: ${res.statusText}`);
  }

  return await res.json();
}

export async function unfollowEntity(
  entityType: FollowableEntityType,
  id: string
): Promise<FollowResponse> {
  const res = await fetch(`${API_AUTH_URL}/${entityType}/${id}/followers/`, {
    method: "DELETE",
    credentials: "include",
  });

  if (res.status === 401) {
    throw new Error("Authentication required to unfollow");
  }

  if (!res.ok) {
    throw new Error(`Failed to unfollow: ${res.statusText}`);
  }

  return await res.json();
}

export async function isFollowing(
  entityType: FollowableEntityType,
  id: string,
  userId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/${entityType}/${id}/followers/?user=${userId}&page_size=1`,
      { cache: "no-store", credentials: "include" }
    );
    if (!res.ok) return false;
    const data = await res.json();
    return data.total > 0;
  } catch {
    return false;
  }
}

// â”€â”€ User Profile & Metrics (TICKET-30) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// â”€â”€ Community Resources CRUD (TICKET-31) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ Harvesters CRUD (TICKET-32) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function fetchHarvesters(
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<HarvestSource>> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/harvest/sources/?page=${page}&page_size=${pageSize}`,
      { cache: "no-store", credentials: "include" }
    );
    if (!res.ok) throw new Error(`Failed to fetch harvesters: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching harvesters:", error);
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

export async function fetchHarvester(id: string): Promise<HarvestSource | null> {
  try {
    const res = await fetch(`${API_AUTH_URL}/harvest/source/${id}/`, {
      cache: "no-store",
      credentials: "include",
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch harvester: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching harvester:", error);
    return null;
  }
}

export async function createHarvester(
  payload: HarvestSourceCreatePayload
): Promise<HarvestSource> {
  const res = await fetch(`${API_AUTH_URL}/harvest/sources/`, {
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

export async function updateHarvester(
  id: string,
  payload: HarvestSourceUpdatePayload
): Promise<HarvestSource> {
  const res = await fetch(`${API_AUTH_URL}/harvest/source/${id}/`, {
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

export async function deleteHarvester(id: string): Promise<void> {
  const res = await fetch(`${API_AUTH_URL}/harvest/source/${id}/`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to delete harvester: ${res.statusText}`);
}

export async function scheduleHarvester(id: string, cron: string): Promise<HarvestSource> {
  const res = await fetch(`${API_AUTH_URL}/harvest/source/${id}/schedule/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(cron),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, data: error };
  }
  return await res.json();
}

export async function unscheduleHarvester(id: string): Promise<void> {
  const res = await fetch(`${API_AUTH_URL}/harvest/source/${id}/schedule/`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, data: error };
  }
}

export async function triggerHarvest(id: string): Promise<HarvestJob> {
  const res = await fetch(`${API_AUTH_URL}/harvest/source/${id}/jobs/`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, data: error };
  }
  return await res.json();
}

export async function fetchHarvestJobs(
  sourceId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<HarvestJob>> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/harvest/source/${sourceId}/jobs/?page=${page}&page_size=${pageSize}`,
      { cache: "no-store", credentials: "include" }
    );
    if (!res.ok) throw new Error(`Failed to fetch harvest jobs: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching harvest jobs:", error);
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

export async function fetchHarvestJob(
  jobId: string
): Promise<HarvestJob | null> {
  try {
    const res = await fetch(`${API_AUTH_URL}/harvest/job/${jobId}/`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Failed to fetch harvest job: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching harvest job:", error);
    return null;
  }
}

export async function validateHarvestSource(
  id: string,
  comment?: string
): Promise<HarvestSource> {
  const payload: HarvestValidationPayload = { state: "accepted" };
  if (comment) payload.comment = comment;

  const res = await fetch(`${API_AUTH_URL}/harvest/source/${id}/validate/`, {
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

export async function rejectHarvestSource(
  id: string,
  comment: string
): Promise<HarvestSource> {
  const payload: HarvestValidationPayload = { state: "refused", comment };

  const res = await fetch(`${API_AUTH_URL}/harvest/source/${id}/validate/`, {
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

export async function previewHarvestSource(
  payload: HarvestSourceCreatePayload
): Promise<HarvestPreviewJob> {
  const res = await fetch(`${API_AUTH_URL}/harvest/source/preview/`, {
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

export async function fetchHarvestBackends(): Promise<HarvestBackend[]> {
  try {
    const res = await fetch(`${API_AUTH_URL}/harvest/backends/`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Failed to fetch harvest backends: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching harvest backends:", error);
    return [];
  }
}

export async function fetchOrgHarvesters(
  org: string,
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<HarvestSource>> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/harvest/sources/?owner=${org}&page=${page}&page_size=${pageSize}`,
      { cache: "no-store", credentials: "include" }
    );
    if (!res.ok)
      throw new Error(`Failed to fetch org harvesters: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching org harvesters:", error);
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


// â”€â”€â”€ Editorial / Home Featured Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function requestTransfer(payload: TransferRequestPayload): Promise<Transfer> {
  const res = await fetch(`${API_AUTH_URL}/transfer/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = data?.message
        ? data.message
        : data?.errors
          ? JSON.stringify(data.errors)
          : "";
    } catch {
      // ignore â€” keep generic message
    }
    throw new Error(detail || `Failed to request transfer: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Check if a URL is publicly reachable. Returns true if reachable, false if not.
 * If the backend check itself fails (network error, timeout), defaults to true
 * so that a backend outage doesn't block form submissions.
 */
export async function checkUrlReachable(url: string): Promise<boolean> {
  try {
    const res = await authFetch(`/site/check_url/?url=${encodeURIComponent(url)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return true;
    const data = await res.json();
    return data.reachable !== false;
  } catch {
    return true;
  }
}
