// Shared in-memory cache for the aggregated SSR listing fetches
// (/site/datasets-listing/, /site/organizations-listing/,
// /site/reuses-listing/), keyed by URL ONLY.
//
// Why not `next: { revalidate: 60 }`: the Next.js Data Cache includes the
// request headers in its cache key, and these fetches must relay the
// visitor's `X-Forwarded-For` (serverForwardedHeaders) so the backend rate
// limiter keys per visitor, not per the Next.js server IP the F5 collapse
// would otherwise produce. Header-keyed entries meant one cache entry per
// client IP × query combination: every visitor's first load always reached
// the backend, and the on-disk fetch-cache grew with ~500 KB per entry.
//
// Keying by URL alone restores one shared entry per query combination — the
// original intent of the Data Cache comment this replaces. The forwarded
// headers still go out on the single upstream miss, so limiter attribution
// stays per-visitor: a cache-buster varying the query string only burns their
// own bucket. Concurrent misses for the same URL are deduped by caching the
// in-flight promise; failures are never cached, so the next request retries
// as soon as the backend recovers.
//
// Like the Apollo CMS cache, this module is a long-lived per-process
// singleton: each replica warms its own cache, bounded by MAX_ENTRIES as a
// memory backstop against crawlers sweeping many filter combinations.

const CACHE_TTL_MS = 60_000; // matches the backend @cache.cached(60)
const MAX_ENTRIES = 100;

export type ListingFetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; statusText: string };

interface CacheEntry {
  expiresAt: number;
  result: Promise<ListingFetchResult<unknown>>;
}

const cache = new Map<string, CacheEntry>();

function prune(now: number) {
  for (const [url, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(url);
  }
  // Map iterates in insertion order, so the first keys are the oldest.
  while (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

/**
 * GET `url` relaying `forwarded` headers, caching successful responses for
 * 60s keyed by `url` alone. Network errors throw (callers keep their existing
 * catch fallbacks); HTTP errors return `{ ok: false, status, statusText }`
 * and are not cached.
 */
export function cachedListingFetch<T>(
  url: string,
  forwarded?: Record<string, string>
): Promise<ListingFetchResult<T>> {
  const now = Date.now();
  const hit = cache.get(url);
  if (hit && hit.expiresAt > now) {
    return hit.result as Promise<ListingFetchResult<T>>;
  }

  prune(now);

  const entry: CacheEntry = { expiresAt: now + CACHE_TTL_MS, result: undefined! };
  entry.result = (async (): Promise<ListingFetchResult<T>> => {
    try {
      const res = await fetch(url, { cache: "no-store", headers: forwarded });
      if (!res.ok) {
        if (cache.get(url) === entry) cache.delete(url);
        return { ok: false, status: res.status, statusText: res.statusText };
      }
      return { ok: true, data: (await res.json()) as T };
    } catch (error) {
      if (cache.get(url) === entry) cache.delete(url);
      throw error;
    }
  })();
  cache.set(url, entry);

  return entry.result as Promise<ListingFetchResult<T>>;
}
