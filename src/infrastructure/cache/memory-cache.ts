import { LRUCache } from 'lru-cache';
import { envParser } from '@lib/envParser';

const { CACHE_ENABLED, CACHE_MAX_BYTES, CACHE_MAX_ENTRY_BYTES, CACHE_TTL_MS } =
  envParser;

/**
 * Process-wide cache shared by the GraphQL response cache and the repository
 * layer, so both compete for a single, explicit memory budget.
 *
 * Bounded by bytes rather than entry count: responses in this API range from a
 * few hundred bytes to tens of megabytes, so a count-based limit would not
 * protect the heap. Entries above CACHE_MAX_ENTRY_BYTES are never stored.
 */

let hits = 0;
let misses = 0;
let rejectedOversize = 0;

function sizeOf(value: unknown): number {
  try {
    const serialized = JSON.stringify(value);
    // A positive integer is required by lru-cache; undefined/circular values
    // fall back to 1 so they are stored rather than throwing.
    return serialized ? Buffer.byteLength(serialized) : 1;
  } catch {
    return 1;
  }
}

const store = new LRUCache<string, object>({
  maxSize: CACHE_MAX_BYTES,
  maxEntrySize: CACHE_MAX_ENTRY_BYTES,
  sizeCalculation: sizeOf,
  ttl: CACHE_TTL_MS,
});

export function cacheGet<T>(key: string): T | undefined {
  if (!CACHE_ENABLED) return undefined;

  const value = store.get(key) as T | undefined;
  if (value === undefined) {
    misses += 1;
  } else {
    hits += 1;
  }
  return value;
}

export function cacheSet(key: string, value: unknown, ttlMs: number): void {
  // A non-positive TTL means "do not cache". lru-cache treats 0 as "no
  // expiry", which would be the opposite of what callers intend.
  if (!CACHE_ENABLED || !(ttlMs > 0)) return;
  if (value === null || typeof value !== 'object') return;

  const status: LRUCache.Status<object> = {};
  store.set(key, value as object, {
    ttl: Number.isFinite(ttlMs) ? ttlMs : CACHE_TTL_MS,
    status,
  });

  if (status.maxEntrySizeExceeded) {
    rejectedOversize += 1;
  }
}

export function cacheClear(): void {
  store.clear();
}

export function cacheStats() {
  // Drops expired entries so the reported size reflects live data, and gives
  // the cache a periodic sweep without per-entry timers.
  store.purgeStale();

  const total = hits + misses;
  return {
    enabled: CACHE_ENABLED,
    hits,
    misses,
    hitRate: total === 0 ? 0 : Number((hits / total).toFixed(4)),
    entries: store.size,
    sizeBytes: store.calculatedSize,
    maxBytes: CACHE_MAX_BYTES,
    maxEntryBytes: CACHE_MAX_ENTRY_BYTES,
    rejectedOversize,
  };
}
