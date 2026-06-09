import type {
  HarvestBackend,
  HarvestJob,
  HarvestPreviewJob,
  HarvestSource,
  HarvestSourceCreatePayload,
  HarvestSourceUpdatePayload,
  HarvestValidationPayload,
} from "@/service/types/harvester";
import type { APIResponse } from "@/service/types/shared";
import { API_AUTH_URL } from "@/service/utils/API";


// ── Harvesters CRUD (TICKET-32) ──────────────────────────────────────

export async function fetchHarvesters(
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<HarvestSource>> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/harvest/sources/?page=${page}&page_size=${pageSize}`,
      { cache: "no-store", credentials: "include" }
    );
    if (!res.ok) throw new Error(`Failed to fetch harvesters: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching harvesters:", error);
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


export async function fetchHarvester(id: string): Promise<HarvestSource | null> {
  try {
    const res = await fetch(`${API_AUTH_URL}/harvest/source/${id}/`, {
      cache: "no-store",
      credentials: "include",
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch harvester: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching harvester:", error);
    return null;
  }
}


export async function createHarvester(
  payload: HarvestSourceCreatePayload
): Promise<HarvestSource> {
  const res = await fetch(`${API_AUTH_URL}/harvest/sources/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, data: error };
  }
  return await res.json();
}


export async function updateHarvester(
  id: string,
  payload: HarvestSourceUpdatePayload
): Promise<HarvestSource> {
  const res = await fetch(`${API_AUTH_URL}/harvest/source/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, data: error };
  }
  return await res.json();
}


export async function deleteHarvester(id: string): Promise<void> {
  const res = await fetch(`${API_AUTH_URL}/harvest/source/${id}/`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to delete harvester: ${res.statusText}`);
}


export async function scheduleHarvester(id: string, cron: string): Promise<HarvestSource> {
  const res = await fetch(`${API_AUTH_URL}/harvest/source/${id}/schedule/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(cron),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, data: error };
  }
  return await res.json();
}


export async function unscheduleHarvester(id: string): Promise<void> {
  const res = await fetch(`${API_AUTH_URL}/harvest/source/${id}/schedule/`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, data: error };
  }
}


export async function triggerHarvest(id: string): Promise<HarvestJob> {
  const res = await fetch(`${API_AUTH_URL}/harvest/source/${id}/jobs/`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, data: error };
  }
  return await res.json();
}


export async function fetchHarvestJobs(
  sourceId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<HarvestJob>> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/harvest/source/${sourceId}/jobs/?page=${page}&page_size=${pageSize}`,
      { cache: "no-store", credentials: "include" }
    );
    if (!res.ok) throw new Error(`Failed to fetch harvest jobs: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching harvest jobs:", error);
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


export async function fetchHarvestJob(
  jobId: string
): Promise<HarvestJob | null> {
  try {
    const res = await fetch(`${API_AUTH_URL}/harvest/job/${jobId}/`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Failed to fetch harvest job: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching harvest job:", error);
    return null;
  }
}


export async function validateHarvestSource(
  id: string,
  comment?: string
): Promise<HarvestSource> {
  const payload: HarvestValidationPayload = { state: "accepted" };
  if (comment) payload.comment = comment;

  const res = await fetch(`${API_AUTH_URL}/harvest/source/${id}/validate/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, data: error };
  }
  return await res.json();
}


export async function rejectHarvestSource(
  id: string,
  comment: string
): Promise<HarvestSource> {
  const payload: HarvestValidationPayload = { state: "refused", comment };

  const res = await fetch(`${API_AUTH_URL}/harvest/source/${id}/validate/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, data: error };
  }
  return await res.json();
}


export async function previewHarvestSource(
  payload: HarvestSourceCreatePayload
): Promise<HarvestPreviewJob> {
  const res = await fetch(`${API_AUTH_URL}/harvest/source/preview/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, data: error };
  }
  return await res.json();
}


export async function fetchHarvestBackends(): Promise<HarvestBackend[]> {
  try {
    const res = await fetch(`${API_AUTH_URL}/harvest/backends/`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Failed to fetch harvest backends: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching harvest backends:", error);
    return [];
  }
}


export async function fetchOrgHarvesters(
  org: string,
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<HarvestSource>> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/harvest/sources/?owner=${org}&page=${page}&page_size=${pageSize}`,
      { cache: "no-store", credentials: "include" }
    );
    if (!res.ok)
      throw new Error(`Failed to fetch org harvesters: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching org harvesters:", error);
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
