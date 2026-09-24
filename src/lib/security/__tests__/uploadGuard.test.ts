import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_SIZE } from "../constants";
import { guardFile, guardFiles } from "../uploadGuard";

function makeFile(content: string, name: string, type: string): File {
  return new File([content], name, { type });
}

async function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

describe("MAX_UPLOAD_SIZE", () => {
  it("mirrors the backend RESOURCES_FILE_MAX_SIZE of 1 GiB", () => {
    // A guard looser than the backend lets the user spend a long chunked upload
    // on a file that is rejected at the end; a tighter one hides capacity the
    // platform advertises. Both sides move together or not at all.
    expect(MAX_UPLOAD_SIZE).toBe(1024 * 1024 * 1024);
  });
});

describe("guardFile", () => {
  it("sanitizes a malicious SVG and replaces the file", async () => {
    const malicious =
      '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(2)</script><circle r="10"/></svg>';
    const file = makeFile(malicious, "logo.svg", "image/svg+xml");
    const result = await guardFile(file);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const text = await readFile(result.file);
      expect(text).not.toContain("script");
      expect(text).not.toContain("onload");
      expect(text).toContain("circle");
    }
  });

  it("rejects malicious XML outright", async () => {
    const malicious =
      '<?xml version="1.0"?><root><script>alert(1)</script></root>';
    const file = makeFile(malicious, "data.xml", "application/xml");
    const result = await guardFile(file);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/XML rejeitado/i);
  });

  it("rejects HTML files", async () => {
    const file = makeFile(
      "<!doctype html><html><body>x</body></html>",
      "page.html",
      "text/html",
    );
    const result = await guardFile(file);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/HTML/i);
  });

  it("rejects HTML disguised with a non-HTML extension", async () => {
    const file = makeFile(
      "<!doctype html><html><body>x</body></html>",
      "logo.png",
      "image/png",
    );
    const result = await guardFile(file);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/HTML/i);
  });

  it("passes a plain text file through", async () => {
    const file = makeFile("hello world", "notes.txt", "text/plain");
    const result = await guardFile(file);
    expect(result.ok).toBe(true);
  });

  it("accepts a large binary file below the global upload cap", async () => {
    const file = makeFile("a,b,c\n1,2,3\n", "big.csv", "text/csv");
    // 60MB — above the old 50MB XML cap but well below the 1GB upload cap.
    Object.defineProperty(file, "size", { value: 60 * 1024 * 1024 });
    const result = await guardFile(file);
    expect(result.ok).toBe(true);
  });

  it("accepts a file at exactly the global upload cap", async () => {
    const file = makeFile("a,b,c\n1,2,3\n", "exact.csv", "text/csv");
    // The boundary belongs to the publisher: the backend rejects only what is
    // strictly larger than RESOURCES_FILE_MAX_SIZE, so the guard must match.
    Object.defineProperty(file, "size", { value: MAX_UPLOAD_SIZE });
    const result = await guardFile(file);
    expect(result.ok).toBe(true);
  });

  it("rejects a file above the global upload cap", async () => {
    const file = makeFile("a,b,c\n1,2,3\n", "huge.csv", "text/csv");
    // 1GB + 1MB — above the 1GB upload cap.
    Object.defineProperty(file, "size", { value: MAX_UPLOAD_SIZE + 1024 * 1024 });
    const result = await guardFile(file);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/demasiado grande/i);
  });

  it("states the cap in the rejection message", async () => {
    const file = makeFile("a,b,c\n1,2,3\n", "huge.csv", "text/csv");
    Object.defineProperty(file, "size", { value: MAX_UPLOAD_SIZE + 1 });
    const result = await guardFile(file);
    expect(result.ok).toBe(false);
    // The number the user reads must follow the constant, not a stale literal.
    if (!result.ok) expect(result.reason).toContain("1024MB");
  });

  it("processes multiple files in guardFiles", async () => {
    const safe = makeFile(
      '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>',
      "ok.svg",
      "image/svg+xml",
    );
    const evil = makeFile(
      '<?xml version="1.0"?><root><script>x</script></root>',
      "bad.xml",
      "application/xml",
    );
    const { accepted, rejected } = await guardFiles([safe, evil]);
    expect(accepted).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(accepted[0].name).toBe("ok.svg");
    expect(rejected[0].file.name).toBe("bad.xml");
  });
});
