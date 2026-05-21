import {
  APIResponse,
  Follow,
  FollowableEntityType,
  FollowResponse,
  UserFollowing,
} from "@/service/types/api";
import { getApiBaseUrl, getAuthApiBaseUrl } from "@/service/utils/API";

const API_BASE_URL = getApiBaseUrl(1);
const API_AUTH_URL = getAuthApiBaseUrl();

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
