/**
 * LEDG-2517: the linking invite is the backend's answer for this account, and
 * the context only carries it.
 *
 * 🚨 The invariant is the one LEDG-2432 was a regression against: the frontend
 * read a migration flag, assumed its value, and removed the sign-in form from
 * production. Nothing observable in a rendered page distinguishes "the backend
 * told us" from "we guessed", so the guard for that reads source
 * (migration-flag-guard.test.ts). What THIS file pins is the other half: the
 * value the backend sends is the value the app uses, and a backend that says
 * nothing produces no invite.
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchCurrentUser = vi.fn();
vi.mock("@/service/api/auth", () => ({
  fetchCurrentUser: () => fetchCurrentUser(),
}));

import { AuthProvider, useAuth } from "../AuthContext";

let container: HTMLDivElement;
let root: Root;

function Probe() {
  const { migrationInvite } = useAuth();
  return React.createElement("span", { id: "invite" }, String(migrationInvite));
}

async function renderWith(user: unknown): Promise<string> {
  fetchCurrentUser.mockResolvedValue(user);
  await act(async () => {
    root.render(React.createElement(AuthProvider, null, React.createElement(Probe)));
  });
  return container.querySelector("#invite")?.textContent ?? "";
}

const BASE = { id: "1", slug: "u", first_name: "M", last_name: "S" };

describe("the linking invite comes from the backend and nowhere else", () => {
  beforeEach(() => {
    fetchCurrentUser.mockReset();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("offers the invite when the backend says so", async () => {
    expect(await renderWith({ ...BASE, migration_invite: true })).toBe("true");
  });

  it("does not offer it when the backend says not to", async () => {
    expect(await renderWith({ ...BASE, migration_invite: false })).toBe("false");
  });

  it("does not offer it when the backend says nothing at all", async () => {
    // An older backend omits the field entirely, and no invite is the correct
    // behaviour then. The alternative -- guessing from the rest of the user
    // object ("no identity? then invite!") -- is the regression this whole
    // design exists to prevent.
    expect(await renderWith({ ...BASE })).toBe("false");
  });

  it("does not offer it when there is no session at all", async () => {
    expect(await renderWith(null)).toBe("false");
  });
});
