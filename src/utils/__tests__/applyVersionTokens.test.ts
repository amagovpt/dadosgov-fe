import { describe, expect, it } from "vitest";

import { applyVersionTokens } from "../applyVersionTokens";

const versions = { backend: "16.0.0.12", frontend: "1.4.14" };

describe("applyVersionTokens", () => {
  it("fills each placeholder with the running version", () => {
    expect(applyVersionTokens("Motor de código aberto: udata {backendVersion}", versions)).toBe(
      "Motor de código aberto: udata 16.0.0.12",
    );
    expect(
      applyVersionTokens("Interface de utilizador de dados.gov.pt {frontendVersion}", versions),
    ).toBe("Interface de utilizador de dados.gov.pt 1.4.14");
  });

  it("leaves a label without placeholders untouched", () => {
    // What ships before the CMS text is updated: the old hand-typed label.
    const label = "Motor de código aberto : udata (15.0.0)";
    expect(applyVersionTokens(label, versions)).toBe(label);
  });

  it("drops the placeholder, and the punctuation wrapping it, when the version is unknown", () => {
    const unknown = { backend: null, frontend: null };
    expect(applyVersionTokens("udata ({backendVersion})", unknown)).toBe("udata");
    expect(applyVersionTokens("udata [{backendVersion}]", unknown)).toBe("udata");
    expect(applyVersionTokens("udata: {backendVersion}", unknown)).toBe("udata");
    expect(applyVersionTokens("udata {backendVersion}", unknown)).toBe("udata");
  });

  it("never prints the placeholder or a null when versions are missing entirely", () => {
    const out = applyVersionTokens("udata {backendVersion} / app {frontendVersion}", undefined);
    expect(out).not.toContain("{");
    expect(out).not.toContain("null");
    expect(out).toBe("udata / app");
  });

  it("keeps the spaces inside the surrounding text", () => {
    expect(applyVersionTokens("Motor de código aberto: udata {backendVersion}", undefined)).toBe(
      "Motor de código aberto: udata",
    );
  });

  it("fills one placeholder even when the other is unknown", () => {
    expect(
      applyVersionTokens("udata {backendVersion} / app {frontendVersion}", {
        backend: "16.0.0.12",
        frontend: null,
      }),
    ).toBe("udata 16.0.0.12 / app");
  });
});
