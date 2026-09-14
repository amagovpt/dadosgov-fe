/**
 * LEDG-2431. The completion screen learned two things: it offers back the
 * address the CMD asserted, and it renders the refusal the association link
 * can come back with.
 *
 * Both are pinned here because the screen had no tests at all, and because
 * the prefill is the one place a value the IdP vouched for lands in a field a
 * person is about to submit as their own. What the assertion proves is the
 * identity, never the mailbox -- so the address must stay editable, the
 * confirmation field must stay empty, and nothing here may look like the
 * address has already been accepted.
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ptLogin from "@/locales/pt/login.json";

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

const replaceMock = vi.fn();
const routerMock = { push: vi.fn(), replace: replaceMock };
let searchParamsMock = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  usePathname: () => "/complete-registration",
  useSearchParams: () => searchParamsMock,
}));

vi.mock("@/components/Shared/BreadcrumbDynamic", () => ({ default: () => null }));

const requestEmailChangeMock = vi.fn();
vi.mock("@/service/api/profile", () => ({
  requestEmailChange: (address: string) => requestEmailChangeMock(address),
}));

let authMock: {
  user: unknown;
  isLoading: boolean;
  pendingRegistration: boolean;
  pendingRegistrationEmail: string | null;
};
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => authMock,
}));

import CompleteRegistrationClient from "../CompleteRegistrationClient";

let container: HTMLDivElement;
let root: Root;

function emailField() {
  return container.querySelector<HTMLInputElement>("#new-email");
}
function confirmField() {
  return container.querySelector<HTMLInputElement>("#new-email-confirm");
}

/** Type into a controlled input the way React sees it. */
async function typeInto(input: HTMLInputElement, value: string) {
  const setValue = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )!.set!;
  await act(async () => {
    setValue.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function render() {
  await act(async () => {
    root.render(<CompleteRegistrationClient />);
  });
}

beforeEach(() => {
  // The design system's Button reads matchMedia on click, and jsdom has no
  // implementation. Nothing here is about responsive behaviour, so a stub
  // that reports "no match" is enough and keeps the click from throwing
  // outside the test's own assertions.
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  searchParamsMock = new URLSearchParams();
  replaceMock.mockClear();
  requestEmailChangeMock.mockReset().mockResolvedValue(undefined);
  authMock = {
    user: { id: "u1" },
    isLoading: false,
    pendingRegistration: true,
    pendingRegistrationEmail: null,
  };
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe("CompleteRegistrationClient", () => {
  it("prefills the email field with the CMD-asserted address and names its origin", async () => {
    authMock.pendingRegistrationEmail = "pedro.nunes@example.org";
    await render();

    expect(emailField()!.value).toBe("pedro.nunes@example.org");
    expect(container.textContent).toContain(translate("completeRegistration.prefillNotice"));

    // The confirmation field stays empty: the address is still read and
    // confirmed by a person. Prefilling both would turn asking twice into
    // asking nothing.
    expect(confirmField()!.value).toBe("");

    // Editable, and the notice goes as soon as it stops describing what is on
    // screen.
    await typeInto(emailField()!, "outro@example.org");
    expect(emailField()!.value).toBe("outro@example.org");
    expect(container.textContent).not.toContain(
      translate("completeRegistration.prefillNotice")
    );

    // Clearing it leaves it cleared: the offer is made once, not re-imposed.
    await typeInto(emailField()!, "");
    expect(emailField()!.value).toBe("");
  });

  it("leaves the screen exactly as it was when no address was asserted", async () => {
    // eIDAS, a CMD assertion carrying no email, and an older backend that does
    // not serve the field at all all arrive here as null.
    await render();

    expect(emailField()!.value).toBe("");
    expect(container.textContent).not.toContain(
      translate("completeRegistration.prefillNotice")
    );
  });

  it("submits what is in the field, prefilled or typed", async () => {
    authMock.pendingRegistrationEmail = "pedro.nunes@example.org";
    await render();

    // Confirmation still has to be typed, which is the point of the field.
    await typeInto(confirmField()!, "pedro.nunes@example.org");
    const submit = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === translate("completeRegistration.submit")
    )!;
    await act(async () => {
      submit.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    });

    expect(requestEmailChangeMock).toHaveBeenCalledWith("pedro.nunes@example.org");
  });

  it("renders the association-refused flash", async () => {
    searchParamsMock = new URLSearchParams("flash=registration_association_refused");
    await render();

    expect(container.textContent).toContain(
      translate("completeRegistration.flash.associationRefused")
    );
  });

  it("ignores a flash code it does not know", async () => {
    searchParamsMock = new URLSearchParams("flash=something_else");
    await render();

    expect(container.textContent).not.toContain("something_else");
  });
});
