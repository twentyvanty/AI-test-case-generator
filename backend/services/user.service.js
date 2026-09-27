import prisma from "../prisma/client.js";

export async function getOrCreateUser(keycloakUser) {
  const keycloakId = keycloakUser.sub;

  if (!keycloakId) {
    throw new Error("Keycloak user ID is missing");
  }

  const profile = {
    email: keycloakUser.email ?? null,
    name:
      keycloakUser.name ??
      keycloakUser.preferred_username ??
      null,
  };

  const upsert = () =>
    prisma.user.upsert({
      where: {
        keycloakId,
      },

      update: profile,

      create: {
        keycloakId,
        ...profile,
      },
    });

  try {
    return await upsert();
  } catch (error) {
    // A new user's first page load sends several requests at once. On MySQL,
    // upsert = "find, then create", so two of them can both try to create the
    // user; the loser gets a unique-constraint error (P2002). The user exists
    // by then, so running the upsert again just updates it.
    if (error.code === "P2002") {
      return upsert();
    }

    throw error;
  }
}
