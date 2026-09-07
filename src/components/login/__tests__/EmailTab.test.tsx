/**
 * LEDG-2432: the "E-mail e palavra-passe" tab shows the sign-in form by default
 * and the migration notice only when the backend says this account has to link
 * to CMD/eIDAS first. 7d5c9b50 collapsed that to the notice alone, on the
 * assumption that migration would be mandatory, which left legacy accounts with
 * no way in while it stays optional.
 *
 * These tests pin the three-way branch, and in particular that the samlEnabled
 * gate survived the prop merge: EmailTab now carries the union of both prop sets,
 * and restoring the ppr version literally would have passed MigrationNotice two
 * props instead of five and silently turned its dead-control gate off.
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

// The recovery branch renders PasswordRecoveryView, which calls
// useGoogleReCaptcha(). The real provider injects a remote script jsdom cannot
// fetch, and none of these tests are about the captcha.
vi.mock("react-google-recaptcha-v3", () => ({
  GoogleReCaptchaProvider: ({ children }: { children: React.ReactNode }) => children,
  useGoogleReCaptcha: () => ({ executeRecaptcha: undefined }),
}));

import { EmailTab } from "../EmailTab";

let container: HTMLDivElement;
let root: Root;

function findButton(label: string) {
  return Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent?.trim() === label
  );
}

/** Click by visible label. detail: 1 is load-bearing — see MigrationNotice.test. */
async function clickButton(label: string) {
  const button = findButton(label);
  if (!button) throw new Error(`button not found: ${label}`);
  await act(async () => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
  });
}

async function render(props: Partial<React.ComponentProps<typeof EmailTab>> = {}) {
  await act(async () => {
    root.render(
      <EmailTab
        samlEnabled
        prefilledEmail=""
        isLoading={false}
        error={null}
        migrationRequired={false}
        onLogin={props.onLogin ?? vi.fn()}
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

describe("EmailTab", () => {
  it("offers the sign-in form by default, which is the whole point of LEDG-2432", async () => {
    const text = await render();

    expect(container.querySelector("#login-email")).toBeTruthy();
    expect(container.querySelector("#login-password")).toBeTruthy();
    expect(findButton(translate("email.submit"))).toBeTruthy();
    // The migration notice is a branch, not the tab's only content.
    expect(text).not.toContain(translate("migration.title"));
  });

  it("swaps the form for password recovery and back", async () => {
    await render();

    await clickButton(translate("email.recoverPassword"));
    expect(container.querySelector("#login-email")).toBeNull();
    expect(container.textContent).toContain(translate("recovery.title"));

    await clickButton(translate("recovery.back"));
    expect(container.querySelector("#login-email")).toBeTruthy();
  });

  it("shows the migration notice when the backend required it, not the form", async () => {
    const text = await render({ migrationRequired: true });

    expect(text).toContain(translate("migration.title"));
    expect(findButton(translate("migration.migrateCmd"))).toBeTruthy();
    expect(container.querySelector("#login-email")).toBeNull();
  });

  it("keeps the samlEnabled gate through the prop merge", async () => {
    // The regression this guards: ppr's EmailTab passed MigrationNotice two
    // props, so a literal restore would leave samlEnabled undefined and both
    // linking buttons enabled with nothing behind them.
    await render({ migrationRequired: true, samlEnabled: false });

    expect(findButton(translate("migration.migrateCmd"))!.disabled).toBe(true);
    expect(findButton(translate("migration.migrateEidas"))!.disabled).toBe(true);
  });

  it("hands the typed credentials to onLogin", async () => {
    const onLogin = vi.fn();
    await render({ onLogin });

    const setValue = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;
    for (const [selector, value] of [
      ["#login-email", "joana@example.pt"],
      ["#login-password", "S3cretPass!"],
    ] as const) {
      const input = container.querySelector<HTMLInputElement>(selector);
      await act(async () => {
        setValue?.call(input, value);
        input!.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }

    // Accepting the terms is what enables the submit button. Clicking through a
    // disabled button would prove nothing about the path a user actually takes.
    const terms = container.querySelector<HTMLInputElement>("#terms-email");
    await act(async () => {
      terms!.click();
    });

    expect(findButton(translate("email.submit"))!.disabled).toBe(false);
    await clickButton(translate("email.submit"));

    expect(onLogin).toHaveBeenCalledWith("joana@example.pt", "S3cretPass!");
  });

  it("prefills the address the redirect carried", async () => {
    await render({ prefilledEmail: "joana@example.pt" });

    expect(container.querySelector<HTMLInputElement>("#login-email")!.value).toBe(
      "joana@example.pt"
    );
  });
});
