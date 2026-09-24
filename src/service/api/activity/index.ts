import type { Activity } from "@/service/types/catalog";
import type { APIResponse } from "@/service/types/shared";
import { API_AUTH_URL } from "@/service/utils/API";
import { rethrowControlFlow } from "@/service/utils/rethrowControlFlow";


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
    rethrowControlFlow(error);
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
