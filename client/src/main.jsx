import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ApolloProvider } from "@apollo/client/react";
import client from "./apollo/client.js";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

const AppWithProviders = () => (
  <ApolloProvider client={client}>
    <AuthProvider apolloClient={client}>
      <App />
    </AuthProvider>
  </ApolloProvider>
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppWithProviders />
  </StrictMode>
);
