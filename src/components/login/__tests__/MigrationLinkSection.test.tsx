/**
 * LEDG-2517, acceptance criterion 5: somebody who dismissed the invite must be
 * able to come back to it.
 *
 * 🚩 That is the whole reason this component reads `migrationLinkAvailable`
 * and not `migrationInvite`. The second goes false the moment the notice is
 * dismissed -- which is what it is for -- so an entry point built on it would
 * disappear along with the notice, and "Not now" would have closed the door
 * behind itself.
 *
 * The test that matters is the pair: same account, notice hidden, entry point
 * still there.
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

const useAuth = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => useAuth(),
}));

const submitSamlForm = vi.fn();
vi.mock("../loginUtils", () => ({
  submitSamlForm: (endpoint: string) => submitSamlForm(endpoint),
}));

import { MigrationLinkSection } from "../MigrationLinkSection";

let container: HTMLDivElement;
let root: Root;

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

function renderSection() {
  act(() => {
    root.render(React.createElement(MigrationLinkSection));
  });
}

describe("the permanent way back into linking", () => {
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

    useAuth.mockReturnValue({ migrationLinkAvailable: true, migrationInvite: true });
    submitSamlForm.mockResolvedValue(null);
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

  it("stays visible after the notice has been dismissed", () => {
    // The criterion, in one assertion: invite false, way back still open.
    useAuth.mockReturnValue({ migrationLinkAvailable: true, migrationInvite: false });
    renderSection();
    expect(findButton(ptLogin.migrationInvite.linkCmd)).toBeDefined();
  });

  it("renders nothing while the backend's answer is still in flight", () => {
    // Same reason as its sibling: rendering before /me answers makes the
    // server and the client disagree.
    useAuth.mockReturnValue({ migrationLinkAvailable: true, isLoading: true });
    renderSection();
    expect(container.textContent).toBe("");
  });

  it("renders nothing when there is nothing left to link", () => {
    // The account already holds an identity, or the feature is off. The route
    // itself refuses for the same reason, so the two cannot disagree.
    useAuth.mockReturnValue({ migrationLinkAvailable: false, migrationInvite: false });
    renderSection();
    expect(container.textContent).toBe("");
  });

  it("repeats the session warning, because whoever reaches it here never saw the notice", () => {
    renderSection();
    expect(container.textContent).toContain(ptLogin.migrationInvite.sessionWarning);
  });

  it("starts the CMD link through the authenticated route", async () => {
    renderSection();
    await clickButton(ptLogin.migrationInvite.linkCmd);
    expect(submitSamlForm).toHaveBeenCalledWith("/saml/link/start");
  });

  it("starts the eIDAS link through the authenticated route", async () => {
    renderSection();
    await clickButton(ptLogin.migrationInvite.linkEidas);
    expect(submitSamlForm).toHaveBeenCalledWith("/saml/eidas/link/start");
  });
});
