import {
  APIResponse,
  Dataset,
  HomepageData,
  Reuse,
  SiteConfigUpdatePayload,
  SiteInfo,
  SystemLogContent,
  SystemLogFile,
} from "@/service/types/api";
import { authFetch, getApiBaseUrl, getAuthApiBaseUrl } from "@/service/utils/API";

const API_BASE_URL = getApiBaseUrl(1);
const API_AUTH_URL = getAuthApiBaseUrl();

export async function fetchSiteInfo(): Promise<SiteInfo> {
  try {
    const res = await fetch(`${API_BASE_URL}/site/`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch site info: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching site info:", error);
    return {
      id: "",
      title: "",
      metrics: { datasets: 0, organizations: 0, reuses: 0, users: 0 },
    };
  }
}

export async function updateSiteConfig(payload: SiteConfigUpdatePayload): Promise<SiteInfo> {
  const res = await fetch(`${API_AUTH_URL}/site/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Failed to update site config: ${res.statusText}`);
  }

  return await res.json();
}

export async function fetchFeaturedDatasets(pageSize: number = 3): Promise<APIResponse<Dataset>> {
  try {
    const res = await fetch(`${API_BASE_URL}/datasets/?featured=true&page_size=${pageSize}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch featured datasets: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching featured datasets:", error);
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

export async function fetchFeaturedReuses(pageSize: number = 3): Promise<APIResponse<Reuse>> {
  try {
    const res = await fetch(`${API_BASE_URL}/reuses/?featured=true&page_size=${pageSize}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch featured reuses: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching featured reuses:", error);
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

export async function fetchLatestDatasets(pageSize: number = 3): Promise<APIResponse<Dataset>> {
  try {
    const res = await fetch(`${API_BASE_URL}/datasets/?sort=-created&page_size=${pageSize}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch latest datasets: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching latest datasets:", error);
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

export async function fetchLatestReuses(pageSize: number = 3): Promise<APIResponse<Reuse>> {
  try {
    const res = await fetch(`${API_BASE_URL}/reuses/?sort=-created&page_size=${pageSize}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch latest reuses: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching latest reuses:", error);
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

export async function fetchHomepageData(): Promise<HomepageData> {
  try {
    const res = await fetch(`${API_BASE_URL}/site/home/`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch homepage data: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching homepage data:", error);
    return {
      site_metrics: { datasets: 0, organizations: 0, reuses: 0, users: 0 },
      latest_datasets: [],
      latest_reuses: [],
      latest_posts: [],
    };
  }
}

export async function fetchHomeFeaturedDatasets(): Promise<Dataset[]> {
  try {
    const res = await fetch(`${API_AUTH_URL}/site/home/datasets/`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!res.ok)
      throw new Error(`Failed to fetch home featured datasets: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching home featured datasets:", error);
    return [];
  }
}

export async function updateHomeFeaturedDatasets(
  datasetIds: string[]
): Promise<Dataset[]> {
  const res = await fetch(`${API_AUTH_URL}/site/home/datasets/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(datasetIds),
  });
  if (!res.ok)
    throw new Error(`Failed to update home featured datasets: ${res.statusText}`);
  return await res.json();
}

export async function fetchHomeFeaturedReuses(): Promise<Reuse[]> {
  try {
    const res = await fetch(`${API_AUTH_URL}/site/home/reuses/`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!res.ok)
      throw new Error(`Failed to fetch home featured reuses: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching home featured reuses:", error);
    return [];
  }
}

export async function updateHomeFeaturedReuses(
  reuseIds: string[]
): Promise<Reuse[]> {
  const res = await fetch(`${API_AUTH_URL}/site/home/reuses/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(reuseIds),
  });
  if (!res.ok)
    throw new Error(`Failed to update home featured reuses: ${res.statusText}`);
  return await res.json();
}

export type SupportTopic = "question" | "bug" | "feedback";

export async function submitSupportContact(payload: {
  topic: SupportTopic;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/site/contact/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = data?.message || data?.errors ? JSON.stringify(data.errors || data.message) : "";
    } catch {
      // Keep generic message if no JSON body.
    }
    throw new Error(detail || `Failed to submit support form: ${res.statusText}`);
  }
}

export async function fetchSystemLogs(): Promise<SystemLogFile[]> {
  try {
    const res = await authFetch("/site/logs/", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to fetch logs: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching system logs:", error);
    return [];
  }
}

export async function fetchSystemLogContent(
  filename: string
): Promise<SystemLogContent | null> {
  try {
    const res = await authFetch(`/site/logs/${encodeURIComponent(filename)}/`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch log content: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching system log content:", error);
    return null;
  }
}

/**
 * Check if URL is publicly reachable.
 * If backend check fails, return true to avoid blocking submissions on outages.
 */
export async function checkUrlReachable(url: string): Promise<boolean> {
  try {
    const res = await authFetch(`/site/check_url/?url=${encodeURIComponent(url)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return true;
    const data = await res.json();
    return data.reachable !== false;
  } catch {
    return true;
  }
}
