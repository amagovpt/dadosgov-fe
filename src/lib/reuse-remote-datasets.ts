/**
 * Helpers for reading external dataset URLs that reuses store under
 * `Reuse.extras.remote_datasets` (LEDG-1748).
 *
 * The schema is intentionally permissive: historic data and the current
 * admin form persist a `string[]`, but a follow-up PR will introduce
 * `{url, title?, description?}` entries. Both shapes must round-trip
 * cleanly, so every consumer goes through these helpers.
 */

export interface RemoteDatasetEntry {
  url: string;
  title?: string;
  description?: string;
}

/**
 * Normalize raw `extras.remote_datasets` into a typed array. Drops
 * malformed entries (empty / non-stringy URLs) and trims surrounding
 * whitespace.
 */
export function normalizeRemoteDatasets(
  extras: Record<string, unknown> | null | undefined
): RemoteDatasetEntry[] {
  const raw = extras?.remote_datasets;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry): RemoteDatasetEntry | null => {
      if (typeof entry === "string") {
        const url = entry.trim();
        return url ? { url } : null;
      }
      if (entry && typeof entry === "object") {
        const obj = entry as { url?: unknown; title?: unknown; description?: unknown };
        if (typeof obj.url !== "string") return null;
        const url = obj.url.trim();
        if (!url) return null;
        return {
          url,
          title: typeof obj.title === "string" && obj.title.trim() ? obj.title.trim() : undefined,
          description:
            typeof obj.description === "string" && obj.description.trim()
              ? obj.description.trim()
              : undefined,
        };
      }
      return null;
    })
    .filter((e): e is RemoteDatasetEntry => e !== null);
}

/**
 * Shortcut that returns just the URLs in their canonical form. Convenient
 * for the admin form whose state is `{ url: string }[]` and for diffing
 * against previously-saved data.
 */
export function extractRemoteDatasetUrls(
  extras: Record<string, unknown> | null | undefined
): string[] {
  return normalizeRemoteDatasets(extras).map((e) => e.url);
}
