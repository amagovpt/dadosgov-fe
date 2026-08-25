/**
 * LEDG-2326: a suggest call that fails used to return `[]`, exactly like a
 * search that ran and matched nothing. The advanced filters could not tell the
 * two apart, so a backend that was down rendered as "Nenhum resultado
 * encontrado" — the confusion `rethrowControlFlow`'s own docstring describes.
 * Failure is now `null`; an empty match is still `[]`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { suggestFormats } from "@/service/api/datasets";
import { suggestSpatialZones, suggestTags } from "@/service/api/search";

const helpers = [
  { name: "suggestTags", call: () => suggestTags("saude"), payload: [{ text: "saude" }] },
  { name: "suggestFormats", call: () => suggestFormats("csv"), payload: [{ text: "csv" }] },
  {
    name: "suggestSpatialZones",
    call: () => suggestSpatialZones("lisboa"),
    payload: [{ id: "pt:distrito:11", name: "Lisboa" }],
  },
];

describe("suggest helpers distinguish failure from no matches", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  for (const { name, call, payload } of helpers) {
    it(`${name} returns null when the request rejects`, async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
      await expect(call()).resolves.toBeNull();
      // The failure must stay visible in the console for diagnosis.
      expect(errorSpy).toHaveBeenCalled();
    });

    it(`${name} returns null on a non-ok response`, async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, statusText: "Bad Gateway" })
      );
      await expect(call()).resolves.toBeNull();
    });

    it(`${name} returns an empty array when the search matched nothing`, async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
      await expect(call()).resolves.toEqual([]);
    });

    it(`${name} returns the matches on success`, async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
      await expect(call()).resolves.toEqual(payload);
    });
  }
});
