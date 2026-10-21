/**
 * LEDG-2642: the screen that confirms a password was reset used to invite the
 * person to link a digital identity -- "Já pode usá-la para associar a conta à
 * sua Chave Móvel Digital" -- behind a single button labelled "Associar
 * conta", which in fact navigated to the login page.
 *
 * Copy from when migration was going to be mandatory and resetting a password
 * was a step inside it. It stopped being that; the screen did not follow, and
 * somebody recovering their access read it as being made to link an identity.
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

vi.mock("@/hooks/useLocalizedHref", () => ({
  useLocalizedHref: () => (href: string) => `/pt${href}`,
}));

vi.mock("@/components/Shared/BreadcrumbDynamic", () => ({
  default: () => null,
}));

import { ResetPasswordClient } from "../ResetPasswordClient";
import enLogin from "@/locales/en/login.json";

let container: HTMLDivElement;
let root: Root;
let navigatedTo: string | null = null;

// jsdom does not implement navigation and its own href is not configurable,
// so the whole object is swapped. Same approach as LoginContent.test.tsx.
const originalLocation = window.location;

beforeEach(() => {
  // jsdom has no matchMedia, and the design-system Button reads it on click.
  // Same stub as MigrationInvite.test.tsx.
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

  navigatedTo = null;

  const location = {
    origin: "http://localhost:3000",
    pathname: "/pt/reset-password/tok",
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
    toString: () => "http://localhost:3000/pt/reset-password/tok",
  };
  Object.defineProperty(location, "href", {
    get: () => "http://localhost:3000/pt/reset-password/tok",
    set: (value: string) => {
      navigatedTo = value;
    },
  });
  Object.defineProperty(window, "location", {
    configurable: true,
    value: location,
  });

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation,
  });
  vi.restoreAllMocks();
});

function findButton(label: string) {
  return Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent?.trim() === label
  );
}

/** Drives the component to its success screen through the real submit path. */
async function reachSuccessScreen() {
  vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({ message: "ok" }),
  } as Response);

  await act(async () => {
    root.render(<ResetPasswordClient token="tok" />);
  });

  const inputs = Array.from(container.querySelectorAll("input"));
  const setValue = (el: HTMLInputElement, value: string) => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;
    setter?.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };

  await act(async () => {
    inputs.forEach((input) => setValue(input as HTMLInputElement, "umaPasswordNova1!"));
  });

  const submit = findButton(translate("resetPassword.submit"));
  await act(async () => {
    submit!.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
  });
}

describe("the screen that confirms a password was reset", () => {
  it("sends the person to sign in, which is what its button now says", async () => {
    await reachSuccessScreen();

    const cont = findButton(translate("resetPassword.continueAction"));
    expect(cont, "the success screen did not render its continue button").toBeDefined();

    // detail: 1 is load-bearing -- the design-system Button ignores clicks with
    // no click count, so a plain .click() would pass against a button that was
    // never pressed.
    await act(async () => {
      cont!.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    });

    expect(navigatedTo).toBe("/pt/login");
  });

  it("says the password changed, and nothing about linking anything", async () => {
    await reachSuccessScreen();

    const text = container.textContent ?? "";
    expect(text).toContain(ptLogin.resetPassword.successTitle);
    expect(text).not.toMatch(/Chave M[oó]vel|eIDAS|Autentica[cç][aã]o Europeia|[Aa]ssociar/);
  });
});

/**
 * 🚩 Pins the RULE rather than the sentences, because the sentences are the
 * part that will be rewritten. Until LEDG-2642 this screen told somebody who
 * had just recovered their password to link a digital identity, and offered
 * a single button labelled "Associar conta" that in fact went to the login
 * page -- the copy promised one thing and the button did another.
 *
 * Recovering a password has nothing to do with CMD or eIDAS. Whoever rewrites
 * this copy next may not know that; this test does.
 */
describe("the password reset copy", () => {
  const FORBIDDEN = /Chave M[oó]vel|eIDAS|Autentica[cç][aã]o Europeia|[Aa]ssociar|[Ll]ink your account|[Ll]ink account/;

  it.each([
    ["pt", ptLogin],
    ["en", enLogin],
  ])("never mentions a digital identity in %s", (_locale, bundle) => {
    for (const [key, value] of Object.entries(bundle.resetPassword)) {
      if (typeof value !== "string") continue;
      expect(value, `resetPassword.${key}`).not.toMatch(FORBIDDEN);
    }
  });
});
