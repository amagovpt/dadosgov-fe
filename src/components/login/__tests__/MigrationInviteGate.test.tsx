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

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: translate }),
  // LEDG-2564 also reached for <Trans>. The real one interpolates components
  // into the translated string; the tests assert on text, and the <b> tags it
  // injects do not change textContent -- so resolving the key is faithful
  // enough and keeps the assertions about copy, not markup.
  Trans: ({ i18nKey }: { i18nKey: string }) => translate(i18nKey),
}));

const useAuth = vi.fn();
vi.mock("@/context/AuthContext", () => ({ useAuth: () => useAuth() }));

const dismissMigrationInvite = vi.fn();
vi.mock("@/service/api/migration", () => ({
  dismissMigrationInvite: () => dismissMigrationInvite(),
}));

// Spread the real module rather than replacing it: isOnFlowRoute lives there
// too, and a mock that lists exports by hand goes stale the moment one is
// added -- which is the defect this ticket is fixing, in miniature.
vi.mock("../loginUtils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../loginUtils")>()),
  submitSamlForm: vi.fn(),
}));

// LEDG-2564 gave the gate a router, and this file never mocked next/navigation
// at all -- the real useRouter throws "invariant expected app router to be
// mounted" outside an app router, so every test here died on mount.
// The default is deliberately NOT a flow route: every test written before
// LEDG-2571 assumed an ordinary page, and a flow route here would make them
// pass for the wrong reason.
let pathname = "/pt/datasets";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ locale: "pt" }),
  usePathname: () => pathname,
}));

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
  pathname = "/pt/datasets";
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

    expect(text).toContain(ptLogin.MigrationInviteSection.title);
    expect(text).not.toContain(PAGINA);
  });

  it("gives the page back once it is dismissed, and records the date", async () => {
    render();
    await clickButton(ptLogin.MigrationInviteSection.skip);

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
    await clickButton(ptLogin.MigrationInviteSection.skip);

    expect(container.textContent).toContain(PAGINA);
    expect(container.textContent).not.toContain(ptLogin.MigrationInviteSection.title);
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

  it("says the linking is optional, and names the way out by its button", () => {
    // A screen has no notice to close, so it points at the button it actually
    // shows. LEDG-2564 rewrote this copy and renamed that button; the rule
    // survives the rewording -- somebody reading the screen must be told the
    // linking is optional and how to decline.
    const text = render();

    expect(text).toContain("facultativa");
    expect(text).toContain(ptLogin.MigrationInviteSection.skip);
  });

  /**
   * 🚩 LEDG-2571, and the check that was missing from the day this gate was
   * written. Somebody on the invite screen pressed "Associar", authenticated
   * with the identity provider, and came back to /migrate-account -- where
   * this gate drew the invite over the page, so they saw the screen they had
   * just left and could never reach the confirmation step. The flow was
   * unreachable while the invite was on.
   *
   * Asserted on the PAGE being there rather than on the invite's copy: the
   * wording belongs to whoever writes the invite, the rule does not.
   */
  describe("the pages that ARE the linking flow", () => {
    const FLOW_PATHS = [
      "/pt/migrate-account",
      "/pt/complete-registration",
      "/pt/login",
      "/pt/loginregister",
      "/pt/register",
      "/pt/reset-password",
    ];

    it.each(FLOW_PATHS)("hands %s straight through, invite or not", (path) => {
      pathname = path;
      useAuth.mockReturnValue({ migrationInvite: true, isLoading: false, refresh: vi.fn() });

      act(() => {
        root.render(
          <MigrationInviteGate>
            <p data-testid="the-page">a página</p>
          </MigrationInviteGate>
        );
      });

      expect(container.querySelector('[data-testid="the-page"]')).not.toBeNull();
    });

    it("still covers an ordinary page, which is what it is for", () => {
      pathname = "/pt/datasets/algum-conjunto";
      useAuth.mockReturnValue({ migrationInvite: true, isLoading: false, refresh: vi.fn() });

      act(() => {
        root.render(
          <MigrationInviteGate>
            <p data-testid="the-page">a página</p>
          </MigrationInviteGate>
        );
      });

      expect(container.querySelector('[data-testid="the-page"]')).toBeNull();
    });
  });
});
