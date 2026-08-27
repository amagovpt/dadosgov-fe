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
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const fetchMigrationPendingMock = vi.fn();
vi.mock("@/service/api/migration", () => ({
  fetchMigrationPending: () => fetchMigrationPendingMock(),
  searchMigrationAccount: vi.fn(),
  sendMigrationCode: vi.fn(),
  confirmMigration: vi.fn(),
  skipMigration: vi.fn(),
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

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  pushMock.mockClear();
  fetchMigrationPendingMock.mockReset();
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
    for (const pending of [
      { pending: true, candidate: true },
      { pending: true, candidate: false, no_match: true },
      { pending: true, candidate: false, no_match: false },
    ]) {
      const text = await render(pending);
      // The two buttons the ticket removed.
      expect(text).not.toContain("Já possuo uma conta");
      expect(text).not.toContain("Criar nova conta");
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
