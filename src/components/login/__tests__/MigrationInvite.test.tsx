/**
 * LEDG-2517: the optional invitation to link a CMD/eIDAS identity.
 *
 * What these tests pin is the "optional" part, because that is what the notice
 * promises and what is easiest to break: it shows only when the BACKEND says
 * so, it can be dismissed, dismissing does not sign anybody out, and the copy
 * says what the person needs before clicking -- that it is optional, that the
 * account stays the same account, that linking only works on an identity
 * nobody else holds, and that somebody who already has two accounts can only
 * move datasets today.
 *
 * The banner is the design-system CardExpandable: a one-line summary, and the
 * whole invitation -- copy AND actions -- behind "Saber mais", in a native
 * <details>. Its body is always in the DOM, so "on screen" here means outside
 * a closed <details> (see `visibleText`), not "in textContent".
 *
 * The invariant that the decision is not derived here is guarded separately,
 * by reading source (migration-flag-guard.test.ts): nothing observable in a
 * rendered page distinguishes "the backend told us" from "we guessed".
 */

import { readFileSync } from "node:fs";
import path from "node:path";

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

const copy = ptLogin.MigrationInviteSection;

// SAML/reCAPTCHA come from the container environment via RuntimeConfigProvider.
const runtimeConfig = vi.hoisted(() => ({ samlEnabled: false, recaptchaSiteKey: "" }));
vi.mock("@/providers/RuntimeConfigProvider", () => ({ useRuntimeConfig: () => runtimeConfig }));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: translate }),
  // LEDG-2564 also reached for <Trans>. The real one interpolates components
  // into the translated string; resolving the key keeps the assertions about
  // copy, not markup (the <b> tags stay in as literal text, on both sides).
  Trans: ({ i18nKey }: { i18nKey: string }) => translate(i18nKey),
}));

const pathname = vi.fn(() => "/pt");
// One router for every render, as in Next.
const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => pathname(),
  useRouter: () => router,
  useParams: () => ({ locale: "pt" }),
}));

const useAuth = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => useAuth(),
}));

const dismissMigrationInvite = vi.fn();
vi.mock("@/service/api/migration", () => ({
  dismissMigrationInvite: () => dismissMigrationInvite(),
}));

const submitSamlForm = vi.fn();
// Spread the real module: isOnFlowRoute now lives there too, and the banner
// imports it.
vi.mock("../loginUtils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../loginUtils")>()),
  submitSamlForm: (endpoint: string) => submitSamlForm(endpoint),
}));

import { MigrationInvite } from "../MigrationInvite";

let container: HTMLDivElement;
let root: Root;

function findButton(label: string) {
  return Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent?.trim() === label
  );
}

/** What a reader sees: everything except the body of a closed <details>. */
function visibleText(): string {
  const clone = container.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("details:not([open]) > :not(summary)").forEach((el) => el.remove());
  return clone.textContent ?? "";
}

function isOpen(): boolean {
  return container.querySelector("details")?.open ?? false;
}

/** Toggle the invitation open or closed through its "Saber mais" summary. */
async function toggle() {
  const summary = Array.from(container.querySelectorAll("summary")).find(
    (s) => s.textContent?.trim() === ptLogin.migrationInvite.bannerMore
  );
  expect(summary, "summary not found: Saber mais").toBeDefined();
  await act(async () => {
    summary!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 }));
  });
}

