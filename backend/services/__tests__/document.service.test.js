import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  cleanText,
  DocumentError,
  extractDocumentText,
} from "../document.service.js";

// The smallest valid PDF with one line of text, built by hand
// (the xref offsets are calculated so PDF readers accept it)
function tinyPdf(line) {
  const stream = `BT /F1 12 Tf 72 720 Td (${line}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = objects.map((body, index) => {
    const offset = pdf.length;
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    return offset;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(pdf, "latin1");
}

test("reads text from a PDF", async () => {
  const text = await extractDocumentText("spec.pdf", tinyPdf("The link expires after 30 minutes."));
  assert.match(text, /The link expires after 30 minutes\./);
});

test("reads text from a DOCX", async () => {
  const buffer = readFileSync(new URL("./fixtures/requirement.docx", import.meta.url));
  const text = await extractDocumentText("Requirement.DOCX", buffer);
  assert.match(text, /Password reset/);
  assert.match(text, /expires after 30 minutes/);
});

test("reads Markdown and TXT as UTF-8 (Thai included)", async () => {
  const thai = "ผู้ใช้ต้องรีเซ็ตรหัสผ่านผ่านลิงก์อีเมล";
  assert.equal(await extractDocumentText("req.md", Buffer.from(`# Reset\n${thai}`)), `# Reset\n${thai}`);
  assert.equal(await extractDocumentText("req.txt", Buffer.from(thai)), thai);
});

test("rejects unsupported file types", async () => {
  await assert.rejects(
    extractDocumentText("photo.png", Buffer.from("x")),
    (error) => error instanceof DocumentError && /supported file type/.test(error.message)
  );
});

test("a damaged file gives a readable error", async () => {
  await assert.rejects(
    extractDocumentText("broken.pdf", Buffer.from("not really a pdf")),
    (error) => error instanceof DocumentError && /Couldn't read "broken.pdf"/.test(error.message)
  );
});

test("cleanText tidies line endings and blank lines", () => {
  assert.equal(cleanText("  a  \r\nb\r\n\r\n\r\n\r\nc  \n"), "a\nb\n\nc");
});
