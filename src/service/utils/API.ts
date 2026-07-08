import { uiConfig } from "@/config/site";
import { translateUploadError } from "@/lib/security/translateUploadError";

// Server-side (Node.js) needs absolute URLs; client-side uses relative URLs via Next.js proxy
const isServer = typeof window === "undefined";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:7000";
export const API_BASE_URL = isServer
  ? `${BACKEND_URL}/api/1`
  : process.env.NEXT_PUBLIC_API_BASE || "/api/1";
export const API_V2_BASE_URL = isServer
  ? `${BACKEND_URL}/api/2`
  : process.env.NEXT_PUBLIC_API_V2_BASE || "/api/2";
// Relative API URL for authenticated requests (passes through Next.js proxy which forwards cookies)
export const API_AUTH_URL = "/api/1";

// Helper: use relative URL for authenticated fetches, public URL for public fetches
export function authFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_AUTH_URL}${path}`, {
    ...init,
    credentials: "include",
  });
}

// A large resource is sent as hundreds of sequential 1 MB parts plus a final
// combine request (a 600 MB file ≈ 601 round-trips). A single dropped
// connection anywhere in that sequence used to reject the whole upload with a
// native fetch `TypeError` ("Failed to fetch" / ECONNRESET), surfacing to the
// user as a failed upload even though nothing was wrong with the file. We retry
// only these transient transport failures; HTTP error responses (413/415/400)
// are deterministic and must surface immediately, so they are never retried.
const UPLOAD_MAX_RETRIES = 3;
const UPLOAD_RETRY_BASE_DELAY_MS = 500;

/**
 * POST one upload request, retrying only transient network failures (a thrown
 * fetch `TypeError`, e.g. "Failed to fetch"). A resolved `Response` — success
 * or HTTP error — is returned as-is and never retried.
 *
 * Safe to replay: chunk parts are idempotent on the backend (`save_chunk`
 * overwrites by `uuid`+`partindex`), and the FormData holds a re-readable Blob
 * slice, so the same body can be sent again after a dropped connection.
 */
async function uploadFetchWithRetry(url: string, body: FormData): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= UPLOAD_MAX_RETRIES; attempt++) {
    try {
      return await fetch(url, { method: "POST", credentials: "include", body });
    } catch (error) {
      // Only network-level failures reach here; HTTP errors resolve normally.
      lastError = error;
      if (attempt < UPLOAD_MAX_RETRIES) {
        const delay = UPLOAD_RETRY_BASE_DELAY_MS * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

/**
 * POST a file to a udata upload endpoint, splitting large files into
 * sequential chunks that the backend reassembles.
 *
 * Why chunk: behind the PPR/PRD F5/FortiGuard WAF a single large multipart
 * POST is blocked at the perimeter (payload/size signature) before it ever
 * reaches the application — the symptom is a WAF "Web Page Blocked" HTML page,
 * not an app-level error, so no backend change can recover it. Splitting the
 * file into ~1 MB parts keeps every request under the WAF limit, restoring the
 * chunked upload the legacy (fineuploader) frontend used. The part size lives in
 * `uiConfig.resourceFileUploadChunk`; it was lowered from 2 MB to 1 MB because
 * 2 MB parts (plus multipart overhead) were still tripping the perimeter WAF on
 * larger files. Files at or below the chunk size are sent in a single request
 * (already WAF-safe).
 *
 * Protocol (udata `storages.api.handle_upload`): for each part POST
 * `file` + `uuid` + `filename` + `partindex` + `partbyteoffset` + `totalparts`
 * + `chunksize` (the part's actual byte length — the backend rejects a
 * mismatch); then a final request with no `file` (just `uuid`/`filename`/
 * `totalparts`) triggers the combine and returns the resource (same shape as a
 * single-shot upload). A failing part short-circuits and its Response is
 * returned so callers surface the error exactly as before. Transient network
 * failures on any request are retried by `uploadFetchWithRetry`.
 */
export async function chunkedUploadFetch(url: string, file: File): Promise<Response> {
  const chunkSize = uiConfig.resourceFileUploadChunk;

  if (file.size <= chunkSize) {
    const body = new FormData();
    body.append("file", file);
    return uploadFetchWithRetry(url, body);
  }

  const uuid =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const totalparts = Math.ceil(file.size / chunkSize);

  for (let part = 0; part < totalparts; part++) {
    const start = part * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const body = new FormData();
    body.append("file", file.slice(start, end), file.name);
    body.append("uuid", uuid);
    body.append("filename", file.name);
    body.append("partindex", String(part));
    body.append("partbyteoffset", String(start));
    body.append("totalparts", String(totalparts));
    body.append("chunksize", String(end - start));

    const res = await uploadFetchWithRetry(url, body);
    if (!res.ok) return res;
  }

  const combine = new FormData();
  combine.append("uuid", uuid);
  combine.append("filename", file.name);
  combine.append("totalparts", String(totalparts));
  return uploadFetchWithRetry(url, combine);
}

/**
 * Translate `data.message` from an upload failure response so any consumer
 * surfaces a consistent PT-pt warning when the backend reports a security
 * rejection. Other error messages pass through unchanged.
 */
export function translateUploadErrorPayload(
  data: Record<string, unknown>
): Record<string, unknown> {
  if (typeof data?.message !== "string") return data;
  return { ...data, message: translateUploadError(data.message) };
}
