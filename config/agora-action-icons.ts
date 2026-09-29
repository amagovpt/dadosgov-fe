import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

/**
 * Ágora 4 exposes Icon through a lazy registry, but provides no public eager
 * icon exports. Resolve its original SVG components at build time for the
 * action row. No assets are copied, and package-generated hashes are not pinned.
 * Fail explicitly if an Ágora upgrade changes this internal file layout.
 */
export function resolveAgoraActionIcons(projectRoot: string): Record<string, string> {
  const requirePackage = createRequire(resolve(projectRoot, "package.json"));
  const directory = dirname(requirePackage.resolve("@ama-pt/agora-design-system"));
  const files = readdirSync(directory);
  return Object.fromEntries(["line-star", "solid-star", "line-edit", "solid-edit"].map((name) => {
    const matches = files.filter((file) => file.startsWith(`${name}-`) && file.endsWith(".mjs"));
    if (matches.length !== 1) {
      throw new Error(`Cannot resolve Ágora ${name}: expected one SVG component in ${directory}, found ${matches.length}.`);
    }
    return [`@agora-action-icons/${name}`, resolve(directory, matches[0])];
  }));
}
