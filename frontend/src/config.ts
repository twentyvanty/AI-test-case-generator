// All environment-specific settings live here.
// Override them in frontend/.env (see frontend/.env.example);
// the defaults below match the local development setup.
const config = {
  apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:5001",

  keycloak: {
    url: import.meta.env.VITE_KEYCLOAK_URL ?? "http://localhost:8080",
    realm: import.meta.env.VITE_KEYCLOAK_REALM ?? "ai-test-case-generator",
    clientId:
      import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "ai-test-case-frontend",
  },
};

export default config;
