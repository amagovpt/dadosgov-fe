/**
 * LEDG-2517: every /saml/… path the app calls must be proxied to the backend.
 *
 * 🚨 THE DEFECT THIS EXISTS FOR. next.config.ts lists the SAML rewrites one by
 * one, with no catch-all, so a backend route that is not named there is
 * answered by Next.js with its own 404 and never reaches Flask. Two routes
 * shipped that way — built, tested, merged, and dead on the first click.
 *
 * Nothing caught it because every behavioural test mocks the fetch: the
 * component's job ends at "call this URL", and whether that URL is routed
 * anywhere is configuration no render can observe. Same reasoning as the
 * migration flag guard next to it — when the invariant is about what the
 * configuration does NOT contain, the source is the only place to assert it.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const CONFIG = "next.config.ts";

/** Every SAML path the application asks the browser to fetch or submit to. */
function samlPathsCalledFromSource(): string[] {
  const roots = ["src/components", "src/service", "src/app"];
  const found = new Set<string>();

  const walk = (dir: string) => {
    for (const entry of require("node:fs").readdirSync(dir, { withFileTypes: true })) {
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

/** Every rewrite source declared for /saml, as a matcher. */
function rewriteMatchers(): RegExp[] {
  const config = readFileSync(path.join(process.cwd(), CONFIG), "utf8");
  return [...config.matchAll(/source:\s*"(\/saml\/[^"]*)"/g)].map(([, source]) => {
    // `:path*` matches any remaining segments; everything else is literal.
    const pattern = source.replace(/\/:\w+\*/g, "(?:/.*)?").replace(/\//g, "\\/");
    return new RegExp(`^${pattern}$`);
  });
}

describe("every SAML path the app calls is proxied to the backend", () => {
  it("finds the paths and the rewrites at all", () => {
    // Without this, both assertions below pass for the wrong reason the day a
    // rename empties one of the two lists.
    expect(samlPathsCalledFromSource().length).toBeGreaterThan(3);
    expect(rewriteMatchers().length).toBeGreaterThan(3);
  });

  it("leaves no called path unrouted", () => {
    const matchers = rewriteMatchers();
    const orphans = samlPathsCalledFromSource().filter(
      (called) => !matchers.some((m) => m.test(called))
    );

    expect(orphans, `these resolve to a Next.js 404 instead of reaching Flask: ${orphans}`).toEqual(
      []
    );
  });
});
