import { createHash } from 'node:crypto';
import { envParser } from '@lib/envParser';
import { cacheGet, cacheSet } from './memory-cache';

const { CACHE_ENABLED } = envParser;


const inFlight = new Map<string, Promise<unknown>>();

export function buildCacheKey(namespace: string, ...parts: unknown[]): string {
  const hash = createHash('sha1');
  for (const part of parts) {
    hash.update(typeof part === 'string' ? part : JSON.stringify(part) ?? '');
    // NUL delimiter: without it ('ab', 'c') and ('a', 'bc') would hash alike.
    hash.update('\u0000');
  }
  return `${namespace}:${hash.digest('hex')}`;
}

export async function withCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  if (!CACHE_ENABLED || !(ttlMs > 0)) {
    return loader();
  }

  const cached = cacheGet<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  const pending = inFlight.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  const promise = loader()
    .then((value) => {
      cacheSet(key, value, ttlMs);
      return value;
    })
    .finally(() => {
      // Always released, so a rejected loader is never memoized.
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

export function inFlightCount(): number {
  return inFlight.size;
}
