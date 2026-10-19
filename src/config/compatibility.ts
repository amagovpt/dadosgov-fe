import pkg from "../../package.json";

/**
 * The oldest backend this frontend can be served by, as declared in
 * `package.json`.
 *
 * It lives in the manifest, next to `version`, so that any tool can read it
 * without building the app -- the release script and `run_servers.py` both do.
 */
export const MIN_BACKEND_VERSION: string | null =
  (pkg as { minBackendVersion?: string }).minBackendVersion ?? null;

/**
 * Split a version into numbers. `16.0.0.12` has four segments because the
 * backend is a fork of udata and carries a Portuguese revision; this app has
 * three. Both parse the same way.
 */
function segments(version: string): number[] {
  return version
    .trim()
    .replace(/^v/, "")
    .split(".")
    .map((part) => Number.parseInt(part, 10))
    .map((value) => (Number.isFinite(value) ? value : 0));
}

/**
 * True when `candidate` is older than `minimum`.
 *
 * Compares segment by segment as numbers, never as text: `16.0.0.9` is older
 * than `16.0.0.12`, while a string comparison would say the opposite. Missing
 * segments count as zero, so `16.1.0` reads as `16.1.0.0` beside `16.0.0.12`.
 */
export function isOlderThan(candidate: string, minimum: string): boolean {
  const left = segments(candidate);
  const right = segments(minimum);
  const width = Math.max(left.length, right.length);

  for (let index = 0; index < width; index += 1) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;
    if (a !== b) return a < b;
  }

  return false;
}
