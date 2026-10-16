/** Versions shown in the footer. `null` means "could not be determined". */
export type PortalVersions = {
  backend: string | null;
  frontend: string | null;
};

const TOKENS: Record<string, keyof PortalVersions> = {
  "{backendVersion}": "backend",
  "{frontendVersion}": "frontend",
};

/**
 * Stands in for a dropped placeholder while the punctuation around it is cleaned
 * up. A sentinel no CMS text can contain, so the cleanup never eats real content.
 */
const HOLE = "\u0000";

/**
 * The repositories the footer links to, and which version each one carries.
 * Matching on the link rather than on the label is what lets a label written
 * before this existed still get the right number: the wording changes with
 * editorial taste, the repository does not.
 */
const REPO_VERSIONS: ReadonlyArray<[fragment: string, key: keyof PortalVersions]> = [
  ["amagovpt/udata-pt", "backend"],
  ["amagovpt/dadosgov-fe", "frontend"],
];

/** A version already written into a label by hand, e.g. `udata (15.0.0)`. */
const HAND_WRITTEN_VERSION = /\s*\(\s*v?\d[\w.+-]*\s*\)/;

/**
 * Replace the version placeholders a CMS editor wrote into a footer label with
 * the versions the portal is actually running.
 *
 * The wording stays in the CMS and the number comes from the code, so the
 * footer cannot drift the way the hand-typed `udata (15.0.0)` did. A label with
 * no placeholder comes back untouched, which is what makes this safe to ship
 * before the CMS text is updated.
 *
 * An unknown version removes its placeholder instead of printing `null` or
 * leaving `{backendVersion}` on screen, and takes the punctuation that was
 * wrapping it with it: `udata ()` reads worse than `udata`.
 */
export function applyVersionTokens(label: string, versions?: PortalVersions): string {
  let out = label;

  for (const [token, key] of Object.entries(TOKENS)) {
    if (!out.includes(token)) continue;

    const value = versions?.[key]?.trim();
    out = out.split(token).join(value || HOLE);
  }

  if (out.includes(HOLE)) {
    out = out
      // "udata (<hole>)" / "udata [<hole>]" -> "udata"
      .replace(new RegExp(`\\s*[([]\\s*${HOLE}\\s*[)\\]]`, "g"), "")
      // "udata: <hole>" / "udata - <hole>" -> "udata"
      .replace(new RegExp(`\\s*[:–—-]\\s*${HOLE}`, "g"), "")
      .split(HOLE)
      .join("");
  }

  return out.replace(/[ \t]{2,}/g, " ").trim();
}

/**
 * The label a footer link should show, with the version it refers to kept true.
 *
 * Two ways in, on purpose:
 *
 * 1. A label carrying `{backendVersion}` / `{frontendVersion}` — the form to
 *    write in the CMS, because it says where the number goes and reads
 *    correctly even when no version can be determined.
 * 2. A label with no placeholder that links to one of the portal's own
 *    repositories — the form the CMS holds today. The version in brackets is
 *    corrected in place, or appended if the label carries none. This is what
 *    stops the footer from announcing `udata (15.0.0)` until an editor gets
 *    round to it; once the labels use placeholders, this branch stops firing on
 *    its own and can be deleted.
 *
 * Anything else is returned untouched: this never invents a version for a link
 * it cannot identify, and never overwrites a number it cannot replace with a
 * better one.
 */
export function resolveFooterLabel(
  label: string,
  href: string | undefined,
  versions?: PortalVersions,
): string {
  if (Object.keys(TOKENS).some((token) => label.includes(token))) {
    return applyVersionTokens(label, versions);
  }

  const match = REPO_VERSIONS.find(([fragment]) => href?.includes(fragment));
  const version = match && versions?.[match[1]]?.trim();
  if (!version) return label;

  const corrected = HAND_WRITTEN_VERSION.test(label)
    ? label.replace(HAND_WRITTEN_VERSION, ` (${version})`)
    : `${label} (${version})`;

  return corrected.replace(/[ \t]{2,}/g, " ").trim();
}
