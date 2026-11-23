export function getFileExtension(name: string, isUrl: boolean): string {
  let filename = name;
  if (isUrl) {
    try {
      filename = decodeURIComponent(new URL(name).pathname.split("/").pop() || "");
    } catch {
      return "";
    }
  }
  const extMatch = filename.match(/(\.[a-z0-9]+)$/i);
  return extMatch ? extMatch[1] : "";
}

const MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  csv: "text/csv",
  tsv: "text/tab-separated-values",
  txt: "text/plain",
  json: "application/json",
  geojson: "application/geo+json",
  jsonld: "application/ld+json",
  xml: "application/xml",
  pdf: "application/pdf",
  zip: "application/zip",
  gz: "application/gzip",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  tif: "image/tiff",
  tiff: "image/tiff",
};

export function getMimeTypeForExtension(extension: string): string | undefined {
  const key = extension.replace(/^\./, "").toLowerCase();
  return Object.hasOwn(MIME_TYPES_BY_EXTENSION, key) ? MIME_TYPES_BY_EXTENSION[key] : undefined;
}

export function formatFileSize(bytes: number, locale?: string): string {
  if (bytes < 1024) return `${bytes} B`;
  const isMegabytes = bytes >= 1024 * 1024;
  const size = bytes / (isMegabytes ? 1024 * 1024 : 1024);
  const formatted = locale
    ? size.toLocaleString(locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
        useGrouping: false,
      })
    : size.toFixed(1);
  return `${formatted} ${isMegabytes ? "MB" : "KB"}`;
}

export function parseFileSize(value: string): number | null | undefined {
  if (!value.trim()) return undefined;
  const match = value.trim().match(/^(\d+(?:[.,]\d+)?)\s*(B|KB|MB|GB|TB)$/i);
  if (!match) return null;
  const amount = Number(match[1].replace(",", "."));
  const unit = match[2].toUpperCase();
  const exponent = ["B", "KB", "MB", "GB", "TB"].indexOf(unit);
  const bytes = amount * 1024 ** exponent;
  if (unit === "B" && !Number.isInteger(bytes)) return null;
  const rounded = Math.round(bytes);
  return Number.isSafeInteger(rounded) ? rounded : null;
}
