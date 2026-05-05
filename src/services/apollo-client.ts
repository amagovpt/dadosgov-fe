import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

const rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
const baseUrl = rawUrl.endsWith("/") ? rawUrl.slice(0, -1) : rawUrl;

const link = new HttpLink({
  uri: `${baseUrl}/graphql`,
});


if (process.env.NODE_ENV === "development") {
  loadDevMessages();
  loadErrorMessages();
}

const apolloClient = new ApolloClient({
  link,
  cache: new InMemoryCache(),
  devtools: {
    enabled: process.env.NODE_ENV === "development",
  },
});


export default apolloClient;
