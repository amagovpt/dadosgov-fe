import { describe, expect, it } from "vitest";

import { getDatasetLastUpdate } from "../datasetDates";
import { formatDateToTimeAgo } from "../formatDate";

describe("getDatasetLastUpdate", () => {
  it("takes last_update when the document is stale and the resources are not", () => {
    // The reported bug: a harvest that writes no modification date of its own
    // leaves `last_modified` at the creation date while the files move on.
    expect(
      getDatasetLastUpdate({
        last_update: "2026-09-29T16:38:00Z",
        last_modified: "2026-01-12T11:35:54Z",
        created_at: "2026-01-12T11:35:54Z",
      })
    ).toBe("2026-09-29T16:38:00Z");
  });

  it("takes last_modified when a resource was just added and last_update is stale", () => {
    // The mirror case, and the regression a first-match chain would have shipped:
    // add_resource writes through an atomic update that skips clean(), so
    // `last_update` keeps its old value while `last_modified` moves to now.
    expect(
      getDatasetLastUpdate({
        last_update: "2025-09-03T16:30:06Z",
        last_modified: "2026-10-08T16:30:06Z",
        created_at: "2025-01-01T00:00:00Z",
      })
    ).toBe("2026-10-08T16:30:06Z");
  });

  it("is indifferent to which field happens to hold the newest date", () => {
    const newest = "2026-10-08T16:30:06Z";
    const older = "2025-09-03T16:30:06Z";

    expect(getDatasetLastUpdate({ last_update: newest, last_modified: older })).toBe(newest);
    expect(getDatasetLastUpdate({ last_update: older, last_modified: newest })).toBe(newest);
  });

  it("returns the one date it has when the others are missing", () => {
    expect(getDatasetLastUpdate({ last_modified: "2026-01-12T11:35:54Z" })).toBe(
      "2026-01-12T11:35:54Z"
    );
    expect(getDatasetLastUpdate({ created_at: "2025-06-01T00:00:00Z" })).toBe(
      "2025-06-01T00:00:00Z"
    );
  });

  it("ignores values that are not dates instead of ranking them", () => {
    expect(
      getDatasetLastUpdate({ last_update: "not-a-date", last_modified: "2026-01-12T11:35:54Z" })
    ).toBe("2026-01-12T11:35:54Z");
    expect(getDatasetLastUpdate({ last_update: "not-a-date" })).toBeUndefined();
  });

  it("returns undefined rather than an empty string when nothing is set", () => {
    expect(getDatasetLastUpdate({})).toBeUndefined();
    expect(getDatasetLastUpdate({ last_update: null, last_modified: "" })).toBeUndefined();
  });
});

describe("formatDateToTimeAgo", () => {
  it("does not throw on a non-empty string that is not a date", () => {
    // date-fns raises RangeError here, which used to take the whole render down.
    expect(() => formatDateToTimeAgo("not-a-date")).not.toThrow();
    expect(formatDateToTimeAgo("not-a-date")).toBe("Desconhecido");
    expect(formatDateToTimeAgo("not-a-date", "en")).toBe("Unknown");
  });

  it("still reports unknown for an absent date", () => {
    expect(formatDateToTimeAgo(undefined)).toBe("Desconhecido");
    expect(formatDateToTimeAgo(null)).toBe("Desconhecido");
  });

  it("still formats a valid date", () => {
    expect(formatDateToTimeAgo(new Date().toISOString())).not.toBe("Desconhecido");
  });
});
