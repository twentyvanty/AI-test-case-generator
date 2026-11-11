// One CSV cell: quoted, with inner quotes doubled
const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

// rows[0] is the header row
export function toCsv(rows: (string | number)[][]) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

// Saves text as a file in the browser's downloads
export function downloadFile(fileName: string, content: string, type = "text/csv;charset=utf-8") {
  // The BOM makes Excel read Thai text as UTF-8
  const blob = new Blob(["﻿", content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
