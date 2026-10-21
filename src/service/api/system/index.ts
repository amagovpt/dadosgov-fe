import type { Dataset } from "@/service/types/dataset";
import type { ScheduledJob } from "@/service/types/scheduled-jobs";
import type { MigrationsAudit } from "@/service/types/migrations-audit";
import type { HomepageData } from "@/service/types/home";
import type { Reuse } from "@/service/types/reuse";
import type { APIResponse } from "@/service/types/shared";
import type { SiteConfigUpdatePayload, SiteInfo } from "@/service/types/shared";
import type { SystemLogContent, SystemLogFile } from "@/service/types/transfer-system";
import { API_AUTH_URL, API_BASE_URL, authFetch } from "@/service/utils/API";
import { rethrowControlFlow } from "@/service/utils/rethrowControlFlow";


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
    rethrowControlFlow(error);
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
    rethrowControlFlow(error);
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
    rethrowControlFlow(error);
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
    rethrowControlFlow(error);
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
    // Short ISR window so editorial changes (LEDG-1860) are visible within
    // ~10s instead of up to 60s. The backend still caches /reuses/ heavily,
    // so this only adds at most one extra upstream call every 10s.
    const res = await fetch(`${API_BASE_URL}/reuses/?sort=-created&page_size=${pageSize}`, {
      next: { revalidate: 10 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch latest reuses: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
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
    // Short ISR window so featured datasets/reuses changes set via
    // /admin/system/editorial surface on the homepage within ~10s.
    // The backend already caches /site/home/ for 300s and invalidates that
    // cache on PUT, so the extra upstream load from a shorter window is
    // bounded to one call per 10s (LEDG-1860).
    const res = await fetch(`${API_BASE_URL}/site/home/`, {
      next: { revalidate: 10 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch homepage data: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error fetching homepage data:", error);
    return {
      site_metrics: { datasets: 0, organizations: 0, reuses: 0, users: 0 },
      latest_datasets: [],
      latest_reuses: [],
      latest_posts: [],
    };
  }
}

type SiteExportType =
  | "datasets"
  | "resources"
  | "organizations"
  | "reuses"
  | "dataservices"
  | "harvests"
  | "tags";


export function getSiteExportUrl(type: SiteExportType): string {
  return `${API_BASE_URL}/site/${type}.csv`;
}


// ─── Editorial / Home Featured Content ────────────────────────────────

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
    rethrowControlFlow(error);
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
    rethrowControlFlow(error);
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
  recaptchaToken?: string | null;
}): Promise<void> {
  const { recaptchaToken, ...rest } = payload;
  const res = await fetch(`${API_BASE_URL}/site/contact/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...rest, recaptcha_token: recaptchaToken ?? undefined }),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = data?.message || data?.errors ? JSON.stringify(data.errors || data.message) : "";
    } catch {
      // ignore — keep generic message
    }
    throw new Error(detail || `Failed to submit support form: ${res.statusText}`);
  }
}


/**
 * Fetch the list of available host log files (admin only).
 */
export async function fetchSystemLogs(): Promise<SystemLogFile[]> {
  try {
    const res = await authFetch("/site/logs/", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to fetch logs: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error fetching system logs:", error);
    return [];
  }
}


/**
 * Fetch the content of a single host log file (admin only). Backend tails to ~1MB.
 */
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
    rethrowControlFlow(error);
    console.error("Error fetching system log content:", error);
    return null;
  }
}


/**
 * Check if a URL is publicly reachable. Returns true if reachable, false if not.
 * If the backend check itself fails (network error, timeout), defaults to true
 * so that a backend outage doesn't block form submissions.
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
  } catch (error) {
    rethrowControlFlow(error);
    return true;
  }
}

/**
 * The portal's Celery Beat schedule, for the read-only jobs page (LEDG-2614).
 *
 * 🚩 RETURNS null ON FAILURE, never an empty array, and that is the whole
 * point of it. Its siblings above degrade to `[]`, which leaves the caller
 * unable to tell "the backend is down" from "nothing is scheduled" -- a
 * distinction that matters nowhere more than on a page whose job is to say
 * what is running. `rethrowControlFlow`'s own docstring names this confusion.
 *
 * An empty array is a real answer: a portal with no scheduled jobs.
 */
export async function fetchScheduledJobs(): Promise<ScheduledJob[] | null> {
  try {
    // Served at /api/1/workers/jobs/ -- the namespace is declared with
    // path="", which is falsy, so flask-restx falls back to "/" + its name.
    const res = await authFetch("/workers/jobs/", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to fetch scheduled jobs: ${res.statusText}`);
    }
    // marshal_list_with: a bare array, not the paginated envelope.
    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error fetching scheduled jobs:", error);
    return null;
  }
}

/**
 * Every task name the portal has registered, scheduled or not.
 *
 * Subtracting the scheduled jobs' tasks from this leaves the ones that never
 * run -- the purges, the inactive-account chores -- which is the question the
 * jobs page exists to answer and that today needs a trip to the machine.
 *
 * Null on failure like its sibling, so the page can drop the section rather
 * than claim every registered task is scheduled.
 */
export async function fetchSchedulableJobs(): Promise<string[] | null> {
  try {
    const res = await authFetch("/workers/jobs/schedulables/", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to fetch schedulable jobs: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error fetching schedulable jobs:", error);
    return null;
  }
}

/**
 * The database migration audit, for the read-only page (LEDG-2655).
 *
 * 🚩 null ON FAILURE, never an empty envelope. A portal with no migrations is
 * a valid answer -- `{ total: 0, migrations: [] }` -- and it must stay
 * distinguishable from the backend being unreachable, on a page whose entire
 * job is to report the state of the schema. Saying "no migrations" to somebody
 * checking after a dump restore would be the worst possible lie.
 */
export async function fetchMigrationsAudit(): Promise<MigrationsAudit | null> {
  try {
    const res = await authFetch("/site/migrations/", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to fetch migrations audit: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error fetching migrations audit:", error);
    return null;
  }
}
