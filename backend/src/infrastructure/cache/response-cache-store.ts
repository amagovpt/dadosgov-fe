import type { Cache } from '@graphql-yoga/plugin-response-cache';
import { cacheGet, cacheSet } from './memory-cache';

/**
 * Adapts the shared LRU store to the interface expected by useResponseCache.
 *
 * The plugin ships createInMemoryCache, but that store is bounded by entry
 * count only. With a 512Mi pod and responses that occasionally reach tens of
 * megabytes, the budget has to be expressed in bytes, so we back the plugin
 * with the same byte-bounded store the repository layer uses.
 */
export const responseCacheStore: Cache = {
  get(id) {
    return cacheGet(id);
  },

  set(id, data, _entities, ttl) {
    cacheSet(id, data, ttl);
  },

  // Invalidation is TTL-only: analytical data changes only when the ETL runs,
  // and neither mutation writes to anything a query reads back.
  invalidate() {},
};
