import "server-only";

import { MIN_BACKEND_VERSION, isOlderThan } from "@/config/compatibility";

/**
 * Check, once at startup, that the backend answering this environment is new
 * enough for this frontend.
 *
 * Why this is worth a check at all: the incompatibility runs one way. A newer
 * backend with an older frontend is almost always fine, because the API grows
 * by addition and a field nobody reads is inert. A newer frontend with an
 * older backend asks for what does not exist yet -- and the symptom is not an
 * error, it is a screen quietly showing less than it should, which is the kind
 * of bug that survives a release unnoticed.
 *
 * It logs and never throws. A portal that refuses to start is worse than a
 * portal with a field missing, and the backend being briefly unreachable
 * during a deploy must not be fatal either.
 */
export async function checkBackendVersion(): Promise<void> {
  if (!MIN_BACKEND_VERSION) return;

  const backendUrl = process.env.BACKEND_URL || "http://localhost:7000";

  let served: string | null = null;
  try {
    const response = await fetch(`${backendUrl}/api/1/site/`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const site = (await response.json()) as { version?: unknown };
    served = typeof site.version === "string" ? site.version : null;
  } catch (error) {
    // Starting before the backend is up is normal, and not something the
    // operator needs to act on; say it quietly and move on.
    console.info(
      `[compat] backend version not read from ${backendUrl} (${
        error instanceof Error ? error.message : "unknown error"
      }); required: >= ${MIN_BACKEND_VERSION}`
    );
    return;
  }

  if (!served) {
    console.info(`[compat] backend did not report a version; required: >= ${MIN_BACKEND_VERSION}`);
    return;
  }

  if (isOlderThan(served, MIN_BACKEND_VERSION)) {
    console.error(
      `[compat] BACKEND TOO OLD: serving ${served}, this frontend needs >= ${MIN_BACKEND_VERSION}. ` +
        "Fields or endpoints it depends on are missing, so parts of the portal will show " +
        "less than they should, without raising an error. Deploy a matching backend."
    );
    return;
  }

  console.info(`[compat] backend ${served} (>= ${MIN_BACKEND_VERSION})`);
}
