import prisma from "../prisma/client.js";
import { getOrCreateUser } from "./user.service.js";

export async function getProjects(keycloakUser) {
  const user = await getOrCreateUser(keycloakUser);

  return prisma.project.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function createProject(keycloakUser, data) {
  const user = await getOrCreateUser(keycloakUser);

  return prisma.project.create({
    data: {
      name: data.name.trim(),
      description: data.description ?? null,
      userId: user.id,
    },
  });
}