import { API_V2_BASE_URL } from "@/service/utils/API";
import type { APIResponse } from "@/service/types/shared";
import type { Resource } from "@/service/types/dataset";
import {
  RESOURCE_PAGE_SIZE,
  type DatasetDetail,
  type DatasetV2,
  type ResourceSectionType,
} from "@/service/types/dataset/detail";

export async function fetchDatasetDetail(
  slug: string,
  forwarded?: Record<string, string>
): Promise<DatasetDetail> {
  const response = await fetch(`${API_V2_BASE_URL}/datasets/${encodeURIComponent(slug)}/`, {
    cache: "no-store",
    credentials: "include",
    headers: { ...forwarded, "X-Get-Datasets-Full-Objects": "true" },
  });
  if (!response.ok) throw new Error(`Failed to fetch dataset: ${response.status}`);
  const dataset: DatasetV2 = await response.json();
  const license = typeof dataset.license === "object" ? dataset.license : null;
  const spatial = dataset.spatial;
  return {
    ...dataset,
    license: license?.id ?? (typeof dataset.license === "string" ? dataset.license : null),
    license_title: license?.title ?? null,
    license_url: license?.url ?? null,
    frequency: typeof dataset.frequency === "string" ? dataset.frequency : dataset.frequency.id,
    spatial: spatial
      ? {
          ...spatial,
          zones: spatial.zones.map((zone) => (typeof zone === "string" ? zone : zone.id)),
          granularity:
            typeof spatial.granularity === "string"
              ? spatial.granularity
              : (spatial.granularity?.id ?? null),
        }
      : spatial,
  };
}

export async function fetchDatasetResources(
  datasetId: string,
  { type, q = "", page = 1 }: { type: ResourceSectionType; q?: string; page?: number },
  options?: { forwarded?: Record<string, string>; signal?: AbortSignal }
): Promise<APIResponse<Resource>> {
  const params = new URLSearchParams({
    type,
    page: String(page),
    page_size: String(RESOURCE_PAGE_SIZE),
  });
  if (q) params.set("q", q);
  const response = await fetch(
    `${API_V2_BASE_URL}/datasets/${encodeURIComponent(datasetId)}/resources/?${params}`,
    {
      cache: "no-store",
      credentials: "include",
      headers: options?.forwarded,
      signal: options?.signal,
    }
  );
  if (!response.ok) throw new Error(`Failed to fetch resources: ${response.status}`);
  return response.json();
}
