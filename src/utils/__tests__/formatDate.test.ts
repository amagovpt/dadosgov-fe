/**
 * `/api/1/site/home/` sends UTC date-times without an offset. Read as local
 * time, they put the UTC server and a browser in Lisbon an hour apart ("20
 * minutos" vs "1 hora"), which broke hydration on the homepage and took the
 * consent banner down with it.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { formatDateToTimeAgo, formatPortalDate, parseApiDate } from "../formatDate";

describe("parseApiDate", () => {
  it("reads an offset-less date-time as UTC", () => {
    expect(parseApiDate("2026-10-22T16:17:37.809000").toISOString()).toBe(
      "2026-10-22T16:17:37.809Z"
    );
    expect(parseApiDate("2026-10-16T00:00:00").toISOString()).toBe("2026-10-16T00:00:00.000Z");
    expect(parseApiDate("2026-10-16T09:30").toISOString()).toBe("2026-10-16T09:30:00.000Z");
  });

  it("keeps an explicit offset", () => {
    expect(parseApiDate("2026-10-16T13:00:28.744000+00:00").toISOString()).toBe(
      "2026-10-16T13:00:28.744Z"
    );
    expect(parseApiDate("2026-10-16T13:00:28Z").toISOString()).toBe("2026-10-16T13:00:28.000Z");
    expect(parseApiDate("2026-10-16T14:00:00+01:00").toISOString()).toBe(
      "2026-10-16T13:00:00.000Z"
    );
  });

  it("leaves date-only and invalid values to Date", () => {
    expect(parseApiDate("2026-10-16").toISOString()).toBe("2026-10-16T00:00:00.000Z");
    expect(Number.isNaN(parseApiDate("not a date").getTime())).toBe(true);
  });
});

describe("formatPortalDate", () => {
  // Run the suite under different TZ values: the output must not move.
  it("counts the calendar day in Lisbon, not in the runtime timezone", () => {
    // 23:30 UTC on 12 Aug is 00:30 on 13 Aug in Lisbon (WEST, UTC+1).
    expect(formatPortalDate("2026-08-12T23:30:00Z", "dd MMM yyyy")).toBe("13 ago 2026");
    expect(formatPortalDate("2026-08-12T23:30:00.000000", "dd MMM yyyy")).toBe("13 ago 2026");
    // 23:30 UTC in January is still the same day in Lisbon (WET, UTC+0).
    expect(formatPortalDate("2026-01-12T23:30:00Z", "dd MMM yyyy")).toBe("12 jan 2026");
  });

  it("keeps the homepage patterns and locales", () => {
    expect(formatPortalDate("2026-07-29T10:00:00+00:00", "d MM yyyy")).toBe("29 07 2026");
    expect(formatPortalDate("2026-08-13T10:00:00Z", "dd MMM yyyy", "en")).toBe("13 Aug 2026");
  });

  it("returns the fallback for an invalid date", () => {
    expect(formatPortalDate("not a date", "dd MMM yyyy")).toBe("");
    expect(formatPortalDate("not a date", "dd MMM yyyy", "pt", "—")).toBe("—");
  });
});

describe("formatDateToTimeAgo", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("gives the same answer for an offset-less date as for its UTC form", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-22T16:37:37.809Z"));

    expect(formatDateToTimeAgo("2026-10-22T16:17:37.809000")).toBe("20 minutos");
    expect(formatDateToTimeAgo("2026-10-22T16:17:37.809000")).toBe(
      formatDateToTimeAgo("2026-10-22T16:17:37.809Z")
    );
  });
});
