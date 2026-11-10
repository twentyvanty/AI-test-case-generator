// File types the requirement step accepts. Documents are read by code on the
// backend; images are read by a vision AI model (slower, and the text needs checking).
export const DOCUMENT_EXTENSIONS = [".pdf", ".docx", ".md", ".markdown", ".txt"];
export const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

export const MAX_DOCUMENT_MB = 20;
export const MAX_IMAGE_MB = 5;

const extensionOf = (fileName: string) =>
  fileName.slice(fileName.lastIndexOf(".")).toLowerCase();

export const isImageFileName = (fileName: string) =>
  IMAGE_EXTENSIONS.includes(extensionOf(fileName));

export const isAcceptedFileName = (fileName: string) =>
  isImageFileName(fileName) || DOCUMENT_EXTENSIONS.includes(extensionOf(fileName));

// Largest allowed size in MB for this file
export const maxSizeMb = (fileName: string) =>
  isImageFileName(fileName) ? MAX_IMAGE_MB : MAX_DOCUMENT_MB;
