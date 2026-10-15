import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";

// Same delimiter as the backend exports; Excel in PT expects `;`.
const CSV_DELIMITER = ";";
// Lets Excel detect UTF-8 (accents).
const UTF8_BOM = String.fromCharCode(0xfeff);
// Cells a spreadsheet would run as a formula.
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

export type CsvCellValue = string | number | boolean | null | undefined;

function escapeCsvCell(value: CsvCellValue): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (typeof value === "string" && FORMULA_TRIGGER.test(text)) text = `'${text}`;
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export interface CsvUrlOptions {
  header: string;
  /** Turns an internal path into the full URL written in the CSV. */
  resolve: (path: string) => string;
}

/**
 * Builds the CSV from the table columns that have an `exportValue`.
 * With `url`, the first column's `exportUrl` is added as the last column.
 */
export function buildCsvFromColumns<T, F extends string = never>(
  items: T[],
  columns: AdminListColumn<T, F>[],
  url?: CsvUrlOptions
): string {
  const exportable = columns.filter((column) => column.exportValue);
  const urlColumn = url ? columns.find((column) => column.exportUrl) : undefined;
  const header = exportable.map((column) =>
    escapeCsvCell(column.headerLabel ?? String(column.header))
  );
  if (url && urlColumn) header.push(escapeCsvCell(url.header));
  const rows = items.map((item) => {
    const row = exportable.map((column) => escapeCsvCell(column.exportValue?.(item)));
    if (url && urlColumn) {
      const path = urlColumn.exportUrl?.(item);
      row.push(escapeCsvCell(path ? url.resolve(path) : ""));
    }
    return row;
  });

  return [header, ...rows].map((row) => row.join(CSV_DELIMITER)).join("\r\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([UTF8_BOM + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Characters not allowed in file names.
const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g;

/** e.g. "<title> 2026-10-06 14h35m12s.csv", in local time. */
export function buildCsvFilename(title: string, date: Date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}h${pad(date.getMinutes())}m${pad(date.getSeconds())}s`;
  const safeTitle = title.replace(INVALID_FILENAME_CHARS, "-").trim();
  return `${safeTitle} ${day} ${time}.csv`;
}
