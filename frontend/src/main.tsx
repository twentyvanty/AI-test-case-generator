import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// @ts-expect-error CSS files are handled by the bundler at runtime.
import "./index.css";
import App from "./App";
import keycloak from "./auth/keycloak";
import { AuthProvider } from "./auth/AuthProvider";

keycloak
  .init({
    onLoad: "check-sso",
    checkLoginIframe: false,
  })
  .then(() => {
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <AuthProvider>
          <App />
        </AuthProvider>
      </StrictMode>
    );
  })
  .catch((error) => {
    console.error("KEYCLOAK INITIALIZATION ERROR:", error);
  });