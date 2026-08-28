/**
 * LEDG-2360: the "E-mail e palavra-passe" tab is no longer a password form —
 * it is where a legacy account starts being linked to a CMD or eIDAS identity.
 * These tests pin the copy and the two actions the mockup specifies, and the
 * samlEnabled gate the tab shares with the CMD and eIDAS tabs: without it the
 * only controls on the page would fire a request that cannot succeed.
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ptLogin from "@/locales/pt/login.json";
import enLogin from "@/locales/en/login.json";

const translate = (key: string): string => {
  const raw = key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined,
      ptLogin
    );
  return typeof raw === "string" ? raw : key;
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: translate }),
}));

import { MigrationNotice } from "../MigrationNotice";

let container: HTMLDivElement;
let root: Root;

function findButton(label: string) {
  return Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent?.trim() === label
  );
}

async function render(props: Partial<React.ComponentProps<typeof MigrationNotice>> = {}) {
  await act(async () => {
    root.render(
      <MigrationNotice
        samlEnabled
        isLoading={false}
        error={null}
        onSaml={props.onSaml ?? vi.fn()}
        onEidas={props.onEidas ?? vi.fn()}
        {...props}
      />
    );
  });
  return container.textContent ?? "";
}

beforeEach(() => {
  // jsdom has no matchMedia, and the design-system Button reads it on click.
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("MigrationNotice", () => {
  it("announces the discontinuation and offers both linking actions", async () => {
    const text = await render();

    expect(text).toContain(translate("migration.title"));
    expect(text).toContain(translate("migration.description"));
    expect(findButton(translate("migration.migrateCmd"))).toBeTruthy();
    expect(findButton(translate("migration.migrateEidas"))).toBeTruthy();
  });

  it("offers the support links and the organisation box from the mockup", async () => {
    const text = await render();

    expect(text).toContain(translate("migration.noCmdPrompt"));
    expect(text).toContain(translate("migration.noCmdLink"));
    expect(text).toContain(translate("migration.eidasLearnMore"));
    expect(text).toContain(translate("migration.entityTitle"));

    const hrefs = Array.from(container.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("https://www.autenticacao.gov.pt/cmd-pedido-chave");
    expect(hrefs).toContain("https://www.autenticacao.gov.pt/eidas");
    expect(hrefs).toContain("/ajuda-e-contactos");
  });

  it("starts the matching SAML login for each action", async () => {
    const onSaml = vi.fn();
    const onEidas = vi.fn();
    await render({ onSaml, onEidas });

    for (const [label, spy] of [
      [translate("migration.migrateCmd"), onSaml],
      [translate("migration.migrateEidas"), onEidas],
    ] as const) {
      const button = findButton(label);
      // detail: 1 is load-bearing — the design-system Button ignores clicks
      // with no click count.
      await act(async () => {
        button!.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
      });
      expect(spy).toHaveBeenCalledTimes(1);
    }
  });

  it("disables both actions when SAML is off, leaving no dead control", async () => {
    await render({ samlEnabled: false });

    expect(findButton(translate("migration.migrateCmd"))!.disabled).toBe(true);
    expect(findButton(translate("migration.migrateEidas"))!.disabled).toBe(true);
  });

  it("shows a failed SAML start, which no other control on this tab would", async () => {
    const text = await render({ error: "Autenticação indisponível" });
    expect(text).toContain("Autenticação indisponível");
  });

  it("keeps the pt and en copy in step", () => {
    const keys = (bundle: typeof ptLogin) => Object.keys(bundle.migration).sort();
    expect(keys(ptLogin)).toEqual(keys(enLogin as typeof ptLogin));
  });
});
