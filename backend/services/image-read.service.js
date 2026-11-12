import prisma from "../prisma/client.js";
import { getOrCreateUser } from "./user.service.js";

// Logs every AI read of a requirement image (D-033): who, which file, which model,
// how long, tokens, and what was read (or why it failed). The image isn't stored.

// The pipeline result of readImageText() → a row for prisma.imageRead.create
export function toImageReadRow({ userId, fileName, text, run }) {
  return {
    userId,
    fileName: String(fileName).slice(0, 255),
    mimeType: run.mimeType,
    size: run.size,
    status: run.status,
    attempts: run.attempts,
    model: String(run.generatorModel).slice(0, 100),
    seconds: Math.round(run.seconds * 10) / 10,
    text: run.output ? text : null,
    validation: run.validation ?? undefined,
    usage: run.usage ?? undefined,
    errorMessage: run.errorMessage ?? null,
  };
}

// Saves the log row. A logging problem must never fail the upload itself, so
// errors are only reported in the server log.
export async function recordImageRead(keycloakUser, { fileName, text, run }) {
  try {
    const user = await getOrCreateUser(keycloakUser);
    await prisma.imageRead.create({ data: toImageReadRow({ userId: user.id, fileName, text, run }) });
  } catch (error) {
    console.error("Couldn't log the image read:", error);
  }
}
