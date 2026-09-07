/**
 * LEDG-2432: the migration notice appears because the backend said so, for this
 * account — never because the frontend read a flag. /auth/login answers
 * 403 { message: "migration_required" } after /saml/migration/check, and that
 * answer is the only thing that flips the tab.
 *
 * These are the two states of MIGRATION_MODE_ENABLED as the frontend can
 * legitimately observe them: the backend either returns migration_required or
 * it does not. Reading the flag here is the mistake that removed the form
 * (7d5c9b50), so there is deliberately nothing in these tests that looks at
 * configuration — see migration-flag-guard.test.ts, which pins that.
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

// Stable identity: a fresh object per render re-runs any effect that depends on
// it. Same reason as MigrateAccountClient.test.
const searchParamsMock = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/login",
  useSearchParams: () => searchParamsMock,
}));

// Mock the service module, not global.fetch — the repo's pattern, and it is the
// module boundary the component actually depends on.
const loginMock = vi.fn();
vi.mock("@/service/api/auth", () => ({
  login: (payload: FormData) => loginMock(payload),
}));

vi.mock("@/components/Shared/BreadcrumbDynamic", () => ({
  default: () => null,
}));

vi.mock("react-google-recaptcha-v3", () => ({
  GoogleReCaptchaProvider: ({ children }: { children: React.ReactNode }) => children,
  useGoogleReCaptcha: () => ({ executeRecaptcha: undefined }),
}));

import { LoginContent } from "../LoginContent";

let container: HTMLDivElement;
let root: Root;
/** Where the success path sent the browser, captured from the href setter. */
let navigatedTo: string | null = null;

function findButton(label: string) {
  return Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent?.trim() === label
  );
}

/** Open the email tab and submit credentials through the real form. */
async function signIn(email = "joana@example.pt", password = "S3cretPass!") {
  const emailTab = Array.from(container.querySelectorAll("button, [role='tab']")).find((el) =>
    el.textContent?.trim().includes(translate("tabs.email"))
  );
  if (emailTab) {
    await act(async () => {
      emailTab.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    });
  }

  const setValue = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )?.set;
  for (const [selector, value] of [
    ["#login-email", email],
    ["#login-password", password],
  ] as const) {
    const input = container.querySelector<HTMLInputElement>(selector);
    if (!input) throw new Error(`the sign-in form is not rendered: ${selector}`);
    await act(async () => {
      setValue?.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  const terms = container.querySelector<HTMLInputElement>("#terms-email");
  await act(async () => {
    terms!.click();
  });

  const submit = findButton(translate("email.submit"));
  await act(async () => {
    submit!.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
  });
  return container.textContent ?? "";
}

beforeEach(() => {
  loginMock.mockReset();

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

  // jsdom does not implement navigation, and the success path assigns to
  // window.location.href. Swap the whole object — jsdom's own href is not
  // configurable, so overriding just that property throws.
  //
  // href is a getter that always answers a real absolute URL, with a setter
  // that only records where we were sent. Storing the assigned value instead
  // would break the render that follows it: next/image resolves its src
  // against the page URL, and "/" is not one — CmdTab/EidasTab render images
  // inside the tab set LoginContent mounts.
  navigatedTo = null;
  const location = {
    origin: "http://localhost:3000",
    protocol: "http:",
    host: "localhost:3000",
    hostname: "localhost",
    port: "3000",
    pathname: "/login",
    search: "",
    hash: "",
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
    toString: () => "http://localhost:3000/login",
  };
  Object.defineProperty(location, "href", {
    get: () => "http://localhost:3000/login",
    set: (value: string) => {
      navigatedTo = value;
    },
  });
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: location,
  });

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("LoginContent email sign-in", () => {
  it("shows the migration notice when the backend answers migration_required", async () => {
    loginMock.mockRejectedValue(new Error("migration_required"));

    await act(async () => {
      root.render(<LoginContent />);
    });
    const text = await signIn();

    expect(loginMock).toHaveBeenCalledTimes(1);
    expect(text).toContain(translate("migration.title"));
    // The notice replaces the form; it is not an error on top of it.
    expect(container.querySelector("#login-email")).toBeNull();
    expect(text).not.toContain(translate("errors.loginFailed"));
  });

  it("shows a plain failure as an error, keeping the form to retry in", async () => {
    loginMock.mockRejectedValue(new Error("Credenciais inválidas"));

    await act(async () => {
      root.render(<LoginContent />);
    });
    const text = await signIn();

    expect(text).toContain("Credenciais inválidas");
    expect(text).not.toContain(translate("migration.title"));
    expect(container.querySelector("#login-email")).toBeTruthy();
  });

  it("navigates away on success, with neither notice nor error", async () => {
    loginMock.mockResolvedValue({ message: "ok" });

    await act(async () => {
      root.render(<LoginContent />);
    });
    const text = await signIn();

    expect(loginMock).toHaveBeenCalledTimes(1);
    expect(text).not.toContain(translate("migration.title"));
    expect(navigatedTo).toBe("/");
  });

  it("sends the credentials the user typed, and asks to be remembered", async () => {
    loginMock.mockResolvedValue({ message: "ok" });

    await act(async () => {
      root.render(<LoginContent />);
    });
    await signIn("maria@example.pt", "Outr4Pass!");

    const payload = loginMock.mock.calls[0][0] as FormData;
    expect(payload.get("email")).toBe("maria@example.pt");
    expect(payload.get("password")).toBe("Outr4Pass!");
    expect(payload.get("remember")).toBe("y");
  });
});
