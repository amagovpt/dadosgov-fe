import type { GeoLevel } from "@/service/types/catalog";
import { API_BASE_URL } from "@/service/utils/API";
import { rethrowControlFlow } from "@/service/utils/rethrowControlFlow";


export async function fetchSpatialZones(ids: string[]): Promise<object> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/spatial/zones/${ids.join(",")}/`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Failed to fetch spatial zones: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error fetching spatial zones:", error);
    return { type: "FeatureCollection", features: [] };
  }
}


export async function fetchGeoLevels(): Promise<GeoLevel[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/spatial/levels/`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch geo levels: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error fetching geo levels:", error);
    return [];
  }
}
