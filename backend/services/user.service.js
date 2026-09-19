import prisma from "../prisma/client.js";

export async function getOrCreateUser(keycloakUser) {
  const keycloakId = keycloakUser.sub;

  if (!keycloakId) {
    throw new Error("Keycloak user ID is missing");
  }

  return prisma.user.upsert({
    where: {
      keycloakId,
    },

    update: {
      email: keycloakUser.email ?? null,
      name:
        keycloakUser.name ??
        keycloakUser.preferred_username ??
        null,
    },

    create: {
      keycloakId,
      email: keycloakUser.email ?? null,
      name:
        keycloakUser.name ??
        keycloakUser.preferred_username ??
        null,
    },
  });
}