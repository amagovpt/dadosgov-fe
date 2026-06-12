import { translateUploadError } from "@/lib/security/translateUploadError";

// Server-side (Node.js) needs absolute URLs; client-side uses relative URLs via Next.js proxy
const isServer = typeof window === "undefined";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:7000";
export const API_BASE_URL = isServer
  ? `${BACKEND_URL}/api/1`
  : (process.env.NEXT_PUBLIC_API_BASE || "/api/1");
export const API_V2_BASE_URL = isServer
  ? `${BACKEND_URL}/api/2`
  : (process.env.NEXT_PUBLIC_API_V2_BASE || "/api/2");
// Relative API URL for authenticated requests (passes through Next.js proxy which forwards cookies)
export const API_AUTH_URL = "/api/1";

// Helper: use relative URL for authenticated fetches, public URL for public fetches
export function authFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_AUTH_URL}${path}`, {
    ...init,
    credentials: "include",
  });
}

/**
 * Translate `data.message` from an upload failure response so any consumer
 * surfaces a consistent PT-pt warning when the backend reports a security
 * rejection. Other error messages pass through unchanged.
 */
export function translateUploadErrorPayload(
  data: Record<string, unknown>,
): Record<string, unknown> {
  if (typeof data?.message !== "string") return data;
  return { ...data, message: translateUploadError(data.message) };
}
