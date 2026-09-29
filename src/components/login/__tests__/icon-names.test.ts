/**
 * Every Agora icon this tree names has to exist in the design system.
 *
 * 🚩 A wrong name is SILENT. The component renders, nothing throws, the build
 * passes, and the button is simply empty -- so it survives review, tests and
 * CI, and is found by somebody looking at the screen. It happened twice here:
 * `agora-line-information-circle` in the invite (LEDG-2517) and
 * `agora-line-close` in three separate notices, whose close buttons had been
 * invisible for as long as they existed.
 *
 * Read from the package rather than from a list kept here: a list would drift
 * the first time the design system is upgraded, and drift in the direction of
 * passing.
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const LOGIN_DIR = "src/components/login";
const DS_DIR = "node_modules/@ama-pt/agora-design-system/artifacts";

/** Every `agora-…` name the design system ships. */
function knownIcons(): Set<string> {
  const names = new Set<string>();
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(js|mjs|cjs|json|d\.ts|css|svg)$/.test(entry.name)) continue;
      for (const [name] of readFileSync(full, "utf8").matchAll(/agora-(?:line|solid)-[a-z0-9-]+/g)) {
        names.add(name);
      }
    }
  };
  walk(path.join(process.cwd(), DS_DIR));
  return names;
}

/** Every `agora-…` name used in the login tree, with the file that uses it. */
function usedIcons(): Array<{ file: string; name: string }> {
  const used: Array<{ file: string; name: string }> = [];
  for (const entry of readdirSync(path.join(process.cwd(), LOGIN_DIR))) {
    if (!/\.tsx?$/.test(entry)) continue;
    const source = readFileSync(path.join(process.cwd(), LOGIN_DIR, entry), "utf8");
    for (const [name] of source.matchAll(/agora-(?:line|solid)-[a-z0-9-]+/g)) {
      used.push({ file: entry, name });
    }
  }
  return used;
}

describe("the login tree never names an icon the design system does not ship", () => {
  it("finds the design system's icon names", () => {
    // If this comes back empty the assertion below passes for the wrong reason.
    const known = knownIcons();
    expect(known.size).toBeGreaterThan(50);
    expect(known).toContain("agora-line-cross");
  });

  it("uses only names that exist", () => {
    const known = knownIcons();
    const unknown = usedIcons().filter(({ name }) => !known.has(name));

    expect(
      unknown.map(({ file, name }) => `${file}: ${name}`),
      "these render as nothing at all, silently"
    ).toEqual([]);
  });
});
