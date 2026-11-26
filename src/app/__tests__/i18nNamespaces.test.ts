/**
 * Guards the per-route translation split in `src/config/i18nConfig.ts`.
 *
 * The root layout ships only `rootNamespaces`; every other namespace reaches
 * the browser through the `layout.tsx` of the route segment that uses it. A
 * component that starts using a namespace on a route that does not load it
 * would render raw keys (`filters.title`) in production, and nothing else
 * would notice. This walks the source instead: for each client file that uses
 * a non-root namespace, it follows the import graph up to the route files that
 * render it, and fails when one of them lies outside the segments loading it.
 */

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { adminNamespaces, rootNamespaces, routeNamespaces } from "@/config/i18nConfig";

const SRC = path.resolve(__dirname, "..", "..");
const APP_LOCALE = "app/[locale]/";

const toPosix = (p: string) => p.split(path.sep).join("/");
const rel = (full: string) => toPosix(path.relative(SRC, full));

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "__tests__" && entry.name !== "locales") walk(full, out);
    } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(SRC);
const sources = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));
const known = new Set(
  readdirSync(path.join(SRC, "locales", "pt")).map((f) => f.replace(/\.json$/, ""))
);

/** Namespaces a file asks the client i18n instance for. */
function namespacesUsed(source: string): Set<string> {
  const found = new Set<string>();
  const add = (ns: string) => known.has(ns) && found.add(ns);
  for (const m of source.matchAll(/useTranslation\(\s*(\[[^\]]*\]|["'][^"']+["'])/g)) {
    for (const q of m[1].matchAll(/["']([^"']+)["']/g)) add(q[1]);
  }
  for (const m of source.matchAll(/\bns:\s*["']([a-z-]+)["']/g)) add(m[1]);
  for (const m of source.matchAll(/["'`]([a-z-]+):[A-Za-z_]/g)) add(m[1]);
  return found;
}

function resolveImport(from: string, spec: string): string | undefined {
  let base: string;
  if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else return undefined;
  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ]) {
    if (sources.has(candidate)) return candidate;
  }
  return undefined;
}

const importers = new Map<string, Set<string>>();
for (const [file, source] of sources) {
  for (const m of source.matchAll(/(?:from\s+|import\(\s*)["']([^"']+)["']/g)) {
    const target = resolveImport(file, m[1]);
    if (!target) continue;
    if (!importers.has(target)) importers.set(target, new Set());
    importers.get(target)!.add(file);
  }
}

/** Route directories (under `src/`) whose layout loads `ns`. */
function loadingSegments(ns: string): string[] {
  const segments = Object.entries(routeNamespaces)
    .filter(([, list]) => (list as string[]).includes(ns))
    .map(([segment]) => `${APP_LOCALE}(pages)/${segment}/`);
  if (adminNamespaces.includes(ns)) segments.push(`${APP_LOCALE}(admin)/`);
  return segments;
}

describe("translation namespaces are loaded where they are used", () => {
  it("every config namespace exists in src/locales", () => {
    const configured = [
      ...rootNamespaces,
      ...adminNamespaces,
      ...Object.values(routeNamespaces).flat(),
    ];
    expect(configured.filter((ns) => !known.has(ns))).toEqual([]);
  });

  it("every namespace is shipped somewhere", () => {
    const shipped = new Set([
      ...rootNamespaces,
      ...adminNamespaces,
      ...Object.values(routeNamespaces).flat(),
    ]);
    expect([...known].filter((ns) => !shipped.has(ns))).toEqual([]);
  });

  it("no route renders a namespace its layouts do not load", () => {
    const root = new Set(rootNamespaces);
    const offenders: string[] = [];

    for (const [file, source] of sources) {
      // Server components translate with their own `initTranslations` instance.
      if (source.includes("initTranslations(")) continue;

      for (const ns of namespacesUsed(source)) {
        if (root.has(ns)) continue;
        const allowed = loadingSegments(ns);
        const inAllowed = (f: string) => allowed.some((s) => rel(f).startsWith(s));

        // Walk up the import graph until each path reaches a loading segment
        // (fine) or a route file outside every loading segment (offender).
        const seen = new Set<string>();
        const queue = [file];
        while (queue.length) {
          const current = queue.shift()!;
          if (seen.has(current)) continue;
          seen.add(current);
          if (inAllowed(current)) continue;
          if (rel(current).startsWith("app/")) {
            offenders.push(`${ns}: ${rel(file)} is rendered by ${rel(current)}`);
            continue;
          }
          queue.push(...(importers.get(current) ?? []));
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
