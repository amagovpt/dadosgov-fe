/**
 * Tests the real i18next configuration, which nothing covered before: every
 * other test in the repo mocks `react-i18next`, so the interpolation settings
 * themselves were never exercised. That is very likely why dates rendered as
 * `01&#x2F;09&#x2F;2026` on the backoffice log page for as long as they did.
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import initTranslations from "../i18n";
import adminLogsPt from "@/locales/pt/admin-logs.json";

const resources = { pt: { "admin-logs": adminLogsPt } };

async function translator() {
  const { t } = await initTranslations({
    locale: "pt",
    namespaces: ["admin-logs"],
    resources,
  });
  return t;
}

describe("i18next interpolation", () => {
  it("keeps a date's slashes instead of escaping them to entities", async () => {
    const t = await translator();

    const line = t("summary.updatedAt", { time: "01/09/2026 10:27:06" });

    expect(line).toBe("Atualizado às 01/09/2026 10:27:06");
    expect(line).not.toContain("&#x2F;");
  });

  it("leaves other characters alone too", async () => {
    const t = await translator();

    expect(t("summary.updatedAt", { time: 'a & b < c > d "e" \'f\'' })).toBe(
      'Atualizado às a & b < c > d "e" \'f\''
    );
  });
});

describe("i18next interpolation is still safe to render", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  /**
   * The reason the escaping above can be turned off: React escapes anything it
   * renders as a text child, so a payload interpolated into a translation
   * reaches the DOM as text and never as markup.
   *
   * This asserts on the rendered DOM rather than on the string `t()` returns —
   * asserting the string would only restate the configuration. If React ever
   * stopped escaping, or the value were routed to `dangerouslySetInnerHTML`,
   * the element below would exist and this test would fail.
   */
  it("renders an attack payload as text, never as an element", async () => {
    const t = await translator();
    const payload = '<img src=x onerror="window.__xss = 1">';

    act(() => root.render(<span>{t("summary.updatedAt", { time: payload })}</span>));

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain(payload);
    expect((window as unknown as { __xss?: number }).__xss).toBeUndefined();
  });
});
