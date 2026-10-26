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

export function formatFileSize(bytes: number): string {
  const sizeKB = (bytes / 1024).toFixed(1);
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${sizeKB} KB`;
}
