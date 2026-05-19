import { APIResponse, Reuse } from "@/types/api";
import { authFetch } from "@/service/utils/API";

/**
 * Fetch the authenticated user's reuses (paginated)
 */
export async function fetchMyReuses(
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<Reuse>> {
  try {
    const res = await authFetch("/me/reuses/", { cache: "no-store" });

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
