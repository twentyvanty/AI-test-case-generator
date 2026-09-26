import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n";

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