function renderInvite() {
  act(() => {
    root.render(React.createElement(MigrationInvite));
  });
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

function remount() {
  act(() => root.unmount());
  container.remove();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
}

describe("the optional CMD/eIDAS linking invite", () => {
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

    useAuth.mockReturnValue({ migrationInvite: false, migrationLinkAvailable: true, refresh: vi.fn() });
    pathname.mockReturnValue("/pt");
    dismissMigrationInvite.mockResolvedValue({ dismissed: true });
    submitSamlForm.mockResolvedValue(null);
    runtimeConfig.samlEnabled = true;
    window.sessionStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  it("renders nothing while the backend's answer is still in flight", () => {
    // Hydration, not looks: /me is fetched in the browser, so the server
    // renders nothing. A client that answered before React hydrated would
    // render the notice into HTML that never had it, React would report a
    // mismatch and throw the tree away -- which is what the dev server
    // reported on the first real page load.
    useAuth.mockReturnValue({ migrationInvite: true, isLoading: true, refresh: vi.fn() });
    renderInvite();
    expect(container.textContent).toBe("");
  });

  it("appears on the homepage and nowhere else", () => {
    // 🚩 The reminder stays at home. The full screen reaches the citizen every
    // eight days wherever they are, and it carries the whole invitation;
    // repeating a banner above every page in between is how a notice becomes
    // wallpaper. The cost -- somebody following a link straight to a dataset
    // does not see it that visit -- is the trade, and it is deliberate.
    for (const home of ["/pt", "/en", "/pt/"]) {
      pathname.mockReturnValue(home);
      renderInvite();
      expect(container.textContent, `expected the banner on ${home}`).toContain(copy.title);
    }

    for (const elsewhere of ["/pt/datasets", "/en/organizations", "/pt/datasets/abc"]) {
      pathname.mockReturnValue(elsewhere);
      renderInvite();
      expect(container.textContent, `expected nothing on ${elsewhere}`).toBe("");
    }
  });

  it("shows one line, not the whole invitation, until it is opened", async () => {
    // The full screen carries the whole invitation every eight days. Repeating
    // all of it on every visit in between is how a notice stops being read at
    // all.
    renderInvite();

    expect(isOpen()).toBe(false);
    expect(visibleText()).toContain(copy.title);
    expect(visibleText()).toContain(copy.shortDescription);
    expect(visibleText()).not.toContain(copy.longDescription);
    expect(visibleText()).not.toContain(copy.otherAccount.description);

    await toggle();
    expect(isOpen()).toBe(true);
    expect(visibleText()).toContain(copy.longDescription);
  });

  it("keeps the condition that costs a wasted round-trip exactly one click away", async () => {
    // 🚩 The one sentence the shortening must not lose. Linking only works on
    // an identity no other account holds; somebody who does not know that
    // travels to the IdP and is refused at the very end, after authenticating.
    //
    // Asserted as ONE CLICK, not as present-in-the-file: a sentence that needs
    // two steps to reach is a sentence people meet after the trip, not before.
    renderInvite();
    expect(visibleText()).not.toContain(copy.longDescription);

    await toggle();

    expect(visibleText()).toContain(copy.longDescription);
  });

  it("closes again, so the banner does not stay long once it has been read", async () => {
    renderInvite();
    await toggle();
    await toggle();

    expect(isOpen()).toBe(false);
    expect(visibleText()).not.toContain(copy.longDescription);
    expect(visibleText()).toContain(copy.shortDescription);
  });

  it("offers the three actions one click away, all in the same place", async () => {
    // The redesign put the actions inside the expandable, next to the copy
    // that explains them: the person reads before they act.
    renderInvite();
    await toggle();

    for (const label of [copy.linkCmd, copy.linkEidas, copy.skip]) {
      expect(findButton(label), `button not found: ${label}`).toBeDefined();
      expect(visibleText()).toContain(label);
    }
  });

  it("says up front that linking only works on an identity nobody else holds", async () => {
    // The condition that most invites misreading. Somebody whose CMD already
    // belongs to another account is refused at the END of the round-trip --
    // saying it here saves the trip, and saves them believing it worked.
    renderInvite();
    await toggle();
    expect(visibleText()).toContain(copy.longDescription);
    expect(copy.longDescription).toContain("ainda não estiver ligada a outra conta");
  });

  it("renders nothing on the pages that ARE the linking flow", () => {
    // Found on screen, not by a test: the notice is mounted in the public
    // layout, and /migrate-account is a public page -- so somebody halfway
    // through the association was still being invited to start it, with a
    // dismiss button beside it. It reads as "the first step did not work",
    // and those buttons would have restarted the flow from scratch.
    for (const route of [
      "/pt/migrate-account",
      "/en/complete-registration",
      // 🚩 And /login, which is where a refusal lands. Without it the screen
      // says "Associe a sua conta" directly above "Não foi possível associar",
      // and the buttons repeat the round-trip that just failed. The notice
      // gets there because the remember-me cookie keeps /me answering after
      // the refusal logged the session out.
      "/pt/login",
      "/pt/register",
      "/pt/reset-password",
      "/pt/loginregister",
    ]) {
      pathname.mockReturnValue(route);
      renderInvite();
      expect(container.textContent, `still invited on ${route}`).toBe("");
    }
  });

  it("stays hidden while the full screen is the one showing", () => {
    // 🚩 The three states are disjoint, and this is the seam. migrationInvite
    // true is the LOUD state -- never dismissed, or dismissed eight days ago or
    // more -- and MigrationInviteGate owns it, replacing the page. Reading that
    // field here, as this did before the full screen existed, would put both on
    // screen at once.
    useAuth.mockReturnValue({
      migrationInvite: true,
      migrationLinkAvailable: true,
      refresh: vi.fn(),
    });
    renderInvite();
    expect(container.textContent).toBe("");
  });

  it("renders nothing when the backend is not inviting this account", () => {
    useAuth.mockReturnValue({ migrationInvite: false, migrationLinkAvailable: false, refresh: vi.fn() });
    renderInvite();
    expect(container.textContent).toBe("");
  });

  it("says the invite is optional", async () => {
    renderInvite();
    await toggle();
    expect(visibleText()).toContain(copy.longDescription);
    expect(copy.longDescription).toContain("Esta associação é facultativa.");
  });

  it("says that the linked account stays the same account", async () => {
    // The invite is worthless if it reads as "start again elsewhere". What it
    // offers is one account reachable two ways.
    renderInvite();
    await toggle();
    expect(visibleText()).toContain(copy.longDescription);
    expect(copy.longDescription).toContain("a mesma conta e os mesmos dados");
  });

  it("tells somebody who already has two accounts what they can and cannot do", async () => {
    // Linking does not merge. Today only datasets can be moved -- reuses have
    // the logic and no button, APIs have nothing (LEDG-2520) -- so the notice
    // says so instead of leaving them hunting for it.
    renderInvite();
    await toggle();
    expect(visibleText()).toContain(copy.otherAccount.title);
    expect(visibleText()).toContain(copy.otherAccount.description);
    expect(copy.otherAccount.description).toContain("não junta contas");
    expect(copy.otherAccount.description).toContain("conjuntos de dados");
  });

  it("starts the CMD link through the route that accepts an authenticated caller", async () => {
    // NOT /saml/login: that one is @anonymous_user_required, and the person
    // reading this notice signed in with a password minutes ago.
    renderInvite();
    await toggle();
    await clickButton(copy.linkCmd);
    expect(submitSamlForm).toHaveBeenCalledWith("/saml/link/start");
  });

  it("starts the eIDAS link through its own authenticated route", async () => {
    renderInvite();
    await toggle();
    await clickButton(copy.linkEidas);
    expect(submitSamlForm).toHaveBeenCalledWith("/saml/eidas/link/start");
  });

  it("never touches sessionStorage without checking for a window first", () => {
    // 🚩 A source check, and deliberately so. This component is "use client"
    // and is STILL rendered on the server, where the hooks run and
    // sessionStorage does not exist -- an unguarded read takes the whole page
    // down. jsdom always has a window, so no behavioural test in this suite
    // can tell the two apart; only the source can.
    //
    // Same reasoning as the raw-HTML-sink guard and migration-flag-guard: when
    // the invariant is about what the code must NOT do in an environment the
    // tests do not run in, read the source.
    const source = readFileSync(
      path.join(process.cwd(), "src/components/login/MigrationInvite.tsx"),
      "utf8"
    );

    const accesses = [...source.matchAll(/sessionStorage/g)].length;
    const guards = [...source.matchAll(/typeof window === "undefined"/g)].length;

    expect(accesses).toBeGreaterThan(0);
    expect(guards, "every sessionStorage helper needs its own window guard").toBe(2);
  });

  it("hides without sending anything to the server", async () => {
    // 🚩 The decision this ticket carries. The date in extras belongs to the
    // full screen alone: it is what buys the eight days of quiet. If the
    // banner wrote it too, closing the banner every day would push the full
    // screen out for ever -- and the full screen is the one that carries the
    // whole invitation.
    renderInvite();
    await toggle();
    await clickButton(copy.skip);

    expect(dismissMigrationInvite).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
    expect(container.textContent).toBe("");
  });

  it("hides and takes the person to help, in their locale, from the two-accounts note", async () => {
    // Localized so the i18n proxy's 307 does not drop the `#anchor`.
    renderInvite();
    await toggle();
    await clickButton(copy.otherAccount.help);

    expect(dismissMigrationInvite).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith("/pt/ajuda-e-contactos#ajuda");
    expect(container.textContent).toBe("");
  });

  it("stays hidden for the rest of the visit", async () => {
    renderInvite();
    await toggle();
    await clickButton(copy.skip);

    // A fresh mount stands in for the next page: the layout persists across
    // client-side navigation, but a reload does not, and "this visit" has to
    // mean both.
    remount();
    renderInvite();

    expect(container.textContent).toBe("");
  });

  it("comes back on the next visit", async () => {
    renderInvite();
    await toggle();
    await clickButton(copy.skip);

    // A new visit is a new session store, which is exactly what closing the
    // browser gives. The reminder returning is what keeps it a door for
    // somebody who changed their mind.
    window.sessionStorage.clear();
    remount();
    renderInvite();

    expect(container.textContent).toContain(copy.title);
  });

  it("disables the linking buttons when SAML is not wired up", () => {
    // The one piece of configuration this tree may read: whether SAML exists
    // at all. Never whether an ACCOUNT should link.
    runtimeConfig.samlEnabled = false;
    renderInvite();
    expect(findButton(copy.linkCmd)?.disabled).toBe(true);
    expect(findButton(copy.linkEidas)?.disabled).toBe(true);
  });
});
