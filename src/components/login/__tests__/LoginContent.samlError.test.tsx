/**
 * LEDG-2517: the login screen says why the previous attempt ended there.
 *
 * 🚩 The backend has always redirected every refused SAML sign-in to
 * /login?saml_error=…, and nothing on this screen read it. The citizen landed
 * on a clean login page with no idea why they were not signed in -- which is
 * how somebody concluded the portal was broken when it had in fact refused
 * them for a reason it could have explained.
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ptLogin from "@/locales/pt/login.json";

const translate = (key: string, fallback?: unknown): string => {
  const raw = key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined,
      ptLogin
    );
  if (typeof raw === "string") return raw;
  return typeof fallback === "string" ? fallback : key;
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: translate }),
}));

const params = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => params,
}));

vi.mock("@/service/api/auth", () => ({ login: vi.fn() }));
vi.mock("@/components/Shared/BreadcrumbDynamic", () => ({ default: () => null }));
vi.mock("react-google-recaptcha-v3", () => ({
  useGoogleReCaptcha: () => ({ executeRecaptcha: undefined }),
  GoogleReCaptchaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import { LoginContent } from "../LoginContent";

let container: HTMLDivElement;
let root: Root;

function renderWith(code: string | null) {
  params.delete("saml_error");
  if (code) params.set("saml_error", code);
  act(() => {
    root.render(React.createElement(LoginContent));
  });
  return container.textContent ?? "";
}

describe("the login screen explains a refused SAML sign-in", () => {
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
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("says the identity already belongs to another account, and that nothing was lost", () => {
    // The reassurance is the load-bearing half: somebody who clicked "link"
    // and ended up back at the login screen needs to know their own account
    // was left alone before anything else.
    const text = renderWith("invite_identity_already_linked");

    expect(text).toContain(ptLogin.samlErrors.invite_identity_already_linked);
    expect(ptLogin.samlErrors.invite_identity_already_linked).toContain("ficou como estava");
    // And that they are not stuck: somebody who has just been refused wants to
    // know whether they broke something before anything else.
    expect(ptLogin.samlErrors.invite_identity_already_linked).toContain(
      "pode continuar a usá-la"
    );

    // 🚩 NO IDENTITIES, masked or otherwise. This text is rendered from a code
    // carried in the query string, which lands in browser history, in Referer
    // headers sent to whatever site the person visits next, and in proxy logs.
    // The rule is written next to _reject_saml_login; this is what keeps it
    // true on the screen that reads it.
    expect(text).not.toMatch(/@[a-z]/i);
  });

  it("says something for a code it does not know", () => {
    // Silence is what this screen used to offer, and it left people assuming
    // the portal was broken. Anything specific beats nothing.
    const text = renderWith("signature_invalid");

    expect(text).toContain(ptLogin.samlErrors.generic);
  });

  it("says nothing when the visit did not come from a refusal", () => {
    const text = renderWith(null);

    expect(text).not.toContain(ptLogin.samlErrors.generic);
    expect(text).not.toContain(ptLogin.samlErrors.invite_identity_already_linked);
  });
});
