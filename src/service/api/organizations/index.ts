import type { ContactPoint, ContactPointCreatePayload, Dataset } from "@/service/types/dataset";
import type {
  MembershipRequest,
  OrgBadges,
  OrgInvitation,
  OrgRole,
  Organization,
  OrganizationCreatePayload,
  OrganizationFilters,
  OrganizationMember,
  OrganizationMetrics,
  OrganizationSuggestion,
  OrganizationUpdatePayload,
} from "@/service/types/identity";
import type { Reuse } from "@/service/types/reuse";
import type { APIResponse } from "@/service/types/shared";
import { API_AUTH_URL, API_BASE_URL, translateUploadErrorPayload } from "@/service/utils/API";
import { cachedListingFetch } from "@/service/utils/listingCache";
import { rethrowControlFlow } from "@/service/utils/rethrowControlFlow";


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
      if (filters.sort) params.set("sort", filters.sort);

      const arrayParams: [string, string | string[] | undefined][] = [
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

    const url = `${API_BASE_URL}/organizations/?${params.toString()}`;
    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch organizations: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
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
    rethrowControlFlow(error);
    console.error("Error suggesting organizations:", error);
    return [];
  }
}


export async function fetchOrgBadges(): Promise<OrgBadges> {
  try {
    const res = await fetch(`${API_BASE_URL}/organizations/badges/`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`Failed to fetch org badges: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error fetching org badges:", error);
    return {};
  }
}


export async function fetchOrganization(
  slugOrId: string,
  forwarded?: Record<string, string>,
): Promise<Organization | null> {
  try {
    // `forwarded` carries the real client IP (X-Forwarded-For) when called from
    // a Server Component; without it this SSR fetch reaches the backend as the
    // Next.js server IP and collapses every visitor into one rate-limit bucket.
    const res = await fetch(`${API_BASE_URL}/organizations/${slugOrId}/`, {
      cache: "no-store",
      headers: forwarded,
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch organization: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
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


export async function uploadOrgLogo(
  org: string,
  file: File,
): Promise<{ success: boolean; image: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_AUTH_URL}/organizations/${org}/logo/`, {
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
  },
  publicView: boolean = false
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

    // On the public organization page we deliberately fetch anonymously
    // (credentials omitted) so the backend applies public visibility rules and
    // never exposes private/archived datasets to privileged viewers (members,
    // sysadmins) — matching the public /datasets listing and the org reuses tab.
    const res = await fetch(
      `${API_AUTH_URL}/organizations/${org}/datasets/?${params.toString()}`,
      publicView
        ? { cache: "no-store", credentials: "omit" }
        : { cache: "no-store", credentials: "include" }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch organization datasets: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
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
    rethrowControlFlow(error);
    console.error("Error fetching organization reuses:", error);
    return [];
  }
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
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body?.message || body?.error || message;
    } catch {}
    throw new Error(`[${res.status}] ${message}`);
  }
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
    rethrowControlFlow(error);
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
    rethrowControlFlow(error);
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


export function getOrgExportUrl(org: string, type: OrgExportType): string {
  return `${API_BASE_URL}/organizations/${org}/${type}.csv`;
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
    rethrowControlFlow(error);
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
    rethrowControlFlow(error);
    console.error("Error fetching org metrics:", error);
    return {
      datasets: 0,
      dataservices: 0,
      followers: 0,
      members: 0,
      reuses: 0,
      views: 0,
      resource_downloads: 0,
      reuse_views: 0,
      dataservice_views: 0,
    };
  }
}


export interface OrganizationsListingResponse {
  listing: APIResponse<Organization>;
  badges: OrgBadges;
  badge_counts: Record<string, number>;
  organizations: Organization[];
}


/**
 * Aggregated fetch for the /organizations listing page (LEDG-1836).
 * Replaces 3 + N (one per badge) parallel calls with 1.
 */
export async function fetchOrganizationsListing(
  page: number = 1,
  pageSize: number = 20,
  filters?: OrganizationFilters,
  forwarded?: Record<string, string>,
): Promise<OrganizationsListingResponse> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", String(pageSize));

  if (filters) {
    if (filters.q) params.set("q", filters.q);
    if (filters.sort) params.set("sort", filters.sort);

    const arrayParams: [string, string | string[] | undefined][] = [
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

  const url = `${API_BASE_URL}/site/organizations-listing/?${params.toString()}`;
  // SSR listing: cached per-URL for 60s in `listingCache` (matches the
  // backend @cache.cached(60)), shared across visitors — the Next.js Data
  // Cache keys on headers, so it would fragment per client IP. Repeated
  // page/query loads don't hit the backend PUBLIC_SEARCH_LIMIT bucket that
  // the F5 IP-collapse turns site-wide. On a cache-miss, `forwarded` relays
  // the real client IP so the backend keys the limiter per visitor instead
  // of the Next.js server IP.
  //
  // See fetchDatasetsListing: a failure propagates to `[locale]/error.tsx`
  // rather than degrading into an empty listing.
  return cachedListingFetch<OrganizationsListingResponse>(url, forwarded);
}
