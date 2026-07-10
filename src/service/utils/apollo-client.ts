import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  type OperationVariables,
} from "@apollo/client";
import type { MaybeMasked } from "@apollo/client";
import { getCmsBaseUrl } from "./cmsBaseUrl";

const link = new HttpLink({
  uri: `${getCmsBaseUrl()}/graphql`,
});


if (process.env.NODE_ENV === "development") {
  loadDevMessages();
  loadErrorMessages();
}

// On the server this module is a long-lived singleton, so cached CMS data
// would only refresh on restart; expire it after a configurable TTL instead.
const ttlSeconds = Number(process.env.APOLLO_CACHE_TTL_SECONDS);
const CACHE_TTL_MS =
  (Number.isFinite(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : 300) * 1000;

class TtlApolloClient extends ApolloClient {
  private lastResetAt = Date.now();

  async query<
    TData = unknown,
    TVariables extends OperationVariables = OperationVariables,
  >(
    options: ApolloClient.QueryOptions<TData, TVariables>,
  ): Promise<ApolloClient.QueryResult<MaybeMasked<TData>>> {
    if (
      typeof window === "undefined" &&
      Date.now() - this.lastResetAt >= CACHE_TTL_MS
    ) {
      this.lastResetAt = Date.now();
      await this.cache.reset();
    }
    return super.query(options);
  }
}


const apolloClient = new TtlApolloClient({
  link,
  cache: new InMemoryCache(),
  devtools: {
    enabled: process.env.NODE_ENV === "development",
  },
});

export default apolloClient;
