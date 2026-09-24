/**
 * LEDG-2517: the optional invitation to link a CMD/eIDAS identity.
 *
 * What these tests pin is the "optional" part, because that is what the notice
 * promises and what is easiest to break: it shows only when the BACKEND says
 * so, it can be dismissed, dismissing does not sign anybody out, and the copy
 * says the three things the person needs before clicking -- one account per
 * person, that linking costs the current session, and that somebody who
 * already has two accounts can only move datasets today.
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

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: translate }),
}));

const pathname = vi.fn(() => "/pt");
vi.mock("next/navigation", () => ({
  usePathname: () => pathname(),
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
vi.mock("../loginUtils", () => ({
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

/**
 * The banner is short now: the whole invitation is one click away, behind
 * "Saber mais". These tests open it first, which is the point -- what the
 * shortening must not do is LOSE anything, and the assertions that follow are
 * what proves it did not.
 */
async function expand() {
  await clickButton(ptLogin.migrationInvite.bannerMore);
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
    process.env.NEXT_PUBLIC_SAML_ENABLED = "true";
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
      expect(container.textContent, `expected the banner on ${home}`).toContain(
        ptLogin.migrationInvite.bannerSummary
      );
    }

    for (const elsewhere of ["/pt/datasets", "/en/organizations", "/pt/datasets/abc"]) {
      pathname.mockReturnValue(elsewhere);
      renderInvite();
      expect(container.textContent, `expected nothing on ${elsewhere}`).toBe("");
    }
  });

  it("shows one line, not the whole invitation, until it is opened", async () => {
    // The full screen carries the whole invitation every eight days. Repeating
    // all six sentences on every page in between is how a notice stops being
    // read at all.
    renderInvite();

    expect(container.textContent).toContain(ptLogin.migrationInvite.bannerSummary);
    expect(container.textContent).not.toContain(ptLogin.migrationInvite.sessionWarning);
    expect(container.textContent).not.toContain(ptLogin.migrationInvite.alreadyTwoDescription);

    await expand();
    expect(container.textContent).toContain(ptLogin.migrationInvite.sessionWarning);
  });

  it("keeps the condition that costs a wasted round-trip exactly one click away", async () => {
    // 🚩 The one sentence the shortening must not lose. Linking only works on
    // an identity no other account holds; somebody who does not know that
    // travels to the IdP and is refused at the very end, after authenticating.
    //
    // Asserted as ONE CLICK, not as present-in-the-file: a sentence that needs
    // two steps to reach is a sentence people meet after the trip, not before.
    renderInvite();
    expect(container.textContent).not.toContain(ptLogin.migrationInvite.onlyIfFree);

    await clickButton(ptLogin.migrationInvite.bannerMore);

    expect(container.textContent).toContain(ptLogin.migrationInvite.onlyIfFree);
  });

  it("closes again, so the banner does not stay long once it has been read", async () => {
    renderInvite();
    await expand();
    await clickButton(ptLogin.migrationInvite.bannerLess);

    expect(container.textContent).not.toContain(ptLogin.migrationInvite.onlyIfFree);
    expect(container.textContent).toContain(ptLogin.migrationInvite.bannerSummary);
  });

  it("offers the three buttons while it is still short", async () => {
    // Shortening the words must not cost the actions: somebody who already
    // knows what this is should be able to act without opening anything.
    renderInvite();

    expect(findButton(ptLogin.migrationInvite.linkCmd)).toBeDefined();
    expect(findButton(ptLogin.migrationInvite.linkEidas)).toBeDefined();
    expect(findButton(ptLogin.migrationInvite.dismiss)).toBeDefined();
  });

  it("says up front that linking only works on an identity nobody else holds", async () => {
    // The condition that most invites misreading. Somebody whose CMD already
    // belongs to another account is refused at the END of the round-trip --
    // saying it here saves the trip, and saves them believing it worked.
    renderInvite();
    await expand();
    expect(container.textContent).toContain(ptLogin.migrationInvite.onlyIfFree);
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

  it("says that the portal allows one account per person", async () => {
    renderInvite();
    await expand();
    expect(container.textContent).toContain(ptLogin.migrationInvite.oneAccount);
  });

  it("says the invite is optional FOR NOW, not optional forever", async () => {
    // "É facultativo" read alone promises it stays that way, and it does not:
    // LEDG-1277 makes authentication mandatory. Saying so before the person
    // decides beats letting them feel misled when it changes.
    renderInvite();
    await expand();
    expect(container.textContent).toContain(ptLogin.migrationInvite.optional);
    expect(ptLogin.migrationInvite.optional).toContain("Por agora");
  });

  it("says that the linked account stays the same account", async () => {
    // The invite is worthless if it reads as "start again elsewhere". What it
    // offers is one account reachable two ways.
    renderInvite();
    await expand();
    expect(container.textContent).toContain(ptLogin.migrationInvite.result);
  });

  it("warns that linking costs the current session, before the click", async () => {
    // The ACS issues a fresh session cookie, so the person is signed out until
    // they finish. Discovering that mid-flow reads as a bug.
    renderInvite();
    await expand();
    expect(container.textContent).toContain(ptLogin.migrationInvite.sessionWarning);
  });

  it("tells somebody who already has two accounts what they can and cannot do", async () => {
    // Linking does not merge. Today only datasets can be moved -- reuses have
    // the logic and no button, APIs have nothing (LEDG-2520) -- so the notice
    // says so instead of leaving them hunting for it.
    renderInvite();
    await expand();
    expect(container.textContent).toContain(ptLogin.migrationInvite.alreadyTwoDescription);
    expect(container.textContent).toContain(ptLogin.migrationInvite.alreadyTwoLimitation);
  });

  it("starts the CMD link through the route that accepts an authenticated caller", async () => {
    // NOT /saml/login: that one is @anonymous_user_required, and the person
    // reading this notice signed in with a password minutes ago.
    renderInvite();
    await clickButton(ptLogin.migrationInvite.linkCmd);
    expect(submitSamlForm).toHaveBeenCalledWith("/saml/link/start");
  });

  it("starts the eIDAS link through its own authenticated route", async () => {
    renderInvite();
    await clickButton(ptLogin.migrationInvite.linkEidas);
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
    await clickButton(ptLogin.migrationInvite.dismiss);

    expect(dismissMigrationInvite).not.toHaveBeenCalled();
    expect(container.textContent).toBe("");
  });

  it("stays hidden for the rest of the visit", async () => {
    renderInvite();
    await clickButton(ptLogin.migrationInvite.dismiss);

    // A fresh mount stands in for the next page: the layout persists across
    // client-side navigation, but a reload does not, and "this visit" has to
    // mean both.
    act(() => root.unmount());
    container.remove();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    renderInvite();

    expect(container.textContent).toBe("");
  });

  it("comes back on the next visit", async () => {
    renderInvite();
    await clickButton(ptLogin.migrationInvite.dismiss);

    // A new visit is a new session store, which is exactly what closing the
    // browser gives. The reminder returning is what keeps it a door for
    // somebody who changed their mind.
    window.sessionStorage.clear();
    act(() => root.unmount());
    container.remove();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    renderInvite();

    expect(container.textContent).toContain(ptLogin.migrationInvite.bannerSummary);
  });

  it("disables the linking buttons when SAML is not wired up", () => {
    // The one piece of configuration this tree may read: whether SAML exists
    // at all. Never whether an ACCOUNT should link.
    process.env.NEXT_PUBLIC_SAML_ENABLED = "false";
    renderInvite();
    expect(findButton(ptLogin.migrationInvite.linkCmd)?.disabled).toBe(true);
    expect(findButton(ptLogin.migrationInvite.linkEidas)?.disabled).toBe(true);
  });
});
