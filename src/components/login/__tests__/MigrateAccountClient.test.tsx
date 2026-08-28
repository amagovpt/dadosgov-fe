/**
 * LEDG-2349 removed the manual "Já possuo uma conta" / "Criar nova conta"
 * choice; LEDG-2360 removes the three screens that still stood between the
 * CMD return and the credentials the user is asked for — "is this yours?", the
 * account search, and the choice of proof. What is left is: type the account's
 * email and password, then follow the link that gets mailed to it.
 *
 * These tests pin the routing and the fact that no step ends authenticated,
 * since getting either wrong misroutes an account-linking flow or claims a
 * session that does not exist.
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ptLogin from "@/locales/pt/login.json";
import enLogin from "@/locales/en/login.json";

// Interpolates, because the provider name is now part of the copy on every
// screen: without it these tests could not tell "Associar conta à Chave Móvel
// Digital" from "Associar conta à Autenticação Europeia".
const translate = (key: string, vars?: Record<string, unknown>): string => {
  const raw = key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined,
      ptLogin
    );
  if (typeof raw !== "string") return key;
  return raw.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(vars?.[name] ?? ""));
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: translate }),
}));

const pushMock = vi.fn();
const replaceMock = vi.fn();
// One stable object, not a fresh one per render. The bootstrap effect depends
// on the router, so handing it a new identity every render re-runs the effect
// after every state change — which silently re-routes the wizard back to the
// step the backend chose, undoing whatever the test just did.
const routerMock = { push: pushMock, replace: replaceMock };
// Mutable so a test can arrive with a ?flash= the way the backend redirect
// does; stable identity for the same reason as the router.
let searchParamsMock = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  usePathname: () => "/migrate-account",
  useSearchParams: () => searchParamsMock,
}));

const fetchMigrationPendingMock = vi.fn();
const skipMigrationMock = vi.fn();
const sendMigrationLinkMock = vi.fn();
const confirmMigrationMock = vi.fn();
vi.mock("@/service/api/migration", () => ({
  fetchMigrationPending: () => fetchMigrationPendingMock(),
  sendMigrationLink: () => sendMigrationLinkMock(),
  confirmMigration: (payload: unknown) => confirmMigrationMock(payload),
  skipMigration: (email: string) => skipMigrationMock(email),
  resendMigrationConfirmation: vi.fn(),
}));

vi.mock("@/components/Shared/BreadcrumbDynamic", () => ({
  default: () => null,
}));

import MigrateAccountClient from "../MigrateAccountClient";

const CMD = translate("migration.providerCmd");
const EIDAS = translate("migration.providerEidas");
const CREDENTIALS_TEXT = translate("migration.signInDescription", { provider: CMD });
const ENTER_EMAIL_TEXT = translate("migration.enterEmailDescription");
const LINK_SENT_TEXT = translate("migration.linkSentTitle");

let container: HTMLDivElement;
let root: Root;

/** Press a button by its visible label. */
async function clickButton(label: string) {
  const button = Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent?.trim() === label
  );
  if (!button) throw new Error(`button not found: ${label}`);
  await act(async () => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

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

let mounted = false;

async function render(pending: Record<string, unknown>) {
  fetchMigrationPendingMock.mockResolvedValue(pending);
  // A fresh mount per call. The bootstrap effect runs once per component
  // instance, so rendering a second payload into the same root leaves the
  // wizard on whatever step the first payload chose — and every assertion
  // about the second one passes without testing anything.
  if (mounted) {
    act(() => root.unmount());
    container.remove();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  }
  mounted = true;
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
  mounted = false;
  pushMock.mockClear();
  replaceMock.mockClear();
  searchParamsMock = new URLSearchParams();
  fetchMigrationPendingMock.mockReset();
  skipMigrationMock.mockReset();
  sendMigrationLinkMock.mockReset();
  confirmMigrationMock.mockReset();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("MigrateAccountClient initial step", () => {
  it("lands on the credentials screen when one account matched", async () => {
    const text = await render({ pending: true, candidate: true, first_name: "Ana" });

    expect(text).toContain(CREDENTIALS_TEXT);
    expect(text).not.toContain(ENTER_EMAIL_TEXT);
  });

  it("lands on the same credentials screen when several homonyms matched", async () => {
    // candidate false with no_match false is the ambiguous case: accounts do
    // match the name, but nobody can say which one is theirs. It used to open a
    // search; the credentials screen answers it directly, because the backend
    // links whichever account the password proves — homonyms included.
    const text = await render({ pending: true, candidate: false, no_match: false });

    expect(text).toContain(CREDENTIALS_TEXT);
    expect(text).not.toContain(ENTER_EMAIL_TEXT);
  });

  it("goes straight to account creation when nothing matched", async () => {
    const text = await render({ pending: true, candidate: false, no_match: true });

    expect(text).toContain(ENTER_EMAIL_TEXT);
    expect(text).not.toContain(CREDENTIALS_TEXT);
  });

  it("never renders a step between the identity and the credentials", async () => {
    // Asserting on the removed screens' labels would be vacuous once their
    // locale keys go. Assert instead that every mount lands on exactly one of
    // the two real destinations, which is what "the steps are gone" means.
    const destinations = [CREDENTIALS_TEXT, ENTER_EMAIL_TEXT];

    for (const pending of [
      { pending: true, candidate: true },
      { pending: true, candidate: false, no_match: true },
      { pending: true, candidate: false, no_match: false },
    ]) {
      const text = await render(pending);
      expect(destinations.filter((d) => text.includes(d))).toHaveLength(1);
    }
  });

  it("names the provider that started the flow, not always the CMD", async () => {
    // Criterion 7: the same screens serve eIDAS. Nothing on this side can
    // infer the provider — both ACS routes converge before the wizard opens.
    const cmd = await render({ pending: true, candidate: true, provider: "cmd" });
    expect(cmd).toContain(translate("migration.linkTitle", { provider: CMD }));
    expect(cmd).not.toContain(EIDAS);

    const eidas = await render({ pending: true, candidate: true, provider: "eidas" });
    expect(eidas).toContain(translate("migration.linkTitle", { provider: EIDAS }));
    expect(eidas).toContain(translate("migration.signInDescription", { provider: EIDAS }));
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

  it("routes an own-legacy-email submission to the credentials screen", async () => {
    // LEDG-2351: the address the user types is their own portal account. The
    // backend refuses it as a creation but points it as the candidate, and the
    // wizard has to follow — telling them "already registered" here sends them
    // back to retype an address the server has just resolved. It now lands on
    // the credentials screen, pre-filled, so only the password is left to give.
    const text = await render(NO_MATCH);
    expect(text).toContain(ENTER_EMAIL_TEXT);

    skipMigrationMock.mockResolvedValue({
      success: false,
      candidate_found: true,
      email: "j***@example.pt",
    });

    const after = await submitNewEmail("joana@example.pt");

    expect(after).toContain(CREDENTIALS_TEXT);
    expect(after).not.toContain(translate("migration.errorEmailTaken"));
    const emailInput = container.querySelector<HTMLInputElement>("#login-email");
    expect(emailInput?.value).toBe("joana@example.pt");
  });

  it("still creates the account when the address is free", async () => {
    // Criterion 7: the creation branch is untouched for people who really
    // have no account.
    await render(NO_MATCH);

    skipMigrationMock.mockResolvedValue({ success: true, email: "nova@example.pt" });
    const after = await submitNewEmail("nova@example.pt");

    expect(after).toContain(translate("migration.successNewTitle"));
    expect(after).not.toContain(CREDENTIALS_TEXT);
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
    expect(after).not.toContain(CREDENTIALS_TEXT);
  });

  it("does not send the user back to a step that is not behind them", async () => {
    // The old copy read "volte atrás para associar a conta existente". There is
    // no back: this step is reached straight off the CMD return, and the way to
    // the linking branch is a link called "Já tenho conta — procurar". Now that
    // a claimable address routes there by itself, this message only ever means
    // the account cannot be linked — in both locales.
    for (const message of [
      ptLogin.migration.errorEmailTaken,
      enLogin.migration.errorEmailTaken,
    ]) {
      expect(message).toBeTruthy();
      expect(message.toLowerCase()).not.toContain("volte atrás");
      expect(message.toLowerCase()).not.toContain("go back");
    }
  });
});

/**
 * LEDG-2357: the linking branch proves ownership of the legacy account with a
 * validation link instead of a 6-digit code. The waiting screen it lands on is
 * the same shape as the account-creation one, and nothing on it is
 * authenticated until the link in the mail is followed.
 */
describe("MigrateAccountClient validation-link step", () => {
  /** Fill the credentials screen and submit it. */
  async function proveByPassword(email = "joana@example.pt", pwd = "S3cretPass!") {
    const setValue = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;
    for (const [selector, value] of [
      ["#login-email", email],
      ["#login-password", pwd],
    ] as const) {
      const input = container.querySelector<HTMLInputElement>(selector);
      if (!input) throw new Error(`not on the credentials step: ${selector}`);
      await act(async () => {
        setValue?.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
    await clickButton(translate("migration.linkAccount", { provider: CMD }));
    return container.textContent ?? "";
  }

  async function reachCredentials() {
    await render({ pending: true, candidate: true, email: "j***@example.pt" });
  }

  it("shows the validation-link screen with the ticket's copy after the proof", async () => {
    confirmMigrationMock.mockResolvedValue({ sent: true });
    await reachCredentials();

    const text = await proveByPassword();

    expect(confirmMigrationMock).toHaveBeenCalledWith({
      method: "password",
      email: "joana@example.pt",
      password: "S3cretPass!",
    });
    expect(text).toContain(LINK_SENT_TEXT);
    expect(text).toContain(translate("migration.linkSentDescription"));
  });

  it("claims no session of its own — the click is what grants one", async () => {
    // The password used to end the flow on a success screen that redirected to
    // an authenticated home page. It no longer links anything, so a success
    // screen here would be a lie.
    confirmMigrationMock.mockResolvedValue({ sent: true });
    await reachCredentials();

    const text = await proveByPassword();

    expect(text).toContain(LINK_SENT_TEXT);
    // The success screen and its redirect are gone, not merely unreachable.
    expect(container.querySelector(".text-green-600")).toBeNull();
  });

  it("holds the resend behind a visible cooldown", async () => {
    confirmMigrationMock.mockResolvedValue({ sent: true });
    await reachCredentials();
    await proveByPassword();

    const resend = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.startsWith(translate("migration.resendLink"))
    );
    expect(resend).toBeTruthy();
    // The send already happened server-side, so the countdown starts at once.
    expect(resend?.textContent).toContain("60s");
    expect(resend?.hasAttribute("disabled")).toBe(true);
  });

  it("keeps a wrong password on the same screen, with the identity intact", async () => {
    // Criterion 4: the user is one typo away from the only screen that can
    // identify their account; bouncing them anywhere would cost the identity.
    confirmMigrationMock.mockRejectedValue(new Error("Invalid credentials"));
    await reachCredentials();

    const text = await proveByPassword("joana@example.pt", "wrong");

    expect(text).toContain(translate("migration.errorInvalidCredentials"));
    expect(text).toContain(CREDENTIALS_TEXT);
    expect(text).not.toContain(LINK_SENT_TEXT);
  });

  it("does not blame the password when it was the send limit", async () => {
    // A correct password can now fail on the send cap. Falling through to
    // "credenciais inválidas" would tell the user their password is wrong.
    confirmMigrationMock.mockRejectedValue(
      new Error("Maximum confirmation sends exceeded")
    );
    await reachCredentials();

    const text = await proveByPassword();

    expect(text).toContain(translate("migration.errorTooManyLinkSends"));
    expect(text).not.toContain(translate("migration.errorInvalidCredentials"));
    expect(text).not.toContain(translate("migration.errorTooManySends"));
  });

  it("does not blame the password when the wizard session is gone", async () => {
    confirmMigrationMock.mockRejectedValue(new Error("No pending migration"));
    await reachCredentials();

    const text = await proveByPassword();

    expect(text).toContain(translate("migration.errorSessionLost"));
    expect(text).not.toContain(translate("migration.errorInvalidCredentials"));
  });

  it("invites the resend in the ticket's words", async () => {
    for (const locale of [ptLogin, enLogin]) {
      expect(locale.migration.resendLink).toBeTruthy();
      expect(locale.migration.resendLink).not.toBe("Reenviar link");
    }
  });

  it("has no trace of the removed code step in either locale", async () => {
    for (const locale of [ptLogin, enLogin]) {
      const migration = locale.migration as Record<string, unknown>;
      for (const key of [
        "sendCode",
        "codeDescription",
        "verifyCodeTitle",
        "verificationCode",
        "resendCode",
        "errorInvalidCode",
        "errorSendCode",
        "errorResendCode",
        // LEDG-2360: the screens between the identity and the credentials.
        "confirmTitle",
        "confirmYes",
        "confirmNo",
        "searchTitle",
        "verifyTitle",
        "sendLink",
        "knowPassword",
        "successTitle",
        "successDescription",
      ]) {
        expect(migration[key]).toBeUndefined();
      }
      expect(migration.linkSentTitle).toBeTruthy();
      expect(migration.linkSentDescription).toBeTruthy();
    }
  });
});

/**
 * LEDG-2357: a visitor arriving from a spent or expired validation link has no
 * wizard session, and the bootstrap effect answers a missing session with a
 * push to /login. These pin that the reason they were sent here survives that.
 */
describe("MigrateAccountClient link-error step", () => {
  async function renderWithFlash(flash: string) {
    searchParamsMock = new URLSearchParams(`flash=${flash}`);
    // Deliberately unset: reaching for it at all would be the bug.
    fetchMigrationPendingMock.mockRejectedValue(new Error("must not be called"));
    await act(async () => {
      root.render(<MigrateAccountClient />);
    });
    await act(async () => {
      await Promise.resolve();
    });
    return container.textContent ?? "";
  }

  it("shows the invalid-link message instead of bouncing to the login", async () => {
    const text = await renderWithFlash("migration_link_invalid");

    expect(text).toContain(translate("migration.flash.linkInvalid"));
    expect(pushMock).not.toHaveBeenCalled();
    expect(fetchMigrationPendingMock).not.toHaveBeenCalled();
  });

  it("says a fresh link is already on its way when the old one expired", async () => {
    const text = await renderWithFlash("migration_link_expired");

    expect(text).toContain(translate("migration.flash.linkExpired"));
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("offers re-authentication as the way out", async () => {
    await renderWithFlash("migration_link_already_done");

    await clickButton(translate("migration.linkErrorAction"));
    expect(pushMock).toHaveBeenCalledWith("/login");
  });

  it("strips the flash from the URL once it has been latched", async () => {
    await renderWithFlash("migration_link_invalid");

    expect(replaceMock).toHaveBeenCalledWith("/migrate-account", { scroll: false });
    // Latched, so the message outlives the strip.
    expect(container.textContent).toContain(translate("migration.flash.linkInvalid"));
  });

  it("ignores an unknown flash and runs the wizard normally", async () => {
    searchParamsMock = new URLSearchParams("flash=something_else");
    const text = await render({ pending: true, candidate: true, email: "j***@example.pt" });

    expect(text).toContain(CREDENTIALS_TEXT);
    expect(fetchMigrationPendingMock).toHaveBeenCalled();
  });
});
