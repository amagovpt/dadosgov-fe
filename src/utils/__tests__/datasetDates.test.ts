import { describe, expect, it } from "vitest";

import { getDatasetLastUpdate } from "../datasetDates";
import { formatDateToTimeAgo } from "../formatDate";

describe("getDatasetLastUpdate", () => {
  it("prefers last_update, the date recomputed from the resources", () => {
    expect(
      getDatasetLastUpdate({
        last_update: "2026-09-29T16:38:00Z",
        last_modified: "2026-01-12T11:35:54Z",
        created_at: "2026-01-12T11:35:54Z",
      }),
    ).toBe("2026-09-29T16:38:00Z");
  });

  it("falls back to last_modified when the payload predates the field", () => {
    expect(
      getDatasetLastUpdate({
        last_modified: "2026-01-12T11:35:54Z",
        created_at: "2025-06-01T00:00:00Z",
      }),
    ).toBe("2026-01-12T11:35:54Z");
  });

  it("falls back to created_at as a last resort", () => {
    expect(getDatasetLastUpdate({ created_at: "2025-06-01T00:00:00Z" })).toBe(
      "2025-06-01T00:00:00Z",
    );
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
