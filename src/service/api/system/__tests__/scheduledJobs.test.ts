/**
 * LEDG-2614, criterion 7: a page that reports what is running must never let
 * "the backend is down" look like "nothing is scheduled". The two draw
 * different screens, and the only place that distinction can be made is here
 * -- once the fetcher has flattened a failure into `[]`, no caller can
 * recover it.
 *
 * The sibling fetchers in this module do degrade to `[]`, deliberately: for a
 * dataset listing an empty page is a tolerable lie. Here it is the lie the
 * ticket is about.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchScheduledJobs, fetchSchedulableJobs } from "../index";

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

describe("fetchScheduledJobs", () => {
  it("returns the jobs the backend sent, as a bare array", async () => {
    // marshal_list_with: no { data, page, total } envelope to unwrap.
    fetchSpy.mockResolvedValue(ok([{ id: "1", name: "count-tags", task: "count-tags" }]));

    const jobs = await fetchScheduledJobs();

    expect(jobs).toHaveLength(1);
    expect(jobs?.[0].name).toBe("count-tags");
  });

  /**
   * 🚩 The pair that criterion 7 rests on. Both of these would be `[]` if this
   * fetcher followed its siblings, and the page could not tell them apart.
   */
  it("returns null when the request fails", async () => {
    fetchSpy.mockResolvedValue(failed(500));
    expect(await fetchScheduledJobs()).toBeNull();
  });

  it("returns null when the request throws", async () => {
    fetchSpy.mockRejectedValue(new Error("network down"));
    expect(await fetchScheduledJobs()).toBeNull();
  });

  it("returns an empty array when there are genuinely no jobs", async () => {
    fetchSpy.mockResolvedValue(ok([]));
    expect(await fetchScheduledJobs()).toEqual([]);
  });

  it("never calls anything but GET", async () => {
    fetchSpy.mockResolvedValue(ok([]));
    await fetchScheduledJobs();

    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(init?.method ?? "GET").toBe("GET");
  });
});

describe("fetchSchedulableJobs", () => {
  it("returns the registered task names", async () => {
    fetchSpy.mockResolvedValue(ok(["harvest", "purge-datasets"]));
    expect(await fetchSchedulableJobs()).toEqual(["harvest", "purge-datasets"]);
  });

  /**
   * Null rather than `[]` for the same reason, and with a sharper edge: an
   * empty list here would mean "the portal registers no tasks at all", which
   * would make every scheduled job look like it runs something unregistered.
   */
  it("returns null when the request fails", async () => {
    fetchSpy.mockResolvedValue(failed(503));
    expect(await fetchSchedulableJobs()).toBeNull();
  });
});
