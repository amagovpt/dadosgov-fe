import type { APIResponse } from "@/service/types/shared/core";

const DEFAULT_BATCH_SIZE = 200;

/**
 * Fetches every page of a listing and returns all items.
 * Throws if a page comes back empty before `total` is reached.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number, pageSize: number) => Promise<APIResponse<T>>,
  batchSize: number = DEFAULT_BATCH_SIZE
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;

  while (true) {
    const response = await fetchPage(page, batchSize);
    const data = response.data ?? [];
    items.push(...data);

    const total = response.total ?? items.length;
    if (items.length >= total || !response.next_page) return items;
    if (data.length === 0) {
      throw new Error(`Incomplete listing: got ${items.length} of ${total} items`);
    }
    page += 1;
  }
}
