/**
 * LEDG-2547: the invite shown in place of the page, and the page coming back.
 *
 * 🚩 What these tests are really about is that it LETS GO. A redirect to a page
 * of its own was the obvious shape and carried five ways to trap somebody; this
 * renders in place instead, so there is no navigation to loop and no history to
 * walk back into. The test that matters most is the one where the dismissal
 * FAILS: the backend still answers "invite", and the portal has to come back
 * anyway.
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ptLogin from "@/locales/pt/login.json";

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

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: translate }) }));

const useAuth = vi.fn();
vi.mock("@/context/AuthContext", () => ({ useAuth: () => useAuth() }));

const dismissMigrationInvite = vi.fn();
vi.mock("@/service/api/migration", () => ({
  dismissMigrationInvite: () => dismissMigrationInvite(),
}));

vi.mock("../loginUtils", () => ({ submitSamlForm: vi.fn() }));

import { MigrationInviteGate } from "../MigrationInviteGate";

let container: HTMLDivElement;
let root: Root;
const PAGINA = "o conteudo da pagina";

function findButton(label: string) {
  return Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent?.trim() === label
  );
}

// detail: 1 is load-bearing -- the design-system Button ignores clicks with no
// click count, so a plain .click() renders these tests green against a button
// that was never pressed.
async function clickButton(label: string) {
  const button = findButton(label);
  expect(button, `button not found: ${label}`).toBeDefined();
  await act(async () => {
    button!.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
  });
}

function render() {
  act(() => {
    root.render(
      React.createElement(MigrationInviteGate, null, React.createElement("main", null, PAGINA))
    );
  });
  return container.textContent ?? "";
}

describe("the invite shown in place of the page", () => {
  beforeEach(() => {
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
    useAuth.mockReturnValue({ migrationInvite: true, isLoading: false, refresh: vi.fn() });
    dismissMigrationInvite.mockResolvedValue({ dismissed: true });
    process.env.NEXT_PUBLIC_SAML_ENABLED = "true";
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  it("replaces the page while the invite has not been dismissed", () => {
    const text = render();

    expect(text).toContain(ptLogin.migrationInvite.oneAccount);
    expect(text).not.toContain(PAGINA);
  });

  it("gives the page back once it is dismissed, and records the date", async () => {
    render();
    await clickButton(ptLogin.migrationInvite.dismiss);

    expect(dismissMigrationInvite).toHaveBeenCalled();
    expect(container.textContent).toContain(PAGINA);
  });

  it("gives the page back even when recording the date fails", async () => {
    // 🚩 The trap, and the reason this renders in place instead of redirecting.
    // A failed write leaves the backend answering "invite" -- a redirect would
    // fire again on the next page, and again, for ever. Here the release is
    // local, so it holds regardless.
    dismissMigrationInvite.mockRejectedValue(new Error("offline"));
    render();
    await clickButton(ptLogin.migrationInvite.dismiss);

    expect(container.textContent).toContain(PAGINA);
    expect(container.textContent).not.toContain(ptLogin.migrationInvite.oneAccount);
  });

  it("shows the page untouched when the backend is not inviting", () => {
    useAuth.mockReturnValue({ migrationInvite: false, isLoading: false, refresh: vi.fn() });

    expect(render()).toBe(PAGINA);
  });

  it("shows the page while the backend has not answered yet", () => {
    // Hydration, not looks: the server renders the page, so a client that
    // answered before React hydrated would swap it for the invite in HTML that
    // never had it, and React would throw the tree away.
    useAuth.mockReturnValue({ migrationInvite: true, isLoading: true, refresh: vi.fn() });

    expect(render()).toBe(PAGINA);
  });

  it("says the optional line written for a full screen, not the one about closing a notice", () => {
    // A screen has no notice to close. The banner keeps its own wording.
    const text = render();

    expect(text).toContain(ptLogin.migrationInvite.optionalScreen);
    expect(text).not.toContain(ptLogin.migrationInvite.optional);
  });
});
