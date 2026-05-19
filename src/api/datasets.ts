import { APIResponse, Dataset } from "@/types/api";
import { authFetch } from "@/service/utils/API";

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
 * Fetch datasets from the authenticated user's organizations.
 * Backend returns a flat array; we wrap it into APIResponse for consistency.
 */
export async function fetchMyOrgDatasets(
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<Dataset>> {
  try {
    const res = await authFetch("/me/org_datasets/", { cache: "no-store" });

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
