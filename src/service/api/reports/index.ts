import type {
  Report,
  ReportCreatePayload,
  ReportReason,
} from "@/service/types/notifications-reporting";
import type { APIResponse } from "@/service/types/shared";
import { API_AUTH_URL, API_BASE_URL } from "@/service/utils/API";
import { rethrowControlFlow } from "@/service/utils/rethrowControlFlow";


// --- Reports ---

export async function fetchReportReasons(): Promise<ReportReason[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/reports/reasons/`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch report reasons: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error fetching report reasons:", error);
    return [];
  }
}


export async function createReport(payload: ReportCreatePayload): Promise<Report> {
  const res = await fetch(`${API_AUTH_URL}/reports/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Failed to create report: ${res.statusText}`);
  }

  return await res.json();
}


export async function fetchReports(
  page: number = 1,
  status?: string,
  sort?: string,
  pageSize: number = 20
): Promise<APIResponse<Report>> {
  try {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });
    if (status) params.set("status", status);
    if (sort) params.set("sort", sort);

    const res = await fetch(`${API_AUTH_URL}/reports/?${params.toString()}`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Failed to fetch reports: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error fetching reports:", error);
    return { data: [], page, page_size: pageSize, total: 0, next_page: null, previous_page: null };
  }
}


export async function dismissReport(id: string): Promise<Report> {
  const res = await fetch(`${API_AUTH_URL}/reports/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status: "handled" }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Failed to dismiss report: ${res.statusText}`);
  }

  return await res.json();
}
