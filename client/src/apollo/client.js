import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

// Use production URL directly
const GRAPHQL_URI = "https://pollapp-ivzl.onrender.com/graphql";

// Create HTTP link to GraphQL endpoint
const httpLink = createHttpLink({
  uri: GRAPHQL_URI,
  fetchOptions: {
    timeout: 30000, // 30 second timeout for cold starts
  },
});

// Create auth link to add JWT token to requests
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: "all",
      fetchPolicy: "cache-and-network",
    },
    query: {
      errorPolicy: "all",
      fetchPolicy: "cache-first",
    },
  },
});

export default client;
