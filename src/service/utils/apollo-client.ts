import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  type OperationVariables,
} from "@apollo/client";
import type { MaybeMasked } from "@apollo/client";
import { print } from "graphql";
import { getCmsBaseUrl } from "./cmsBaseUrl";

// Every public SSR page depends on the CMS (page content, metadata, home
// hero/datastories); without a deadline a slow Squidex blocks the render
// until the F5 time limit (observed in PRD 2026-07-30: 6–25s TTFBs and
// gateway timeouts while the backend and Next itself were healthy). Each
// server-side GraphQL request therefore gets its own AbortSignal so a hung
// CMS fails fast and the stale-while-revalidate cache below (or the caller's
// fallback) takes over. Browser requests keep the default behaviour —
// AbortSignal.any/timeout support is uneven there and the user can navigate
// away.
const timeoutMs = Number(process.env.CMS_FETCH_TIMEOUT_MS);
const CMS_TIMEOUT_MS = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 5000;

const link = new HttpLink({
  uri: `${getCmsBaseUrl()}/graphql`,
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    typeof window === "undefined"
      ? fetch(input, { ...init, signal: AbortSignal.timeout(CMS_TIMEOUT_MS) })
      : fetch(input, init),
});


if (process.env.NODE_ENV === "development") {
  loadDevMessages();
  loadErrorMessages();
}

// On the server this module is a long-lived singleton. The previous design
// expired CMS data by resetting the InMemoryCache every TTL, which destroyed
// the only good copy exactly when it was needed: the next request then
// BLOCKED on the (possibly slow or down) CMS for its full response time.
// Serve stale instead: query results are kept per query+variables; past the
// TTL the stale result is returned immediately and a deduped background
// network refetch updates the entry (a failed refresh keeps the stale copy).
// A slow CMS now degrades freshness, never latency — only a cold process
// with an unresponsive CMS still waits, and then at most CMS_TIMEOUT_MS.
const ttlSeconds = Number(process.env.APOLLO_CACHE_TTL_SECONDS);
const CACHE_TTL_MS =
  (Number.isFinite(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : 300) * 1000;
// Memory backstop; CMS queries are finite (documents × locales) so this is
// never reached in practice.
const MAX_ENTRIES = 200;

interface CachedResult {
  fetchedAt: number;
  result: unknown;
}

class SwrApolloClient extends ApolloClient {
  private results = new Map<string, CachedResult>();
  private inflight = new Map<string, Promise<unknown>>();

  async query<
    TData = unknown,
    TVariables extends OperationVariables = OperationVariables,
  >(
    options: ApolloClient.QueryOptions<TData, TVariables>,
  ): Promise<ApolloClient.QueryResult<MaybeMasked<TData>>> {
    if (typeof window !== "undefined") {
      return super.query(options);
    }

    // Locale is interpolated into the query text (e.g. getHome), so the
    // printed document alone distinguishes locales; variables cover the rest.
    const key = JSON.stringify([print(options.query), options.variables ?? null]);
    const now = Date.now();
    const hit = this.results.get(key);

    if (hit && now - hit.fetchedAt < CACHE_TTL_MS) {
      return hit.result as ApolloClient.QueryResult<MaybeMasked<TData>>;
    }

    const refresh = this.refresh(key, options);
    if (hit) {
      // Stale: serve it immediately; the background refresh updates the
      // entry for later requests, and its failure must keep the stale copy
      // (and not surface as an unhandled rejection).
      refresh.catch(() => {});
      return hit.result as ApolloClient.QueryResult<MaybeMasked<TData>>;
    }
    return refresh;
  }

  /** Network fetch deduped per key: concurrent misses share one request. */
  private refresh<
    TData,
    TVariables extends OperationVariables,
  >(
    key: string,
    options: ApolloClient.QueryOptions<TData, TVariables>,
  ): Promise<ApolloClient.QueryResult<MaybeMasked<TData>>> {
    const existing = this.inflight.get(key);
    if (existing) {
      return existing as Promise<ApolloClient.QueryResult<MaybeMasked<TData>>>;
    }

    const promise = super
      .query({ ...options, fetchPolicy: "network-only" })
      .then((result) => {
        this.results.set(key, { fetchedAt: Date.now(), result });
        if (this.results.size > MAX_ENTRIES) {
          // Map iterates in insertion order, so the first key is the oldest.
          const oldest = this.results.keys().next().value;
          if (oldest !== undefined) this.results.delete(oldest);
        }
        return result;
      })
      .finally(() => {
        this.inflight.delete(key);
      });
    this.inflight.set(key, promise);
    return promise;
  }
}


const apolloClient = new SwrApolloClient({
  link,
  cache: new InMemoryCache(),
  devtools: {
    enabled: process.env.NODE_ENV === "development",
  },
});

export default apolloClient;
