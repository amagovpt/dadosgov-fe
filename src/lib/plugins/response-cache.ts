import { useResponseCache } from '@graphql-yoga/plugin-response-cache';
import { responseCacheStore } from '@infrastructure/cache/response-cache-store';
import { getCmsRootQueryFieldNames } from '@infrastructure/cms/remote-schema';
import { envParser } from '../envParser';

const { CACHE_ENABLED, CACHE_TTL_MS, NODE_ENV } = envParser;

const NEVER_CACHE = 0;

/**
 * Queries deliberately excluded from the response cache.
 *
 * The search queries take up to 18 filter arguments each, so their key space is
 * combinatorial: caching them would evict the useful entries without ever
 * producing a meaningful hit rate. They still benefit from the repository
 * layer, where their parameterless sub-queries (totals, filter bounds) are
 * shared across every filter combination.
 */
const UNCACHEABLE_QUERIES = [
  'Query.searchBeneficiariesOfPortugal2030',
  'Query.searchProjectsOfPortugal2030',
  'Query.searchBeneficiariesOfPRR',
  'Query.searchProjectsOfPRR',
  // Health probe: must always reflect live state.
  'Query.heartbeat',
];

const cmsDetectionCache = new Map<string, boolean>();
const CMS_DETECTION_CACHE_MAX = 200;

let cmsFieldPattern: RegExp | null = null;
let cmsFieldPatternSource: readonly string[] | null = null;

/**
 * Matches any CMS root Query field name.
 *
 * Built lazily because the CMS schema is only fetched after startup, and
 * rebuilt whenever a schema refresh yields a new field list.
 *
 * GraphQL names are `[_A-Za-z][_0-9A-Za-z]*`, so nothing needs escaping.
 */
function getCmsFieldPattern(): RegExp | null {
  const fieldNames = getCmsRootQueryFieldNames();
  if (fieldNames !== cmsFieldPatternSource) {
    cmsFieldPatternSource = fieldNames;
    cmsFieldPattern =
      fieldNames.length > 0
        ? new RegExp(`\\b(?:${fieldNames.join('|')})\\b`)
        : null;
    cmsDetectionCache.clear();
  }
  return cmsFieldPattern;
}

/**
 * Whether an operation reaches into the CMS subschema.
 *
 * Tested against the raw query string rather than the AST, because that is what
 * is available before execution. Good enough here: neither fragments nor
 * aliases change a field's *name*, so a CMS root field always appears verbatim
 * in the text. A false positive would only forgo caching for that operation.
 *
 * The frontend sends a small, fixed set of operations, so the memo table stays
 * tiny and this collapses to a map lookup per request.
 */
function touchesCms(query: string): boolean {
  const pattern = getCmsFieldPattern();
  if (!pattern) return false;

  const memoized = cmsDetectionCache.get(query);
  if (memoized !== undefined) return memoized;

  const result = pattern.test(query);
  if (cmsDetectionCache.size >= CMS_DETECTION_CACHE_MAX) {
    cmsDetectionCache.clear();
  }
  cmsDetectionCache.set(query, result);
  return result;
}

function buildTtlPerSchemaCoordinate(): Record<string, number> {
  const coordinates: Record<string, number> = {};

  // CMS fields need no entry here: any operation touching them bypasses the
  // plugin via `enabled`, so editorial content is always read live. (They
  // couldn't be listed anyway — the plugin snapshots this map at creation,
  // before the CMS schema has been fetched.)
  for (const coordinate of UNCACHEABLE_QUERIES) {
    coordinates[coordinate] = NEVER_CACHE;
  }

  return coordinates;
}

export const responseCache = useResponseCache({
  cache: responseCacheStore,
  // Public API with no authentication: every visitor shares one cache bucket.
  session: () => null,
  // Returning false here is the only way to stop the plugin rewriting the
  // document. It injects `__responseCacheTypeName: __typename` into every
  // selection set, and the CMS gateway rejects aliased introspection fields
  // with a 406 — so CMS operations must bypass the plugin entirely, not merely
  // carry a zero TTL. The injection is pure overhead for us anyway, since
  // invalidateViaMutation is off.
  enabled: (_request, context) => {
    if (!CACHE_ENABLED) return false;

    // Yoga also calls this from its onRequest hook, passing the server context,
    // which has no `params` despite what the type claims. There we defer and
    // let the onExecute call make the real decision.
    const query = context?.params?.query;
    if (!query) return true;

    return !touchesCms(query);
  },
  ttl: CACHE_TTL_MS,
  ttlPerSchemaCoordinate: buildTtlPerSchemaCoordinate(),
  // Neither mutation writes to anything a query reads back, so the entity
  // bookkeeping this would cost us buys nothing.
  invalidateViaMutation: false,
  // Surfaces extensions.responseCache.hit outside production for verification.
  includeExtensionMetadata: NODE_ENV !== 'production',
});
