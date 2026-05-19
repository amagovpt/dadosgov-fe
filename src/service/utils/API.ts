type QueryParams = Record<string, string | number | boolean | undefined | null>;

const isServer = typeof window === "undefined";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:7000";
const API_BASE_URL = isServer
  ? `${BACKEND_URL}/api/1`
  : (process.env.NEXT_PUBLIC_API_BASE || "/api/1");
const API_V2_BASE_URL = isServer
  ? `${BACKEND_URL}/api/2`
  : (process.env.NEXT_PUBLIC_API_V2_BASE || "/api/2");
const API_AUTH_URL = "/api/1";

export function getApiBaseUrl(version: 1 | 2 = 1): string {
  return version === 2 ? API_V2_BASE_URL : API_BASE_URL;
}

export function getAuthApiBaseUrl(): string {
  return API_AUTH_URL;
}

export function buildQueryParams(params: QueryParams): URLSearchParams {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });
  return searchParams;
}

export async function publicFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: init?.cache ?? "no-store",
  });
}

export async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_AUTH_URL}${path}`, {
    ...init,
    credentials: "include",
    cache: init?.cache ?? "no-store",
  });
}

