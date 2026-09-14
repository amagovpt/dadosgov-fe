/**
 * LEDG-2431. The gate forwards a ?flash= code to the completion screen, and
 * only codes on its allowlist.
 *
 * That allowlist is a contract between two repositories: the backend picks
 * the string, the gate carries it across its own redirect, and the screen
 * renders it. A code missing from this list is not an error anywhere -- the
 * citizen is simply redirected with the message stripped, and the screen
 * silently repeats the request that was just refused. Nothing fails, nothing
 * logs, and the only symptom is a person stuck on a page that will not
 * explain itself. Hence a test for one Set.
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const replaceMock = vi.fn();
const routerMock = { push: vi.fn(), replace: replaceMock };
let pathnameMock = "/datasets";
let searchParamsMock = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  usePathname: () => pathnameMock,
  useSearchParams: () => searchParamsMock,
}));

let authMock: { isLoading: boolean; pendingRegistration: boolean };
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => authMock,
}));

import CompleteRegistrationGate from "../CompleteRegistrationGate";

let container: HTMLDivElement;
let root: Root;

async function render() {
  await act(async () => {
    root.render(<CompleteRegistrationGate />);
  });
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  pathnameMock = "/datasets";
  searchParamsMock = new URLSearchParams();
  replaceMock.mockClear();
  authMock = { isLoading: false, pendingRegistration: true };
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe("CompleteRegistrationGate", () => {
  it("forwards the registration_association_refused flash to /complete-registration", async () => {
    searchParamsMock = new URLSearchParams("flash=registration_association_refused");
    await render();

    expect(replaceMock).toHaveBeenCalledWith(
      "/complete-registration?flash=registration_association_refused"
    );
  });

  it("still forwards the confirmation-link codes it carried before", async () => {
    searchParamsMock = new URLSearchParams("flash=change_email_expired");
    await render();

    expect(replaceMock).toHaveBeenCalledWith(
      "/complete-registration?flash=change_email_expired"
    );
  });

  it("drops a code that is not on the allowlist", async () => {
    // Anything the screen cannot render is left behind rather than carried to
    // a page that would ignore it.
    searchParamsMock = new URLSearchParams("flash=some_other_flow");
    await render();

    expect(replaceMock).toHaveBeenCalledWith("/complete-registration");
  });

  it("leaves a settled account alone", async () => {
    authMock.pendingRegistration = false;
    searchParamsMock = new URLSearchParams("flash=registration_association_refused");
    await render();

    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("does not redirect the completion screen onto itself", async () => {
    pathnameMock = "/pt/complete-registration";
    await render();

    expect(replaceMock).not.toHaveBeenCalled();
  });
});
