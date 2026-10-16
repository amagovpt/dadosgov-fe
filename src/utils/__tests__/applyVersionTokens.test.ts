import { describe, expect, it } from "vitest";

import { applyVersionTokens, resolveFooterLabel } from "../applyVersionTokens";

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

describe("resolveFooterLabel", () => {
  const BACKEND_REPO = "https://github.com/amagovpt/udata-pt";
  const FRONTEND_REPO = "https://github.com/amagovpt/dadosgov-fe";

  it("corrects a version an editor typed by hand, identifying the link by its repository", () => {
    // The two labels the CMS holds today, verbatim.
    expect(
      resolveFooterLabel("Motor de código aberto : udata (15.0.0)", BACKEND_REPO, versions),
    ).toBe("Motor de código aberto : udata (16.0.0.12)");
  });

  it("appends the version when the label carries none", () => {
    expect(
      resolveFooterLabel(
        "Interface de usuário de data.gov.pt frontend",
        FRONTEND_REPO,
        versions,
      ),
    ).toBe("Interface de usuário de data.gov.pt frontend (1.4.14)");
  });

  it("prefers the placeholder when the label has one", () => {
    expect(
      resolveFooterLabel("udata {backendVersion}", BACKEND_REPO, versions),
    ).toBe("udata 16.0.0.12");
  });

  it("leaves a link to anything else alone", () => {
    expect(resolveFooterLabel("API dos dados.gov", "/recursos/api", versions)).toBe(
      "API dos dados.gov",
    );
    expect(
      resolveFooterLabel("Portal de dados europeu", "https://data.europa.eu", versions),
    ).toBe("Portal de dados europeu");
  });

  it("does not touch a hand-typed version it has nothing better to replace it with", () => {
    const label = "Motor de código aberto : udata (15.0.0)";
    expect(resolveFooterLabel(label, BACKEND_REPO, { backend: null, frontend: null })).toBe(label);
    expect(resolveFooterLabel(label, BACKEND_REPO, undefined)).toBe(label);
  });

  it("survives a card with no href", () => {
    expect(resolveFooterLabel("Sobre nós", undefined, versions)).toBe("Sobre nós");
  });
});
