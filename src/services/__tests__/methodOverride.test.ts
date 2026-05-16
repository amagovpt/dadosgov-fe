import { afterEach, describe, expect, it, vi } from "vitest";
import { applyMethodOverride } from "../api";

const FLAG = "NEXT_PUBLIC_USE_METHOD_OVERRIDE";

describe("applyMethodOverride", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns init unchanged when the flag is not set", () => {
    vi.stubEnv(FLAG, "");
    const init: RequestInit = { method: "PUT", body: "{}" };
    expect(applyMethodOverride(init)).toBe(init);
  });

  it("returns undefined when init is undefined", () => {
    vi.stubEnv(FLAG, "true");
    expect(applyMethodOverride(undefined)).toBeUndefined();
  });

  it("rewrites PUT to POST with the override header when enabled", () => {
    vi.stubEnv(FLAG, "true");
    const result = applyMethodOverride({ method: "PUT", body: "{}" });
    expect(result?.method).toBe("POST");
    expect(new Headers(result?.headers).get("X-HTTP-Method-Override")).toBe("PUT");
  });

  it.each(["DELETE", "PATCH"])("rewrites %s to POST with override header", (verb) => {
    vi.stubEnv(FLAG, "true");
    const result = applyMethodOverride({ method: verb });
    expect(result?.method).toBe("POST");
    expect(new Headers(result?.headers).get("X-HTTP-Method-Override")).toBe(verb);
  });

  it("preserves existing headers", () => {
    vi.stubEnv(FLAG, "true");
    const result = applyMethodOverride({
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": "abc" },
    });
    const headers = new Headers(result?.headers);
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("X-CSRF-Token")).toBe("abc");
    expect(headers.get("X-HTTP-Method-Override")).toBe("PUT");
  });

  it("normalizes lowercase methods", () => {
    vi.stubEnv(FLAG, "true");
    const result = applyMethodOverride({ method: "delete" });
    expect(result?.method).toBe("POST");
    expect(new Headers(result?.headers).get("X-HTTP-Method-Override")).toBe("DELETE");
  });

  it("does not touch GET/POST/OPTIONS", () => {
    vi.stubEnv(FLAG, "true");
    for (const verb of ["GET", "POST", "OPTIONS", "HEAD"]) {
      const init = { method: verb };
      expect(applyMethodOverride(init)).toBe(init);
    }
  });

  it("does not touch init without method", () => {
    vi.stubEnv(FLAG, "true");
    const init: RequestInit = { body: "{}" };
    expect(applyMethodOverride(init)).toBe(init);
  });
});
