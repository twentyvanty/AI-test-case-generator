import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://localhost:8080",
  realm: "ai-test-case-generator",
  clientId: "ai-test-case-frontend",
});

export default keycloak;