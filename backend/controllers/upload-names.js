// Browsers send non-English file names as UTF-8, but the upload parser (multer)
// reads them as Latin-1 — turn "à¸..." back into the real (e.g. Thai) name.
// Used by every upload: requirement documents and defect screenshots.
export function originalName(file) {
  return Buffer.from(file.originalname, "latin1").toString("utf8");
}
