/**
 * LEDG-2349: the wizard used to open on a manual choice — "Já possuo uma
 * conta" / "Criar nova conta" — repeating a decision the backend had already
 * taken when the CMD returned. It now consumes that decision and opens on the
 * right step directly. These tests pin the three-way routing, since getting it
 * wrong sends people to the wrong branch of an account-linking flow.
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
}));

const pushMock = vi.fn();
// One stable object, not a fresh one per render. The bootstrap effect depends
// on the router, so handing it a new identity every render re-runs the effect
// after every state change — which silently re-routes the wizard back to the
// step the backend chose, undoing whatever the test just did.
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

const fetchMigrationPendingMock = vi.fn();
const skipMigrationMock = vi.fn();
vi.mock("@/service/api/migration", () => ({
  fetchMigrationPending: () => fetchMigrationPendingMock(),
  searchMigrationAccount: vi.fn(),
  sendMigrationCode: vi.fn(),
  confirmMigration: vi.fn(),
  skipMigration: (email: string) => skipMigrationMock(email),
  resendMigrationConfirmation: vi.fn(),
}));

vi.mock("@/components/Shared/BreadcrumbDynamic", () => ({
  default: () => null,
}));

import MigrateAccountClient from "../MigrateAccountClient";

const CONFIRM_ACCOUNT_TEXT = translate("migration.confirmTitle");
const SEARCH_TEXT = translate("migration.searchTitle");
const ENTER_EMAIL_TEXT = translate("migration.enterEmailDescription");

let container: HTMLDivElement;
let root: Root;

/** Type an address on the enter-email step and submit it. */
async function submitNewEmail(email: string) {
  const input = container.querySelector<HTMLInputElement>("#new-account-email");
  if (!input) throw new Error("not on the enter-email step");
  const setValue = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )?.set;
  await act(async () => {
    setValue?.call(input, email);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

  const create = translate("migration.createAccount");
  const button = Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent?.trim() === create
  );
  if (!button) throw new Error("create-account button not found");
  // detail: 1 is load-bearing. The design-system Button only forwards onClick
  // for events with a click count — a bare MouseEvent, and HTMLElement.click(),
  // both carry detail 0 and are silently ignored.
  await act(async () => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
  });
  // The handler awaits the skip and, on the divert, a second pending read;
  // one microtask turn is not enough to see the end of that chain.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return container.textContent ?? "";
}

async function render(pending: Record<string, unknown>) {
  fetchMigrationPendingMock.mockResolvedValue(pending);
  await act(async () => {
    root.render(<MigrateAccountClient />);
  });
  // Let the bootstrap effect's promise settle.
  await act(async () => {
    await Promise.resolve();
  });
  return container.textContent ?? "";
}

