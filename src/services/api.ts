import {
  Activity,
  APIResponse,
  ContactPoint,
  ContactPointCreatePayload,
  Dataservice,
  DataserviceCreatePayload,
  DataserviceUpdatePayload,
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
  GlobalSearchSuggestion,
  License,
  MembershipRequest,
  Notification,
  OrgBadges,
  OrgRole,
  Organization,
  OrganizationCreatePayload,
  OrganizationFilters,
  OrganizationMember,
  OrganizationMetrics,
  OrganizationSuggestion,
  OrganizationUpdatePayload,
  Post,
  PostCreatePayload,
  PostUpdatePayload,
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
  SiteConfigUpdatePayload,
  SiteInfo,
  GeoLevel,
  Granularity,
  Report,
  ReportCreatePayload,
  ReportReason,
  SpatialZone,
  TagSuggestion,
  Topic,
  TopicCreatePayload,
  TopicElement,
  TopicElementCreatePayload,
  TopicUpdatePayload,
  UserMetrics,
  UserPublic,
  UserAdmin,
  UserAdminUpdatePayload,
  UserRef,
  UserRole,
  UserSuggestion,
  UserUpdatePayload,
  OrgInvitation,
  CommunityResource,
  CommunityResourceCreatePayload,
  CommunityResourceUpdatePayload,
  HarvestBackend,
  HarvestJob,
  HarvestPreviewJob,
  HarvestSource,
  HarvestSourceCreatePayload,
  HarvestSourceUpdatePayload,
  HomepageData,
} from "@/types/api";

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
 * Fetch CSRF token from backend
 */
