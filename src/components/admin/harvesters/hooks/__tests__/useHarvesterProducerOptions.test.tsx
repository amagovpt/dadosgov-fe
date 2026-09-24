/**
 * The producer field of the harvester wizard has to answer one question:
 * which organizations may *this* user publish a harvester for?
 *
 * The two roles resolve it from different sources, which is the whole point of
 * the hook:
 *
 *  1. A PORTAL ADMIN may create a source for any organization — every udata
 *     `Permission` carries `RoleNeed("admin")` — but `/api/1/me/` only reports
 *     their memberships, so the list must come from `/organizations/suggest/`.
 *  2. ANYONE ELSE picks from their memberships, filtered by the
 *     backend-computed `permissions.harvest` flag, which is exactly what
 *     `POST /harvest/sources/` checks. An org editor has memberships but no
 *     harvest permission, so they get no options at all and must be told why
 *     instead of facing a silently empty select.
 */

import React, { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ptHarvesters from "@/locales/pt/admin-harvesters.json";

const translate = (key: string, options?: Record<string, unknown>): string => {
  const raw = key
    .split(".")
    .reduce<unknown>(
      (acc, part) => (acc as Record<string, unknown> | undefined)?.[part],
      ptHarvesters as unknown,
    );
  if (typeof raw !== "string") return key;
  return raw.replace(/{{(\w+)}}/g, (_, name: string) => String(options?.[name] ?? ""));
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: translate, i18n: { language: "pt" } }),
}));

const useAuthMock = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

const suggestOrganizationsMock = vi.fn();
vi.mock("@/service/api/organizations", () => ({
  suggestOrganizations: (query: string, size: number) =>
    suggestOrganizationsMock(query, size),
}));

import { useHarvesterProducerOptions } from "../useHarvesterProducerOptions";

type HookResult = ReturnType<typeof useHarvesterProducerOptions>;

function suggestion(id: string, name: string) {
  return { id, name, slug: id, logo: null, score: 1 };
}

function membership(id: string, name: string, harvest: boolean) {
  return {
    id,
    name,
    permissions: { edit: harvest, delete: harvest, members: harvest, harvest, private: true },
  };
}

let container: HTMLDivElement;
let root: Root;

// Published from an effect rather than during render, so the probe stays within
// what the React compiler allows. Every helper below awaits `act`, which flushes
// effects, so this always holds the latest committed value.
const probe: { result: HookResult | null } = { result: null };
const latest = () => probe.result as HookResult;

function Probe() {
  const result = useHarvesterProducerOptions();
  useEffect(() => {
    probe.result = result;
  });
  return null;
}

async function render() {
  await act(async () => {
    root.render(<Probe />);
  });
  // Flush the requestAnimationFrame the search effect defers its state to.
  await act(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  });
}

/** Type into the select's search box and let the debounce elapse. */
async function search(query: string) {
  await act(async () => {
    latest().onSearch(query);
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400);
  });
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  suggestOrganizationsMock.mockReset();
  useAuthMock.mockReset();
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  vi.useRealTimers();
});

describe("useHarvesterProducerOptions — portal admin", () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({ user: { organizations: [] }, isAdmin: true, isLoading: false });
  });

  it("offers a searchable list even with no memberships at all", async () => {
    suggestOrganizationsMock.mockResolvedValue([
      suggestion("org-fin", "Portal das Finanças"),
      suggestion("org-dgt", "Direção-Geral do Território"),
    ]);

    await render();

    // The bug in LEDG-2296: this used to be empty, blocking the required field.
    expect(latest().organizations.map((o) => o.name)).toEqual([
      "Portal das Finanças",
      "Direção-Geral do Território",
    ]);
    expect(latest().isSearchable).toBe(true);
    expect(latest().hasNoEligibleOrganization).toBe(false);
    // Preloaded with an empty query so the dropdown is never blank.
    expect(suggestOrganizationsMock).toHaveBeenCalledWith("", 20);
  });

  it("resolves organizations the admin is not a member of", async () => {
    suggestOrganizationsMock.mockImplementation(async (query: string) =>
      query === "camara" ? [suggestion("org-cml", "Câmara Municipal de Lisboa")] : [],
    );

    await render();
    await search("camara");

    expect(latest().organizations.map((o) => o.id)).toContain("org-cml");
    expect(suggestOrganizationsMock).toHaveBeenCalledWith("camara", 20);
  });

  it("keeps the selected organization in the list after a new search", async () => {
    suggestOrganizationsMock.mockImplementation(async (query: string) =>
      query === "camara"
        ? [suggestion("org-cml", "Câmara Municipal de Lisboa")]
        : query === "instituto"
          ? [suggestion("org-ine", "INE")]
          : [],
    );

    await render();
    await search("camara");

    await act(async () => {
      latest().rememberSelection("org-cml");
    });

    await search("instituto");

    // Without the pin, IsolatedSelect would lose the visible selection because
    // the chosen option is no longer among the rendered children.
    const ids = latest().organizations.map((o) => o.id);
    expect(ids).toContain("org-cml");
    expect(ids).toContain("org-ine");
  });

  it("does not fire a request until the query is long enough", async () => {
    suggestOrganizationsMock.mockResolvedValue([]);

    await render();
    suggestOrganizationsMock.mockClear();
    await search("c");

    expect(suggestOrganizationsMock).not.toHaveBeenCalled();
    expect(latest().noResultsText).toBe(
      "Escreva pelo menos 2 caracteres para procurar...",
    );
  });
});

describe("useHarvesterProducerOptions — organization member", () => {
  it("lists only the organizations the backend allows harvesting for", async () => {
    useAuthMock.mockReturnValue({
      user: {
        organizations: [
          membership("org-admin", "Organização que administro", true),
          membership("org-editor", "Organização onde sou editor", false),
        ],
      },
      isAdmin: false,
      isLoading: false,
    });
    suggestOrganizationsMock.mockResolvedValue([suggestion("org-other", "Outra")]);

    await render();

    expect(latest().organizations).toEqual([
      { id: "org-admin", name: "Organização que administro" },
    ]);
    expect(latest().isSearchable).toBe(false);
    expect(latest().hasNoEligibleOrganization).toBe(false);
    // A non-admin must never see the whole catalogue.
    expect(suggestOrganizationsMock).not.toHaveBeenCalled();
  });

  it("reports the blocking state for an editor with no harvestable organization", async () => {
    useAuthMock.mockReturnValue({
      user: { organizations: [membership("org-editor", "Organização onde sou editor", false)] },
      isAdmin: false,
      isLoading: false,
    });

    await render();

    expect(latest().organizations).toEqual([]);
    expect(latest().hasNoEligibleOrganization).toBe(true);
  });

  it("stays quiet while the session is still loading", async () => {
    useAuthMock.mockReturnValue({ user: null, isAdmin: false, isLoading: true });

    await render();

    // The warning card must not flash before /auth/me has answered.
    expect(latest().hasNoEligibleOrganization).toBe(false);
  });
});
