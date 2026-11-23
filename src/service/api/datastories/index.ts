import type { DatastoryMetrics } from "@/service/types/datastories";
import { API_BASE_URL } from "@/service/utils/API";
import { rethrowControlFlow } from "@/service/utils/rethrowControlFlow";


function datastoryPath(slug: string): string {
  return slug.split("/").map(encodeURIComponent).join("/");
}


export async function trackDatastoryView(slug: string): Promise<DatastoryMetrics | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/datastories/${datastoryPath(slug)}/views/`, {
      method: "POST",
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Failed to track datastory view: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error tracking datastory view:", error);
    return null;
  }
}

export async function fetchDatastoriesViews(
  slugs: string[]
): Promise<Record<string, number> | null> {
  if (slugs.length === 0) return {};
  try {
    const query = new URLSearchParams({ slugs: slugs.join(",") });
    const res = await fetch(`${API_BASE_URL}/datastories/?${query}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch datastories views: ${res.statusText}`);
    const body: { data: DatastoryMetrics[] } = await res.json();
    return Object.fromEntries(body.data.map((row) => [row.slug, row.metrics.views]));
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error fetching datastories views:", error);
    return null;
  }
}
