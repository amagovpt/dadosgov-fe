/**
 * LEDG-2517: every /saml/… path the app calls must be proxied to the backend.
 *
 * 🚨 THE DEFECT THIS EXISTS FOR. src/proxy.ts lists the SAML routes one by
 * one, with no catch-all, so a backend route that is not named there is
 * answered by Next.js with its own 404 and never reaches Flask. Two routes
 * shipped that way — built, tested, merged, and dead on the first click.
 *
 * Nothing caught it because every behavioural test mocks the fetch: the
 * component's job ends at "call this URL", and whether that URL is routed
 * anywhere is configuration no render can observe. Same reasoning as the
 * migration flag guard next to it — when the invariant is about what the
 * configuration does NOT contain, the source is the only place to assert it.
 *
 * The routing moved from `rewrites()` in next.config.ts to the request-time
 * forward in src/proxy.ts (BACKEND_EXACT_PATHS + BACKEND_PREFIXES); this reads
 * the lists from there and matches them the way `backendDestination` does.
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const PROXY = "src/proxy.ts";

/** Every SAML path the application asks the browser to fetch or submit to. */
function samlPathsCalledFromSource(): string[] {
  const roots = ["src/components", "src/service", "src/app"];
  const found = new Set<string>();

  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.tsx?$/.test(entry.name) && !entry.name.includes(".test.")) {
        const source = readFileSync(full, "utf8");
        for (const [, p] of source.matchAll(/["'`](\/saml\/[a-zA-Z0-9/_-]*)["'`]/g)) {
          found.add(p);
        }
      }
    }
  };

  for (const root of roots) walk(path.join(process.cwd(), root));
  return [...found].sort();
}

/** The /saml entries of one of the string-array constants in src/proxy.ts. */
function samlEntriesOf(source: string, constant: string): string[] {
  const body = source.match(new RegExp(`const ${constant} = \\[([\\s\\S]*?)\\];`))?.[1] ?? "";
  return [...body.matchAll(/"([^"]+)"/g)]
    .map(([, entry]) => entry)
    .filter((entry) => entry.startsWith("/saml/"));
}

/** Every SAML route src/proxy.ts forwards, as a matcher. */
function routeMatchers(): ((pathname: string) => boolean)[] {
  const source = readFileSync(path.join(process.cwd(), PROXY), "utf8");
  // Same rules as `backendDestination`: exact paths match whole, prefixes match
  // themselves and anything below them (`hasPrefix`).
  return [
    ...samlEntriesOf(source, "BACKEND_EXACT_PATHS").map(
      (exact) => (pathname: string) => pathname === exact
    ),
    ...samlEntriesOf(source, "BACKEND_PREFIXES").map(
      (prefix) => (pathname: string) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    ),
  ];
}

describe("every SAML path the app calls is proxied to the backend", () => {
  it("finds the paths and the routes at all", () => {
    // Without this, both assertions below pass for the wrong reason the day a
    // rename empties one of the two lists.
    expect(samlPathsCalledFromSource().length).toBeGreaterThan(3);
    expect(routeMatchers().length).toBeGreaterThan(3);
  });

  it("leaves no called path unrouted", () => {
    const matchers = routeMatchers();
    const orphans = samlPathsCalledFromSource().filter(
      (called) => !matchers.some((matches) => matches(called))
    );

    expect(orphans, `these resolve to a Next.js 404 instead of reaching Flask: ${orphans}`).toEqual(
      []
    );
  });
});
