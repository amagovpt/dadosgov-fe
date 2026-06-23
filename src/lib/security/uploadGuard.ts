import { MAX_SVG_SIZE, MAX_UPLOAD_SIZE, MAX_XML_SIZE } from "./constants";
import { sanitizeSvg, SvgSanitizationError } from "./sanitizeSvg";
import { sanitizeXml, XmlSanitizationError } from "./sanitizeXml";

export type GuardResult =
  | { ok: true; file: File }
  | { ok: false; reason: string };

const HTML_SIGNATURES = [
  "<!doctype html",
  "<html",
  "<script",
  "<iframe",
  "<body",
  "<head ",
  "<head>",
];

function hasExtension(name: string, exts: string[]): boolean {
  const lower = name.toLowerCase();
  return exts.some((ext) => lower.endsWith(ext));
}

function readBlobAsText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

async function readAsText(file: File): Promise<string> {
  return readBlobAsText(file);
}

async function sniffHtml(file: File): Promise<boolean> {
  const length = Math.min(1024, file.size);
  const slice = file.slice(0, length);
  const head = await readBlobAsText(slice);
  const lower = head.trim().toLowerCase();
  return HTML_SIGNATURES.some((sig) => lower.includes(sig));
}

function replaceFile(original: File, content: string, type: string): File {
  return new File([content], original.name, {
    type,
    lastModified: original.lastModified,
  });
}

export async function guardFile(file: File): Promise<GuardResult> {
  if (file.size > MAX_UPLOAD_SIZE) {
    return {
      ok: false,
      reason: `Ficheiro demasiado grande (máximo ${Math.floor(MAX_UPLOAD_SIZE / 1024 / 1024)}MB)`,
    };
  }

  const name = file.name.toLowerCase();
  const mime = (file.type || "").toLowerCase();

  const isSvg = mime === "image/svg+xml" || hasExtension(name, [".svg"]);
  const isXml =
    !isSvg &&
    (mime === "application/xml" ||
      mime === "text/xml" ||
      hasExtension(name, [".xml"]));
  const isHtml = mime === "text/html" || hasExtension(name, [".html", ".htm"]);

  if (isHtml) {
    return { ok: false, reason: "Conteúdo HTML não permitido." };
  }

  if (isSvg) {
    if (file.size > MAX_SVG_SIZE) {
      return {
        ok: false,
        reason: `SVG demasiado grande (máximo ${Math.floor(MAX_SVG_SIZE / 1024 / 1024)}MB)`,
      };
    }
    try {
      const content = await readAsText(file);
      const cleaned = sanitizeSvg(content);
      return { ok: true, file: replaceFile(file, cleaned, "image/svg+xml") };
    } catch (err) {
      const reason =
        err instanceof SvgSanitizationError
          ? `SVG rejeitado: ${err.message}`
          : "SVG rejeitado.";
      return { ok: false, reason };
    }
  }

  if (isXml) {
    if (file.size > MAX_XML_SIZE) {
      return {
        ok: false,
        reason: `XML demasiado grande (máximo ${Math.floor(MAX_XML_SIZE / 1024 / 1024)}MB)`,
      };
    }
    try {
      const content = await readAsText(file);
      const cleaned = sanitizeXml(content);
      return {
        ok: true,
        file: replaceFile(file, cleaned, mime || "application/xml"),
      };
    } catch (err) {
      const reason =
        err instanceof XmlSanitizationError
          ? `XML rejeitado: ${err.message}`
          : "XML rejeitado.";
      return { ok: false, reason };
    }
  }

  if (await sniffHtml(file)) {
    return {
      ok: false,
      reason: "Conteúdo HTML detetado em ficheiro não-HTML.",
    };
  }

  return { ok: true, file };
}

export async function guardFiles(
  files: File[],
): Promise<{ accepted: File[]; rejected: { file: File; reason: string }[] }> {
  const accepted: File[] = [];
  const rejected: { file: File; reason: string }[] = [];

  for (const file of files) {
    const result = await guardFile(file);
    if (result.ok) accepted.push(result.file);
    else rejected.push({ file, reason: result.reason });
  }

  return { accepted, rejected };
}
