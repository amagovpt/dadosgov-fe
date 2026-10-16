import { describe, expect, it } from "vitest";

import { MIN_BACKEND_VERSION, isOlderThan } from "../compatibility";

describe("isOlderThan", () => {
  it("compares segments as numbers, not as text", () => {
    // The case that makes a string comparison wrong: "9" sorts after "12".
    expect(isOlderThan("16.0.0.9", "16.0.0.12")).toBe(true);
    expect(isOlderThan("16.0.0.12", "16.0.0.9")).toBe(false);
  });

  it("treats a missing segment as zero, so three segments compare with four", () => {
    // The backend carries a Portuguese revision (four segments) and upstream
    // releases have three; both have to line up.
    expect(isOlderThan("16.0.0.12", "16.1.0")).toBe(true);
    expect(isOlderThan("16.1.0", "16.0.0.12")).toBe(false);
    expect(isOlderThan("16.0.0", "16.0.0.1")).toBe(true);
    expect(isOlderThan("16.0.0.0", "16.0.0")).toBe(false);
  });

  it("is false for the same version, however it is spelled", () => {
    expect(isOlderThan("16.0.0.12", "16.0.0.12")).toBe(false);
    expect(isOlderThan("v16.0.0.12", "16.0.0.12")).toBe(false);
    expect(isOlderThan(" 16.0.0.12 ", "16.0.0.12")).toBe(false);
  });

  it("crosses major and minor boundaries", () => {
    expect(isOlderThan("15.1.0", "16.0.0.12")).toBe(true);
    expect(isOlderThan("17.14.0", "16.0.0.12")).toBe(false);
  });

  it("does not throw on a version it cannot parse", () => {
    // The backend reports whatever its installed distribution declares, which
    // has been odd before: a mismatch must not take the server down.
    expect(() => isOlderThan("unknown", "16.0.0.12")).not.toThrow();
    expect(isOlderThan("unknown", "16.0.0.12")).toBe(true);
    expect(isOlderThan("16.0.0.12", "")).toBe(false);
  });
});

describe("MIN_BACKEND_VERSION", () => {
  it("is declared, and declared as a version", () => {
    expect(MIN_BACKEND_VERSION).toBeTruthy();
    expect(MIN_BACKEND_VERSION).toMatch(/^\d+(\.\d+)*$/);
  });
});
