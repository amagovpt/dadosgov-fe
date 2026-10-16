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
