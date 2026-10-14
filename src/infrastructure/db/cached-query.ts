import { QueryResultRow } from 'pg';
import { bdAnalyticalClient } from './bd-client';
import { buildCacheKey, withCache } from '@infrastructure/cache/with-cache';
import { envParser } from '@lib/envParser';

const { CACHE_TTL_MS } = envParser;


export async function cachedQuery<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends QueryResultRow = any,
>(
  text: string,
  values?: unknown[],
  ttlMs: number = CACHE_TTL_MS,
): Promise<{ rows: T[] }> {
  const key = buildCacheKey('sql', text, values ?? []);

  return withCache(key, ttlMs, async () => {
    const result = await bdAnalyticalClient.query<T>(text, values);
    return { rows: result.rows };
  });
}
