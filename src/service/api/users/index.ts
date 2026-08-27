import type { Activity } from "@/service/types/catalog";
import type {
  UserAdmin,
  UserAdminUpdatePayload,
  UserPublic,
  UserRole,
  UserUpdatePayload,
} from "@/service/types/identity";
import type { APIResponse } from "@/service/types/shared";
import { API_AUTH_URL, API_BASE_URL, translateUploadErrorPayload } from "@/service/utils/API";
import { rethrowControlFlow } from "@/service/utils/rethrowControlFlow";


/**
 * Fetch the profile of any user by ID or slug.
 *
 * The `/users/<id>/` endpoint requires authentication (LEDG-2113 / VULN-2092),
 * so the request must carry the session cookie. Anonymous callers get a 401;
 * the profile page gates them to login before this runs.
 */
export async function fetchUserProfile(userId: string): Promise<UserPublic | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/`, {
      cache: "no-store",
      credentials: "include",
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch user profile: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error fetching user profile:", error);
    throw error;
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
    throw { status: res.status, data: translateUploadErrorPayload(error) };
  }
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
    rethrowControlFlow(error);
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
    rethrowControlFlow(error);
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
    rethrowControlFlow(error);
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
    rethrowControlFlow(error);
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
    rethrowControlFlow(error);
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
    rethrowControlFlow(error);
    console.error("Error fetching user roles:", error);
    return [];
  }
}
