import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { I18nextProvider, useTranslation } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import initTranslations from "@/app/i18n";
import { TranslationsBundle } from "@/providers/TranslationsBundle";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const rootResources = { pt: { common: { hello: "Olá" } } };
const routeResources = { pt: { "admin-logs": { title: "Registos" } } };

function AdminTitle() {
  const { t } = useTranslation("admin-logs");
  return <span>{t("title")}</span>;
}

describe("TranslationsBundle", () => {
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

  it("makes a route namespace available to its children on the first render", async () => {
    const { i18n } = await initTranslations({
      locale: "pt",
      namespaces: ["common"],
      resources: rootResources,
    });

    act(() =>
      root.render(
        <I18nextProvider i18n={i18n}>
          <TranslationsBundle locale="pt" resources={routeResources}>
            <AdminTitle />
          </TranslationsBundle>
        </I18nextProvider>
      )
    );

    expect(container.textContent).toBe("Registos");
  });

  it("extends the shared instance, so popups rendered by root providers see it too", async () => {
    const { i18n } = await initTranslations({
      locale: "pt",
      namespaces: ["common"],
      resources: rootResources,
    });

    act(() =>
      root.render(
        <I18nextProvider i18n={i18n}>
          <TranslationsBundle locale="pt" resources={routeResources}>
            <span />
          </TranslationsBundle>
        </I18nextProvider>
      )
    );

    expect(i18n.t("title", { ns: "admin-logs" })).toBe("Registos");
    expect(i18n.t("hello")).toBe("Olá");
  });

  it("re-adds the bundle to a recreated root instance, as after router.refresh()", async () => {
    const first = await initTranslations({ locale: "pt", namespaces: ["common"], resources: rootResources });
    const second = await initTranslations({ locale: "pt", namespaces: ["common"], resources: rootResources });

    const tree = (i18n: typeof first.i18n) => (
      <I18nextProvider i18n={i18n}>
        <TranslationsBundle locale="pt" resources={routeResources}>
          <AdminTitle />
        </TranslationsBundle>
      </I18nextProvider>
    );

    act(() => root.render(tree(first.i18n)));
    act(() => root.render(tree(second.i18n)));

    expect(second.i18n.hasResourceBundle("pt", "admin-logs")).toBe(true);
    expect(container.textContent).toBe("Registos");
  });
});
