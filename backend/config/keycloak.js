// Keycloak settings shared by the auth middleware and the Swagger docs.
// Defaults match the local docker-compose Keycloak.
export const keycloakUrl = process.env.KEYCLOAK_URL ?? "http://localhost:8080";
export const keycloakRealm = process.env.KEYCLOAK_REALM ?? "ai-test-case-generator";
export const keycloakClientId =
  process.env.KEYCLOAK_CLIENT_ID ?? "ai-test-case-frontend";

export const keycloakIssuer = `${keycloakUrl}/realms/${keycloakRealm}`;
