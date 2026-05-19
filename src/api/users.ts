import { UserPublic } from "@/types/api";
import { getApiBaseUrl } from "@/service/utils/API";

/**
 * Fetch the public profile of any user by ID or slug.
 */
export async function fetchUserProfile(userId: string): Promise<UserPublic | null> {
  try {
    const res = await fetch(`${getApiBaseUrl(1)}/users/${userId}/`, {
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
