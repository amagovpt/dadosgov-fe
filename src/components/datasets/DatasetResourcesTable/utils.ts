import { Resource } from "@/service/types/dataset";
import { API_BASE_URL, EXTRAS_KEY_LABELS, MAX_SAMPLE_ROWS } from "./constants";
import { ColumnInfo, TabularData } from "./types";

export function downloadUrl(resource: Resource): string {
  return `${API_BASE_URL}/datasets/r/${resource.id}/`;
}

export const formatBytes = (bytes?: number) => {
  if (typeof bytes !== "number") return "";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2)).toLocaleString("pt-PT")} ${sizes[i]}`;
};

export const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const translateExtrasKey = (key: string): string => {
  return EXTRAS_KEY_LABELS[key] || key;
};

export const translateExtrasValue = (value: unknown): string => {
  if (value === true) return "verdadeiro";
  if (value === false) return "falso";
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export const detectColumnType = (name: string, values: string[]): string => {
  const lower = name.toLowerCase();
  if (lower.includes("url") || lower.includes("lien") || lower.includes("link") || lower.includes("href"))
    return "url";
  if (lower.includes("email") || lower.includes("courriel") || lower.includes("mail"))
    return "email";
  if (lower.includes("siret")) return "siret";
  if (lower.includes("siren")) return "siren";
  if (lower.includes("date") || lower.includes("data")) return "date";
  if (lower.includes("telephone") || lower.includes("telefone") || lower.includes("phone"))
    return "phone";

  const nonEmpty = values.filter((v) => v.length > 0);
  if (nonEmpty.length === 0) return "string";

  const allNumbers = nonEmpty.every((v) => /^-?\d+([.,]\d+)?$/.test(v));
  if (allNumbers) {
    const hasDecimals = nonEmpty.some((v) => /[.,]\d+$/.test(v));
    return hasDecimals ? "float" : "integer";
  }

  const allBools = nonEmpty.every((v) =>
    ["true", "false", "0", "1", "sim", "não", "yes", "no", "oui", "non"].includes(v.toLowerCase())
  );
  if (allBools) return "boolean";

  const allUrls = nonEmpty.every((v) => /^https?:\/\//.test(v));
  if (allUrls) return "url";

  const allDates = nonEmpty.every((v) => !isNaN(Date.parse(v)) && v.length > 6);
  if (allDates) return "date";

  return "string";
};

export const buildTabularData = (
  headers: string[],
  dataRows: string[][],
  totalRows: number
): TabularData => {
  const rows = dataRows;
  const sampleRows = dataRows.slice(0, MAX_SAMPLE_ROWS);
  const columns: ColumnInfo[] = headers.map((header, i) => ({
    name: header,
    type: detectColumnType(
      header,
      sampleRows.map((row) => row[i] || "")
    ),
  }));

  return {
    headers,
    columns,
    rows,
    totalRows,
    totalCols: headers.length,
    lastModified: null,
  };
};

export const parseCsv = (text: string, separator = ","): TabularData => {
  const lines = text.trim().split("\n");
  if (lines.length === 0)
    return { headers: [], columns: [], rows: [], totalRows: 0, totalCols: 0, lastModified: null };

  const firstLine = lines[0];
  if (firstLine.includes(";") && !firstLine.includes(",")) separator = ";";
  else if (firstLine.includes("\t")) separator = "\t";

  const parseLine = (line: string) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === separator) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const dataLines = lines.slice(1).filter((l) => l.trim().length > 0);
  const allRows = dataLines.map(parseLine);

  return buildTabularData(headers, allRows, dataLines.length);
};