// React only lets act() flush effects and microtasks when the environment
// declares itself as a test one. Without this, act() still renders but does
// not settle the promise chain behind a click, so anything asserted after an
// async handler reads the pre-handler DOM.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// The design-system Button reads matchMedia on click and jsdom has no
// implementation, so any test that actually presses a button dies on an
// uncaught TypeError. Stubbed here rather than in a global setup file, to keep
// the shim next to the tests that need it.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  pushMock.mockClear();
  fetchMigrationPendingMock.mockReset();
  skipMigrationMock.mockReset();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("MigrateAccountClient initial step", () => {
  it("goes straight to the linking branch when one account matched", async () => {
    const text = await render({ pending: true, candidate: true, first_name: "Ana" });

    expect(text).toContain(CONFIRM_ACCOUNT_TEXT);
    expect(text).not.toContain(ENTER_EMAIL_TEXT);
  });

  it("goes straight to account creation when nothing matched", async () => {
    const text = await render({ pending: true, candidate: false, no_match: true });

    expect(text).toContain(ENTER_EMAIL_TEXT);
    expect(text).not.toContain(CONFIRM_ACCOUNT_TEXT);
  });

  it("offers the search when several homonyms matched, rather than assuming no account", async () => {
    // candidate false with no_match false is the ambiguous case: accounts do
    // match the name, but nobody can say which one is theirs. Falling into
    // account creation here would strand people with an existing account.
    const text = await render({ pending: true, candidate: false, no_match: false });

    expect(text).toContain(SEARCH_TEXT);
    expect(text).not.toContain(ENTER_EMAIL_TEXT);
  });

  it("never renders the removed choice step", async () => {
    // Asserting on the old button labels would be vacuous: their locale keys
    // were deleted in the same change, so translate() would fall back to the
    // key path and the assertion could not fail even if the step were still
    // there. Assert instead that every mount lands on one of the three real
    // destinations, which is what "the choice step is gone" actually means.
    const destinations = [CONFIRM_ACCOUNT_TEXT, ENTER_EMAIL_TEXT, SEARCH_TEXT];

    for (const pending of [
      { pending: true, candidate: true },
      { pending: true, candidate: false, no_match: true },
      { pending: true, candidate: false, no_match: false },
    ]) {
      const text = await render(pending);
      expect(destinations.filter((d) => text.includes(d))).toHaveLength(1);
    }
  });

  it("sends the user back to the login when there is no pending migration", async () => {
    await render({ pending: false });

    expect(pushMock).toHaveBeenCalledWith("/login");
  });

  it("explains the pending confirmation instead of bouncing to the login", async () => {
    // A repeat CMD login before following the link lands here: the wizard is
    // over, so pending is false, but silently bouncing to /login would leave
    // the user with no idea why they cannot get in.
    const text = await render({
      pending: false,
      awaiting_confirmation: true,
      email: "t***@example.pt",
    });

    expect(text).toContain(translate("migration.confirmationPendingTitle"));
    expect(text).toContain(translate("migration.resendConfirmation"));
    expect(pushMock).not.toHaveBeenCalled();
  });
});

describe("MigrateAccountClient account creation step", () => {
  const NO_MATCH = { pending: true, candidate: false, no_match: true };

  it("routes an own-legacy-email submission to the linking branch", async () => {
    // LEDG-2351: the address the user types is their own portal account. The
    // backend refuses it as a creation but points it as the candidate, and the
    // wizard has to follow — telling them "already registered" here sends them
    // back to retype an address the server has just resolved.
    const text = await render(NO_MATCH);
    expect(text).toContain(ENTER_EMAIL_TEXT);

    skipMigrationMock.mockResolvedValue({
      success: false,
      candidate_found: true,
      email: "j***@example.pt",
    });
    // The second pending read is the one handleCreateAccount makes after the
    // divert; it has to report the now-pointed candidate, or hasCandidate
    // stays false and the back controls loop the user through the search.
    fetchMigrationPendingMock.mockResolvedValue({
      pending: true,
      candidate: true,
      first_name: "Joana",
      last_name: "Pinto",
    });

    const after = await submitNewEmail("joana@example.pt");

    expect(after).toContain(CONFIRM_ACCOUNT_TEXT);
    expect(after).toContain("j***@example.pt");
    expect(after).not.toContain(translate("migration.errorEmailTaken"));
  });

  it("still creates the account when the address is free", async () => {
    // Criterion 7: the creation branch is untouched for people who really
    // have no account.
    await render(NO_MATCH);

    skipMigrationMock.mockResolvedValue({ success: true, email: "nova@example.pt" });
    const after = await submitNewEmail("nova@example.pt");

    expect(after).toContain(translate("migration.successNewTitle"));
    expect(after).not.toContain(CONFIRM_ACCOUNT_TEXT);
  });

  it("says the account cannot be linked when the address is not claimable", async () => {
    // A taken address with no candidate_found now means exactly one thing:
    // an account holds it that this identity cannot claim. The message has to
    // say that, not point at a step that does not exist.
    await render(NO_MATCH);

    skipMigrationMock.mockRejectedValue(new Error("email_taken"));
    const after = await submitNewEmail("alguem@example.pt");

    expect(after).toContain(translate("migration.errorEmailTaken"));
    expect(after).toContain(ENTER_EMAIL_TEXT);
    expect(after).not.toContain(CONFIRM_ACCOUNT_TEXT);
  });
});
