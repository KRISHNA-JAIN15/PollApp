import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ApolloProvider } from "@apollo/client/react";
import { Toaster } from "react-hot-toast";
import client from "./apollo/client.js";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import warmupServer from "./utils/serverWarmup.js";

// Warm up the server
warmupServer();

const AppWithProviders = () => (
  <ApolloProvider client={client}>
    <AuthProvider apolloClient={client}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            theme: {
              primary: "green",
              secondary: "black",
            },
          },
        }}
      />
    </AuthProvider>
  </ApolloProvider>
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppWithProviders />
  </StrictMode>
);
