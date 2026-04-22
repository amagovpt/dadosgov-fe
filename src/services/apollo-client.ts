import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

const baseUrl =
  process.env.NEXT_PUBLIC_API_URL &&
  !process.env.NEXT_PUBLIC_API_URL.endsWith("/")
    ? process.env.NEXT_PUBLIC_API_URL
    : (process.env.NEXT_PUBLIC_API_URL || "").slice(0, -1);

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
