/**
 * LEDG-2655, criterion 8. A page that reports the state of the database schema
 * must never let "the backend is unreachable" look like "the schema is fine".
 *
 * This is the only place the distinction can be made: once the fetcher has
 * flattened a failure into an empty answer, no caller can recover it — and the
 * person reading the page is typically checking right after a dump restore,
 * which is the worst possible moment to be reassured by mistake.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchMigrationsAudit } from "../index";

const AUDIT = {
  generated_at: "2026-10-21T10:00:00+00:00",
  total: 2,
  counts: {
    applied: 2,
    not_applied: 0,
    recorded_only: 0,
    recorded_after_failure: 0,
    applied_with_errors: 0,
    failed: 0,
    empty_record: 0,
    orphan: 0,
    legacy: 0,
  },
  anomalies: 0,
  clean: true,
  migrations: [],
};

const ok = (body: unknown) =>
  ({ ok: true, status: 200, json: async () => body }) as Response;

const failed = (status: number) =>
  ({ ok: false, status, statusText: `HTTP ${status}` }) as Response;

let fetchSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fetchSpy = vi.spyOn(globalThis, "fetch");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchMigrationsAudit", () => {
  it("returns the audit the backend sent", async () => {
    fetchSpy.mockResolvedValue(ok(AUDIT));

    const audit = await fetchMigrationsAudit();

    expect(audit?.clean).toBe(true);
    expect(audit?.total).toBe(2);
  });

  it("returns null when the request fails", async () => {
    fetchSpy.mockResolvedValue(failed(500));
    expect(await fetchMigrationsAudit()).toBeNull();
  });

  it("returns null when the request throws", async () => {
    fetchSpy.mockRejectedValue(new Error("network down"));
    expect(await fetchMigrationsAudit()).toBeNull();
  });

  /**
   * 🚩 The pair criterion 8 rests on. A portal with nothing recorded answers
   * with a valid envelope, not with nothing — so "no migrations" and "could
   * not ask" stay two different things all the way to the screen.
   */
  it("keeps an empty schedule distinguishable from a failed request", async () => {
    fetchSpy.mockResolvedValue(ok({ ...AUDIT, total: 0, migrations: [] }));

    const audit = await fetchMigrationsAudit();

    expect(audit).not.toBeNull();
    expect(audit?.total).toBe(0);
  });

  it("refuses the 403 the backend gives a non-administrator", async () => {
    // Not an error to hide: the page is behind the admin guard, so reaching
    // this means something is wrong with the session, not with the schema.
    fetchSpy.mockResolvedValue(failed(403));
    expect(await fetchMigrationsAudit()).toBeNull();
  });

  it("never calls anything but GET", async () => {
    fetchSpy.mockResolvedValue(ok(AUDIT));
    await fetchMigrationsAudit();

    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(init?.method ?? "GET").toBe("GET");
  });
});
