import { describe, expect, it } from "vitest";
import {
  POISONED_FILE_WARNING,
  translateUploadError,
} from "../translateUploadError";

describe("translateUploadError", () => {
  it("replaces English 'Upload rejected' messages with the standard warning", () => {
    const backend =
      "Upload rejected: 'poisoned.xml' (type: text/xml) contains dangerous content: embedded script tag (<script>). XML-based files with scripts, event handlers, or external entity declarations are not allowed.";
    expect(translateUploadError(backend)).toBe(POISONED_FILE_WARNING);
  });

  it("replaces PT-pt 'Carregamento rejeitado' messages with the standard warning", () => {
    const backend =
      "Carregamento rejeitado: 'poisoned.xml' (tipo: text/xml) contém conteúdo perigoso: tag de script embutida (<script>).";
    expect(translateUploadError(backend)).toBe(POISONED_FILE_WARNING);
  });

  it("matches case-insensitively", () => {
    expect(translateUploadError("UPLOAD REJECTED: foo")).toBe(POISONED_FILE_WARNING);
  });

  it("passes through unrelated errors (extension)", () => {
    const msg = "A extensão de ficheiro '.exe' não é permitida.";
    expect(translateUploadError(msg)).toBe(msg);
  });

  it("passes through generic API errors", () => {
    expect(translateUploadError("HTTP 500 Internal Server Error")).toBe(
      "HTTP 500 Internal Server Error",
    );
  });

  it("returns empty string for null/undefined", () => {
    expect(translateUploadError(null)).toBe("");
    expect(translateUploadError(undefined)).toBe("");
    expect(translateUploadError("")).toBe("");
  });
});
