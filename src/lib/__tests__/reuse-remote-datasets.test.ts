import { describe, expect, it } from "vitest";
import {
  extractRemoteDatasetUrls,
  normalizeRemoteDatasets,
} from "../reuse-remote-datasets";

describe("normalizeRemoteDatasets", () => {
  describe("defensive reads", () => {
    it("returns [] for null extras", () => {
      expect(normalizeRemoteDatasets(null)).toEqual([]);
    });

    it("returns [] for undefined extras", () => {
      expect(normalizeRemoteDatasets(undefined)).toEqual([]);
    });

    it("returns [] when remote_datasets is absent", () => {
      expect(normalizeRemoteDatasets({ other: "field" })).toEqual([]);
    });

    it("returns [] when remote_datasets is not an array (object)", () => {
      expect(normalizeRemoteDatasets({ remote_datasets: { url: "x" } })).toEqual([]);
    });

    it("returns [] when remote_datasets is not an array (string)", () => {
      expect(normalizeRemoteDatasets({ remote_datasets: "not-an-array" })).toEqual([]);
    });

    it("returns [] when remote_datasets is null", () => {
      expect(normalizeRemoteDatasets({ remote_datasets: null })).toEqual([]);
    });

    it("returns [] for an empty array", () => {
      expect(normalizeRemoteDatasets({ remote_datasets: [] })).toEqual([]);
    });
  });

  describe("string[] shape (current backwards-compat)", () => {
    it("maps each string to a { url } entry", () => {
      const result = normalizeRemoteDatasets({
        remote_datasets: ["https://a.com/1.csv", "https://b.com/2.json"],
      });
      expect(result).toEqual([
        { url: "https://a.com/1.csv", title: undefined, description: undefined },
        { url: "https://b.com/2.json", title: undefined, description: undefined },
      ]);
    });

    it("trims surrounding whitespace from URLs", () => {
      const result = normalizeRemoteDatasets({
        remote_datasets: ["  https://a.com/1.csv  "],
      });
      expect(result).toEqual([
        { url: "https://a.com/1.csv", title: undefined, description: undefined },
      ]);
    });

    it("drops empty / whitespace-only strings", () => {
      const result = normalizeRemoteDatasets({
        remote_datasets: ["https://a.com/1.csv", "", "   ", "https://b.com/2.csv"],
      });
      expect(result.map((e) => e.url)).toEqual([
        "https://a.com/1.csv",
        "https://b.com/2.csv",
      ]);
    });
  });

  describe("object[] shape (future PR 2 schema)", () => {
    it("preserves url, title and description", () => {
      const result = normalizeRemoteDatasets({
        remote_datasets: [
          {
            url: "https://a.com/1.csv",
            title: "Dataset A",
            description: "First external dataset",
          },
        ],
      });
      expect(result).toEqual([
        {
          url: "https://a.com/1.csv",
          title: "Dataset A",
          description: "First external dataset",
        },
      ]);
    });

    it("returns undefined title/description when absent", () => {
      const result = normalizeRemoteDatasets({
        remote_datasets: [{ url: "https://a.com/1.csv" }],
      });
      expect(result[0]).toEqual({
        url: "https://a.com/1.csv",
        title: undefined,
        description: undefined,
      });
    });

    it("trims whitespace on url, title and description", () => {
      const result = normalizeRemoteDatasets({
        remote_datasets: [
          {
            url: "  https://a.com  ",
            title: "  Title  ",
            description: "  Desc  ",
          },
        ],
      });
      expect(result[0]).toEqual({
        url: "https://a.com",
        title: "Title",
        description: "Desc",
      });
    });

    it("treats empty title / description as undefined", () => {
      const result = normalizeRemoteDatasets({
        remote_datasets: [{ url: "https://a.com", title: "", description: "   " }],
      });
      expect(result[0]).toEqual({
        url: "https://a.com",
        title: undefined,
        description: undefined,
      });
    });

    it("filters out entries missing url", () => {
      const result = normalizeRemoteDatasets({
        remote_datasets: [
          { title: "no url" } as unknown,
          { url: "https://ok.com" },
        ],
      });
      expect(result.map((e) => e.url)).toEqual(["https://ok.com"]);
    });

    it("filters out entries with non-string url", () => {
      const result = normalizeRemoteDatasets({
        remote_datasets: [
          { url: 42 } as unknown,
          { url: null } as unknown,
          { url: "https://ok.com" },
        ],
      });
      expect(result.map((e) => e.url)).toEqual(["https://ok.com"]);
    });

    it("filters out entries with empty url after trim", () => {
      const result = normalizeRemoteDatasets({
        remote_datasets: [{ url: "   " }, { url: "https://ok.com" }],
      });
      expect(result.map((e) => e.url)).toEqual(["https://ok.com"]);
    });
  });

  describe("mixed and malformed input", () => {
    it("handles a mix of strings and objects in the same array", () => {
      const result = normalizeRemoteDatasets({
        remote_datasets: [
          "https://legacy.com/old.csv",
          { url: "https://new.com/new.json", title: "Fresh", description: "Recent" },
        ],
      });
      expect(result).toEqual([
        {
          url: "https://legacy.com/old.csv",
          title: undefined,
          description: undefined,
        },
        {
          url: "https://new.com/new.json",
          title: "Fresh",
          description: "Recent",
        },
      ]);
    });

    it("filters out entries that are neither string nor object", () => {
      const result = normalizeRemoteDatasets({
        remote_datasets: [
          null,
          undefined,
          42,
          true,
          "https://kept.com",
        ] as unknown[],
      });
      expect(result.map((e) => e.url)).toEqual(["https://kept.com"]);
    });

    it("ignores extra unknown fields on object entries", () => {
      const result = normalizeRemoteDatasets({
        remote_datasets: [
          {
            url: "https://a.com",
            title: "T",
            description: "D",
            format: "csv",
            mime: "text/csv",
          } as unknown,
        ],
      });
      expect(result[0]).toEqual({
        url: "https://a.com",
        title: "T",
        description: "D",
      });
    });
  });
});

describe("extractRemoteDatasetUrls", () => {
  it("returns just the URLs", () => {
    const urls = extractRemoteDatasetUrls({
      remote_datasets: [
        "https://a.com",
        { url: "https://b.com", title: "B" },
      ],
    });
    expect(urls).toEqual(["https://a.com", "https://b.com"]);
  });

  it("returns [] for null extras", () => {
    expect(extractRemoteDatasetUrls(null)).toEqual([]);
  });

  it("returns [] for empty remote_datasets", () => {
    expect(extractRemoteDatasetUrls({ remote_datasets: [] })).toEqual([]);
  });

  it("trims whitespace consistently with normalize", () => {
    const urls = extractRemoteDatasetUrls({
      remote_datasets: ["  https://a.com  "],
    });
    expect(urls).toEqual(["https://a.com"]);
  });
});
