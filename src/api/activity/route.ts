import { Activity, APIResponse } from "@/types/api";
import { getAuthApiBaseUrl } from "@/service/utils/API";

const API_AUTH_URL = getAuthApiBaseUrl();

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
