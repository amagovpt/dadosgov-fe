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

/** Builds the CSV from the table columns that have an `exportValue`. */
export function buildCsvFromColumns<T, F extends string = never>(
  items: T[],
  columns: AdminListColumn<T, F>[]
): string {
  const exportable = columns.filter((column) => column.exportValue);
  const header = exportable.map((column) =>
    escapeCsvCell(column.headerLabel ?? String(column.header))
  );
  const rows = items.map((item) =>
    exportable.map((column) => escapeCsvCell(column.exportValue?.(item)))
  );

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

export function buildCsvFilename(prefix: string, date: Date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${prefix}-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.csv`;
}
