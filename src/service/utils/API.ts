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
 * Safe to replay: the backend `save_chunk` saves parts with overwrite by
 * `uuid`+`partindex` (requires the matching udata-pt backend, deployed first),
 * and the FormData holds a re-readable Blob slice, so the same body can be
 * sent again after a dropped connection.
 *
 * `assertStillReadable` (optional) runs before each retry; it should throw to
 * abort retrying with a permanent error (e.g. the source file was modified on
 * disk mid-upload — Chrome's ERR_UPLOAD_FILE_CHANGED also surfaces as a
 * generic network TypeError, so retrying would either fail forever or, worse,
 * silently send a mix of old and new bytes).
 *
 * Returns the Response plus whether any network retry happened — a lost
 * response means the backend may have already processed the request, which
 * callers need to interpret error responses of a replayed combine.
 */
async function uploadFetchWithRetry(
  url: string,
  body: FormData,
  assertStillReadable?: () => Promise<void>
): Promise<{ response: Response; retried: boolean }> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= UPLOAD_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, { method: "POST", credentials: "include", body });
      return { response, retried: attempt > 0 };
    } catch (error) {
      // Only network-level failures reach here; HTTP errors resolve normally.
      lastError = error;
      if (attempt < UPLOAD_MAX_RETRIES) {
        if (assertStillReadable) await assertStillReadable();
        const delay = UPLOAD_RETRY_BASE_DELAY_MS * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

/**
 * Probe that the browser can still read the selected file. When the file is
 * modified/moved on disk after selection, reads fail (NotReadableError /
 * ERR_UPLOAD_FILE_CHANGED) — retrying the upload can never succeed, so we
 * surface a clear instruction instead.
 */
function makeFileReadableProbe(file: File): () => Promise<void> {
  return async () => {
    const probe = file.slice(0, 1);
    // Environments without Blob.arrayBuffer (legacy browsers) can't probe;
    // don't block the retry there.
    if (typeof probe.arrayBuffer !== "function") return;
    try {
      await probe.arrayBuffer();
    } catch (error) {
      // Reads on a stale File fail with a DOMException (NotReadableError);
      // anything else is an environment quirk and shouldn't stop the retry.
      if (!(error instanceof DOMException)) return;
      throw new Error(
        "O ficheiro foi alterado durante o envio. Selecione o ficheiro novamente e tente outra vez."
      );
    }
  };
}

/** Error codes the backend returns for a combine that cannot proceed because
 * the chunks are already gone or another combine is running — after a network
 * retry these almost always mean the original combine succeeded and only its
 * response was lost. */
const COMBINE_ALREADY_HANDLED_CODES = new Set(["upload-not-found", "combine-in-progress"]);

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
 * mismatch) + `totalfilesize` (whole-file size — the backend verifies the
 * reassembled file against it); then a final request with no `file` (just
 * `uuid`/`filename`/`totalparts`/`totalfilesize`) triggers the combine and
 * returns the resource (same shape as a single-shot upload). A failing part
 * short-circuits and its Response is returned so callers surface the error
 * exactly as before. Transient network failures on any request are retried by
 * `uploadFetchWithRetry`, aborting early when the source file is no longer
 * readable (changed on disk mid-upload).
 */
export async function chunkedUploadFetch(url: string, file: File): Promise<Response> {
  const chunkSize = uiConfig.resourceFileUploadChunk;
  const assertStillReadable = makeFileReadableProbe(file);

  if (file.size <= chunkSize) {
    const body = new FormData();
    body.append("file", file);
    const { response } = await uploadFetchWithRetry(url, body, assertStillReadable);
    return response;
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
    body.append("totalfilesize", String(file.size));

    const { response } = await uploadFetchWithRetry(url, body, assertStillReadable);
    if (!response.ok) return response;
  }

  const combine = new FormData();
  combine.append("uuid", uuid);
  combine.append("filename", file.name);
  combine.append("totalparts", String(totalparts));
  combine.append("totalfilesize", String(file.size));
  const { response, retried } = await uploadFetchWithRetry(url, combine, assertStillReadable);

  // A combine whose response was lost (network retry) may already have
  // succeeded server-side: the replayed request then finds no chunks left (or
  // the original still running) and fails with a specific code. Restarting
  // automatically could duplicate the resource, so ask the user to check.
  if (retried && response.status === 400) {
    const code = await response
      .clone()
      .json()
      .then((data) => data?.code)
      .catch(() => undefined);
    if (typeof code === "string" && COMBINE_ALREADY_HANDLED_CODES.has(code)) {
      throw new Error(
        "O envio pode já ter sido concluído. Atualize a página para verificar antes de tentar novamente."
      );
    }
  }
  return response;
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
