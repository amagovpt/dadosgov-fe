import {
  TabularPage,
  TabularProfile,
  TabularSortDir,
} from "@/service/types/tabular";

/**
 * Client for the api-tabular preview proxies. The browser never talks to the
 * api-tabular host directly (internal-only, blocked by CSP) — requests go
 * through /internal-api/proxy-tabular-* on the Next.js server.
 */

interface FetchTabularPageOptions {
  page: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: TabularSortDir;
}

/**
 * Fetch one server-side page of a resource's tabular data.
 * Returns null on any failure (caller decides whether to fall back).
 */
export async function fetchTabularPage(
  rid: string,
  { page, pageSize = 5, sortBy, sortDir = "asc" }: FetchTabularPageOptions
): Promise<TabularPage | null> {
  try {
    const params = new URLSearchParams({
      rid,
      page: String(page),
      page_size: String(pageSize),
    });
    if (sortBy) {
      params.set("sort_by", sortBy);
      params.set("sort_dir", sortDir);
    }
    const res = await fetch(`/internal-api/proxy-tabular-data?${params.toString()}`);
    if (!res.ok) return null;
    const body: { data?: Record<string, unknown>[]; meta?: TabularPage["meta"] } =
      await res.json();
    if (!Array.isArray(body.data) || !body.meta) return null;
    const records = body.data.map((row) => {
      const rest = { ...row };
      delete rest.__id;
      return rest;
    });
    return { records, meta: body.meta };
  } catch (error) {
    console.error("Error fetching tabular data page:", error);
    return null;
  }
}

/**
 * Fetch the csv-detective profile (column names + types) of a resource.
 * Returns null on any failure.
 */
export async function fetchTabularProfile(rid: string): Promise<TabularProfile | null> {
  try {
    const res = await fetch(`/internal-api/proxy-tabular-profile?rid=${encodeURIComponent(rid)}`);
    if (!res.ok) return null;
    const body: { profile?: TabularProfile } = await res.json();
    return body.profile ?? null;
  } catch (error) {
    console.error("Error fetching tabular profile:", error);
    return null;
  }
}
