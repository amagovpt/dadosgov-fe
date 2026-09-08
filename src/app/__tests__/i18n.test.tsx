/**
 * Tests the real i18next configuration, which nothing covered before: every
 * other test in the repo mocks `react-i18next`, so the interpolation settings
 * themselves were never exercised. That is very likely why dates rendered as
 * `01&#x2F;09&#x2F;2026` on the backoffice log page for as long as they did.
 */

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

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
   * Be clear about what this does and does not cover. It renders its own
   * element, so it pins React's behaviour, not the application's: it would
   * only fail if React stopped escaping text children. It does **not** notice
   * a translation being routed to `dangerouslySetInnerHTML` somewhere in the
   * tree — that invariant is the one the config actually depends on, and it is
   * covered by the test below instead.
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

/**
 * The invariant the disabled escaping actually rests on, pinned where it can
 * fail. Turning off i18next's escaping is safe only while no translation
 * output reaches a sink that interprets markup, and the review of this change
 * established that none does. That is a property of the whole tree, so no
 * amount of rendering in a unit test can hold it — this walks the source
 * instead.
 *
 * `Typograph` is the one allowed occurrence: it declares
 * `dangerouslySetInnerHTML` as a pass-through prop, which is type-legal at all
 * of its call sites even though none uses it today. A new sink anywhere else
 * fails here, and whoever sees this failure has to decide whether the value
 * reaching it can come from `t()` — and sanitise at that call site if it can.
 */
describe("no translation output can reach a raw-HTML sink", () => {
  const ALLOWED = new Set(["src/components/Shared/Generics/Typograph.tsx"]);

  it("keeps dangerouslySetInnerHTML confined to the known pass-through", () => {
    const root = path.resolve(__dirname, "..", "..");

    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.tsx?$/.test(entry.name)) continue;
        const relative = path.relative(path.resolve(root, ".."), full);
        if (ALLOWED.has(relative)) continue;
        // Usage, not mentions: a JSX prop or an object key. Prose about the
        // sink -- this file, the comment in i18n.ts -- is not a sink.
        if (/dangerouslySetInnerHTML\s*[=:]|__html\s*:/.test(readFileSync(full, "utf8"))) {
          offenders.push(relative);
        }
      }
    };
    walk(root);

    expect(offenders).toEqual([]);
  });
});
