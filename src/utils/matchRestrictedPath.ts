/**
 * Segment-boundary-aware path matching for the route gatekeeper.
 *
 * A disabled pattern blocks a request when the request path is the pattern
 * itself OR any descendant of it — matched per path segment, so `/pt/datasets`
 * blocks `/pt/datasets/123` but never a sibling like `/pt/datasets-foo`.
 *
 * Patterns may contain a "*" as a single-segment wildcard (used for per-org
 * admin tabs, e.g. "/pt/admin/org/{id}/datasets" where the org id varies).
 */

function toSegments(path: string): string[] {
  return path.split("/").filter(Boolean);
}

/** True when `pathname` equals `pattern` or is a descendant of it. */
function matchesPattern(pathSegments: string[], pattern: string): boolean {
  const patternSegments = toSegments(pattern);

  // Descendant match allows the URL to be longer, never shorter.
  if (pathSegments.length < patternSegments.length) return false;

  for (let i = 0; i < patternSegments.length; i++) {
    if (patternSegments[i] === "*") continue;
    if (patternSegments[i] !== pathSegments[i]) return false;
  }

  return true;
}

export function isPathRestricted(pathname: string, disabledPaths: string[]): boolean {
  if (disabledPaths.length === 0) return false;

  const pathSegments = toSegments(pathname);
  return disabledPaths.some((pattern) => matchesPattern(pathSegments, pattern));
}