export async function fetchCsrfToken(): Promise<string> {
  const res = await fetch("/csrf", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch CSRF token");
  const data = await res.json();
  return data.csrf_token;
}

/**
 * Perform login using the frontend route handler proxy
 */
export async function login(formData: FormData): Promise<{ message: string; redirect?: string }> {
  const res = await fetch("/login", {
    method: "POST",
    body: new URLSearchParams(formData as any),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Login failed");
  }
  return data;
}

/**
 * Perform logout
 */
export async function logout(): Promise<void> {
  const res = await fetch("/logout/", { method: "GET" });
  if (!res.ok) throw new Error("Logout failed");
}

/**
 * Fetch the currently authenticated user profile
 */
export async function fetchCurrentUser(): Promise<UserRef | null> {
  try {
    const res = await fetch("/me", { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
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

/**
 * Fetch datasets from the authenticated user's organizations.
 * Backend returns a flat array; we wrap it into APIResponse for consistency.
 */
export async function fetchMyOrgDatasets(
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<Dataset>> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/me/org_datasets/`,
      { cache: "no-store", credentials: "include" }
    );

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

/**
 * Fetch the public profile of any user by ID or slug
 */
export async function fetchUserProfile(userId: string): Promise<UserPublic | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/`, {
      cache: "no-store",
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch user profile: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
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

      const arrayParams: [string, string | string[] | undefined][] = [
        ["tag", filters.tag],
        ["license", filters.license],
        ["format", filters.format],
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
    const res = await fetch(url, { cache: "no-store" });

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

export async function fetchOrganizations(
  page: number = 1,
  pageSize: number = 20,
  filters?: OrganizationFilters
): Promise<APIResponse<Organization>> {
  try {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));

    if (filters) {
      if (filters.q) params.set("q", filters.q);
      if (filters.badge) params.set("badge", filters.badge);
      if (filters.sort) params.set("sort", filters.sort);
    }

    const url = `${API_BASE_URL}/organizations/?${params.toString()}`;
    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch organizations: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching organizations:", error);
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
export async function suggestOrganizations(
  query: string,
  size: number = 5
): Promise<OrganizationSuggestion[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/organizations/suggest/?q=${encodeURIComponent(query)}&size=${size}`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      throw new Error(`Failed to suggest organizations: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error suggesting organizations:", error);
    return [];
  }
}

export async function fetchOrgBadges(): Promise<OrgBadges> {
  try {
    const res = await fetch(`${API_BASE_URL}/organizations/badges/`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch org badges: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching org badges:", error);
    return {};
  }
}

export async function fetchOrganization(slugOrId: string): Promise<Organization | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/organizations/${slugOrId}/`, {
      cache: "no-store",
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch organization: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching organization:", error);
    throw error;
  }
}

export async function createOrganization(
  payload: OrganizationCreatePayload
): Promise<Organization> {
  const res = await fetch(`${API_AUTH_URL}/organizations/`, {
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

export async function updateOrganization(
  org: string,
  payload: OrganizationUpdatePayload
): Promise<Organization> {
  const res = await fetch(`${API_AUTH_URL}/organizations/${org}/`, {
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

export async function deleteOrganization(org: string): Promise<void> {
  const res = await fetch(`${API_AUTH_URL}/organizations/${org}/`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to delete organization: ${res.statusText}`);
}

export async function uploadOrgLogo(org: string, file: File): Promise<Organization> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_AUTH_URL}/organizations/${org}/logo`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, data: error };
  }
  return await res.json();
}

export async function fetchOrgDatasets(
  org: string,
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    q?: string;
    sort?: string;
    private?: boolean;
    archived?: boolean;
    deleted?: boolean;
  }
): Promise<APIResponse<Dataset>> {
  try {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      sort: filters?.sort || "-created",
    });
    if (filters?.q) params.set("q", filters.q);
    if (filters?.private !== undefined) params.set("private", String(filters.private));
    if (filters?.archived !== undefined) params.set("archived", String(filters.archived));
    if (filters?.deleted !== undefined) params.set("deleted", String(filters.deleted));

    const res = await fetch(
      `${API_AUTH_URL}/organizations/${org}/datasets/?${params.toString()}`,
      { cache: "no-store", credentials: "include" }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch organization datasets: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching organization datasets:", error);
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

export async function fetchOrgReuses(org: string): Promise<Reuse[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/organizations/${org}/reuses/`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch organization reuses: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching organization reuses:", error);
    return [];
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
      if (filters.tag) params.set("tag", filters.tag);
      if (filters.organization) params.set("organization", filters.organization);
      if (filters.owner) params.set("owner", filters.owner);
      if (filters.dataset) params.set("dataset", filters.dataset);
      if (filters.sort) params.set("sort", filters.sort);
    }

    const url = `${API_BASE_URL}/reuses/?${params.toString()}`;
    const res = await fetch(url, { cache: "no-store" });

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

export async function fetchSiteInfo(): Promise<SiteInfo> {
  try {
    const res = await fetch(`${API_BASE_URL}/site/`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch site info: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching site info:", error);
    return {
      id: "",
      title: "",
      metrics: { datasets: 0, organizations: 0, reuses: 0, users: 0 },
    };
  }
}

export async function updateSiteConfig(payload: SiteConfigUpdatePayload): Promise<SiteInfo> {
  const res = await fetch(`${API_AUTH_URL}/site/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Failed to update site config: ${res.statusText}`);
  }

  return await res.json();
}

export async function fetchFeaturedDatasets(pageSize: number = 3): Promise<APIResponse<Dataset>> {
  try {
    const res = await fetch(`${API_BASE_URL}/datasets/?featured=true&page_size=${pageSize}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch featured datasets: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching featured datasets:", error);
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

export async function fetchFeaturedReuses(pageSize: number = 3): Promise<APIResponse<Reuse>> {
  try {
    const res = await fetch(`${API_BASE_URL}/reuses/?featured=true&page_size=${pageSize}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch featured reuses: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching featured reuses:", error);
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

export async function fetchLatestDatasets(pageSize: number = 3): Promise<APIResponse<Dataset>> {
  try {
    const res = await fetch(`${API_BASE_URL}/datasets/?sort=-created&page_size=${pageSize}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch latest datasets: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching latest datasets:", error);
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

export async function fetchLatestReuses(pageSize: number = 3): Promise<APIResponse<Reuse>> {
  try {
    const res = await fetch(`${API_BASE_URL}/reuses/?sort=-created&page_size=${pageSize}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch latest reuses: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching latest reuses:", error);
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

export async function fetchPosts(
  page: number = 1,
  pageSize: number = 3,
  sort: string = "-published"
): Promise<APIResponse<Post>> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/posts/?page=${page}&page_size=${pageSize}&sort=${sort}`,
      {
        next: { revalidate: 120 },
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch posts: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching posts:", error);
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

export async function fetchHomepageData(): Promise<HomepageData> {
  try {
    const res = await fetch(`${API_BASE_URL}/site/home/`, {
      next: { revalidate: 10 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch homepage data: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching homepage data:", error);
    return {
      site_metrics: { datasets: 0, organizations: 0, reuses: 0, users: 0 },
      latest_datasets: [],
      latest_reuses: [],
      latest_posts: [],
    };
  }
}

export async function fetchPost(slugOrId: string): Promise<Post | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/posts/${slugOrId}/`, {
      cache: "no-store",
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch post: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

export async function createPost(
  payload: PostCreatePayload
): Promise<Post | null> {
  try {
    const res = await fetch(`${API_AUTH_URL}/posts/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      throw new Error("Authentication required to create a post");
    }

    if (!res.ok) {
      throw new Error(`Failed to create post: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error creating post:", error);
    return null;
  }
}

export async function updatePost(
  id: string,
  payload: PostUpdatePayload
): Promise<Post | null> {
  try {
    const res = await fetch(`${API_AUTH_URL}/posts/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      throw new Error("Authentication required to update a post");
    }

    if (!res.ok) {
      throw new Error(`Failed to update post: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error updating post:", error);
    return null;
  }
}

export async function deletePost(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_AUTH_URL}/posts/${id}/`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.status === 401) {
      throw new Error("Authentication required to delete a post");
    }

    if (!res.ok) {
      throw new Error(`Failed to delete post: ${res.statusText}`);
    }

    return true;
  } catch (error) {
    console.error("Error deleting post:", error);
    return false;
  }
}

export async function uploadPostImage(
  id: string,
  file: File
): Promise<Post | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_AUTH_URL}/posts/${id}/image/`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (res.status === 401) {
      throw new Error("Authentication required to upload a post image");
    }

    if (!res.ok) {
      throw new Error(`Failed to upload post image: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error uploading post image:", error);
    return null;
  }
}

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
    throw { status: res.status, data };
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
    throw { status: res.status, data };
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

// --- Account Migration ---

export async function fetchMigrationPending(): Promise<{
  pending: boolean;
  email?: string;
  has_email?: boolean;
  first_name?: string;
  last_name?: string;
}> {
  const res = await fetch("/saml/migration/pending", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch migration status");
  return await res.json();
}

export async function searchMigrationAccount(
  payload: { email?: string; first_name?: string; last_name?: string }
): Promise<{ found: boolean; email?: string }> {
  const res = await fetch("/saml/migration/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to search migration account");
  return await res.json();
}

export async function sendMigrationCode(): Promise<{ sent: boolean }> {
  const res = await fetch("/saml/migration/send-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to send migration code");
  }
  return await res.json();
}

export async function confirmMigration(
  payload: { method: "code"; code: string } | { method: "password"; password: string }
): Promise<{ success: boolean }> {
  const res = await fetch("/saml/migration/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to confirm migration");
  }
  return await res.json();
}

export async function skipMigration(): Promise<{ success: boolean }> {
  const res = await fetch("/saml/migration/skip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to skip migration");
  return await res.json();
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

// --- Notifications ---

export async function fetchNotifications(
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<Notification>> {
  const res = await fetch(
    `${API_AUTH_URL}/notifications/?page=${page}&page_size=${pageSize}`,
    { cache: "no-store", credentials: "include" }
  );

  if (res.status === 401) {
    throw new Error("Authentication required");
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch notifications: ${res.statusText}`);
  }

  return await res.json();
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
  options?: { organization?: string }
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
    const geojson = await res.json() as {
      features?: Array<{ id: string; properties: { name: string; code: string; uri?: string } }>;
    };
    return (geojson.features ?? []).map((f) => ({
      id: f.id,
      name: f.properties.name,
      code: f.properties.code,
      uri: f.properties.uri ?? "",
    }));
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

// --- Organization Membership ---

export async function requestMembership(org: string, comment?: string): Promise<MembershipRequest> {
  const res = await fetch(`${API_AUTH_URL}/organizations/${org}/membership/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ comment: comment || "" }),
  });
  if (!res.ok) throw new Error(`Failed to request membership: ${res.statusText}`);
  return await res.json();
}

export async function fetchMembershipRequests(org: string): Promise<MembershipRequest[]> {
  const res = await fetch(`${API_AUTH_URL}/organizations/${org}/membership/`, {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to fetch membership requests: ${res.statusText}`);
  return await res.json();
}

export async function acceptMembership(org: string, requestId: string): Promise<MembershipRequest> {
  const res = await fetch(
    `${API_AUTH_URL}/organizations/${org}/membership/${requestId}/accept/`,
    { method: "POST", credentials: "include" }
  );
  if (!res.ok) throw new Error(`Failed to accept membership: ${res.statusText}`);
  return await res.json();
}

export async function refuseMembership(
  org: string,
  requestId: string,
  comment?: string
): Promise<MembershipRequest> {
  const res = await fetch(
    `${API_AUTH_URL}/organizations/${org}/membership/${requestId}/refuse/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ comment: comment || "" }),
    }
  );
  if (!res.ok) throw new Error(`Failed to refuse membership: ${res.statusText}`);
  return await res.json();
}

export async function addMember(
  org: string,
  userId: string,
  role: string
): Promise<OrganizationMember> {
  const res = await fetch(`${API_AUTH_URL}/organizations/${org}/member/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ user: userId, role }),
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      const userError = body?.errors?.user;
      message = (Array.isArray(userError) ? userError[0] : userError)
        || body?.message
        || (typeof body?.errors === "string" ? body.errors : null)
        || message;
    } catch {}
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  return await res.json();
}

export async function updateMemberRole(
  org: string,
  userId: string,
  role: string
): Promise<OrganizationMember> {
  const res = await fetch(`${API_AUTH_URL}/organizations/${org}/member/${userId}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error(`Failed to update member role: ${res.statusText}`);
  return await res.json();
}

export async function removeMember(org: string, userId: string): Promise<void> {
  const res = await fetch(`${API_AUTH_URL}/organizations/${org}/member/${userId}/`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to remove member: ${res.statusText}`);
}

export async function fetchOrgRoles(): Promise<OrgRole[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/organizations/roles/`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch org roles: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching org roles:", error);
    return [];
  }
}

// --- Contact Points ---

export async function fetchOrgContactPoints(
  orgId: string,
  page: number = 1,
  pageSize: number = 100,
): Promise<APIResponse<ContactPoint>> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/organizations/${orgId}/contacts/?page=${page}&page_size=${pageSize}`,
      { cache: "no-store" },
    );
    if (!res.ok)
      throw new Error(`Failed to fetch org contact points: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching org contact points:", error);
    return {
      data: [], page: 1, page_size: pageSize,
      total: 0, next_page: null, previous_page: null,
    };
  }
}

export async function createContactPoint(
  payload: ContactPointCreatePayload,
): Promise<ContactPoint> {
  const res = await fetch(`${API_AUTH_URL}/contacts/`, {
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

// ── User Profile & Metrics (TICKET-30) ──────────────────────────────

export async function updateProfile(payload: UserUpdatePayload): Promise<UserPublic> {
  const res = await fetch(`${API_AUTH_URL}/me/`, {
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

export async function uploadAvatar(file: File): Promise<{ image: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_AUTH_URL}/me/avatar/`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, data: error };
  }
  return await res.json();
}

export async function uploadUserAvatar(userId: string, file: File): Promise<{ image: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_AUTH_URL}/users/${userId}/avatar/`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, data: error };
  }
  return await res.json();
}

export async function fetchFullProfile(): Promise<UserPublic> {
  const res = await fetch(`${API_AUTH_URL}/me/`, {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to fetch profile: ${res.statusText}`);
  return await res.json();
}

export async function generateApiKey(): Promise<string> {
  const res = await fetch(`${API_AUTH_URL}/me/apikey`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to generate API key: ${res.statusText}`);
  const data = await res.json();
  return data.apikey;
}

export async function clearApiKey(): Promise<void> {
  const res = await fetch(`${API_AUTH_URL}/me/apikey`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to clear API key: ${res.statusText}`);
}

export async function requestEmailChange(
  newEmail: string,
  csrfToken: string
): Promise<{ message: string }> {
  const body = new URLSearchParams({
    new_email: newEmail,
    new_email_confirm: newEmail,
    csrf_token: csrfToken,
  });
  const res = await fetch("/change-email", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to request email change");
  return data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  newPasswordConfirm: string,
  csrfToken: string
): Promise<{ message: string }> {
  const body = new URLSearchParams({
    password: currentPassword,
    new_password: newPassword,
    new_password_confirm: newPasswordConfirm,
    csrf_token: csrfToken,
  });
  const res = await fetch("/change", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to change password");
  return data;
}

export async function deleteAccount(): Promise<void> {
  const res = await fetch(`${API_AUTH_URL}/me/`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to delete account: ${res.statusText}`);
}

export async function fetchOrgInvitations(
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<OrgInvitation>> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/me/org_invitations/?page=${page}&page_size=${pageSize}`,
      { cache: "no-store", credentials: "include" }
    );
    if (!res.ok) throw new Error(`Failed to fetch org invitations: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching org invitations:", error);
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

export async function fetchMyMetrics(): Promise<UserMetrics> {
  const res = await fetch(`${API_AUTH_URL}/me/metrics/`, {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to fetch user metrics: ${res.statusText}`);
  return await res.json();
}

export async function fetchUserActivity(
  userId?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<Activity>> {
  try {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      sort: "-created_at",
    });
    if (userId) params.set("user", userId);
    const res = await fetch(`${API_AUTH_URL}/activity/?${params.toString()}`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Failed to fetch user activity: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching user activity:", error);
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

// --- User Management (Sysadmin) ---

export async function fetchUsers(
  page: number = 1,
  q?: string,
  sort?: string,
  pageSize: number = 20,
  role?: string
): Promise<APIResponse<UserAdmin>> {
  try {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));
    if (q) params.set("q", q);
    if (sort) params.set("sort", sort);
    if (role) params.set("role", role);

    const res = await fetch(`${API_AUTH_URL}/users/?${params.toString()}`, {
      cache: "no-store",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch users: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching users:", error);
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

export async function fetchUser(id: string): Promise<UserAdmin | null> {
  try {
    const res = await fetch(`${API_AUTH_URL}/users/${id}/`, {
      cache: "no-store",
      credentials: "include",
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch user: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export async function updateUser(
  id: string,
  payload: UserAdminUpdatePayload
): Promise<UserAdmin | null> {
  try {
    const res = await fetch(`${API_AUTH_URL}/users/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      throw new Error("Authentication required to update a user");
    }

    if (!res.ok) {
      throw new Error(`Failed to update user: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error updating user:", error);
    return null;
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_AUTH_URL}/users/${id}/`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.status === 401) {
      throw new Error("Authentication required to delete a user");
    }

    if (!res.ok) {
      throw new Error(`Failed to delete user: ${res.statusText}`);
    }

    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    return false;
  }
}

export async function fetchUserRoles(): Promise<UserRole[]> {
  try {
    const res = await fetch(`${API_AUTH_URL}/users/roles/`, {
      cache: "no-store",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch user roles: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching user roles:", error);
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

// ── Community Resources CRUD (TICKET-31) ─────────────────────────────

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
    throw { status: res.status, data: error };
  }
  return await res.json();
}

// ── Harvesters CRUD (TICKET-32) ──────────────────────────────────────

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
  const res = await fetch(`${API_AUTH_URL}/harvest/sources/${id}/jobs/`, {
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
  id: string
): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_AUTH_URL}/harvest/sources/${id}/validation/`, {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to validate harvest source: ${res.statusText}`);
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

export async function fetchOrgMetrics(
  org: string
): Promise<OrganizationMetrics> {
  try {
    const res = await fetch(`${API_BASE_URL}/organizations/${org}/`, {
      cache: "no-store",
    });
    if (!res.ok)
      throw new Error(`Failed to fetch org metrics: ${res.statusText}`);
    const data = await res.json();
    return data.metrics;
  } catch (error) {
    console.error("Error fetching org metrics:", error);
    return {
      datasets: 0,
      dataservices: 0,
      followers: 0,
      members: 0,
      reuses: 0,
      views: 0,
    };
  }
}

// ─── Editorial / Home Featured Content ────────────────────────────────

export async function fetchHomeFeaturedDatasets(): Promise<Dataset[]> {
  try {
    const res = await fetch(`${API_AUTH_URL}/site/home/datasets/`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!res.ok)
      throw new Error(`Failed to fetch home featured datasets: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching home featured datasets:", error);
    return [];
  }
}

export async function updateHomeFeaturedDatasets(
  datasetIds: string[]
): Promise<Dataset[]> {
  const res = await fetch(`${API_AUTH_URL}/site/home/datasets/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(datasetIds),
  });
  if (!res.ok)
    throw new Error(`Failed to update home featured datasets: ${res.statusText}`);
  return await res.json();
}

export async function fetchHomeFeaturedReuses(): Promise<Reuse[]> {
  try {
    const res = await fetch(`${API_AUTH_URL}/site/home/reuses/`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!res.ok)
      throw new Error(`Failed to fetch home featured reuses: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching home featured reuses:", error);
    return [];
  }
}

export async function updateHomeFeaturedReuses(
  reuseIds: string[]
): Promise<Reuse[]> {
  const res = await fetch(`${API_AUTH_URL}/site/home/reuses/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(reuseIds),
  });
  if (!res.ok)
    throw new Error(`Failed to update home featured reuses: ${res.statusText}`);
  return await res.json();
}
