import { describe, expect, it } from "vitest";
import {
  getDatasetSortDefault,
  parseDatasetsFilters,
  parseDatasetsFiltersFromSearchParams,
} from "../datasetsListingQuery";

describe("parseDatasetsFilters", () => {
  it("keeps a single value as a plain string", () => {
    const filters = parseDatasetsFilters(new URLSearchParams("geozone=country:pt"));
    expect(filters.geozone).toBe("country:pt");
  });

  it("keeps every repeat of a multi-value param", () => {
    const filters = parseDatasetsFilters(
      new URLSearchParams("geozone=country:pt&geozone=country-group:eu")
    );
    expect(filters.geozone).toEqual(["country:pt", "country-group:eu"]);
  });

  it("keeps every repeat of granularity", () => {
    const filters = parseDatasetsFilters(
      new URLSearchParams("granularity=country&granularity=other")
    );
    expect(filters.granularity).toEqual(["country", "other"]);
  });

  it("splits comma-separated tags but not other params", () => {
    const filters = parseDatasetsFilters(new URLSearchParams("tag=saude,ambiente&format=csv,json"));
    expect(filters.tag).toEqual(["saude", "ambiente"]);
    // Only `tag` is ever written comma-separated, so `format` stays verbatim.
    expect(filters.format).toBe("csv,json");
  });

  it("carries the format family", () => {
    const filters = parseDatasetsFilters(
      new URLSearchParams("format_family=tabular&format_family=documents")
    );
    expect(filters.format_family).toEqual(["tabular", "documents"]);
  });

  // The API declares format_family with a closed set of choices and answers 400
  // on anything else. The listing fetch has no fallback, so forwarding an unknown
  // value took the whole page to the error boundary (HTTP 500) instead of simply
  // returning nothing, which any hand-edited or mangled link could trigger.
  it("drops format_family values the API would reject", () => {
    expect(parseDatasetsFilters(new URLSearchParams("format_family=garbage"))).toEqual({
      sort: "-created",
    });
    // Never comma-split, so the joined form is not a valid family either.
    expect(
      parseDatasetsFilters(new URLSearchParams("format_family=tabular,documents"))
    ).toEqual({ sort: "-created" });
    // The pre-rename ids are gone and must not reach the API.
    expect(parseDatasetsFilters(new URLSearchParams("format_family=structured"))).toEqual({
      sort: "-created",
    });
  });

  it("keeps the valid format families when mixed with rejected ones", () => {
    const filters = parseDatasetsFilters(
      new URLSearchParams("format_family=garbage&format_family=other")
    );
    expect(filters.format_family).toBe("other");
  });

  it("does not restrict params the API accepts freely", () => {
    // granularity has no choices list: an unknown value returns nothing, so it
    // must be forwarded rather than dropped (dropping it would silently widen
    // the listing to everything).
    const filters = parseDatasetsFilters(new URLSearchParams("granularity=garbage"));
    expect(filters.granularity).toBe("garbage");
  });

  it("defaults to newest-first when there is neither a sort nor a query", () => {
    expect(parseDatasetsFilters(new URLSearchParams()).sort).toBe("-created");
    expect(parseDatasetsFilters(new URLSearchParams("q=saude")).sort).toBeUndefined();
    expect(parseDatasetsFilters(new URLSearchParams("sort=created")).sort).toBe("created");
  });

  it("ignores params it does not know", () => {
    const filters = parseDatasetsFilters(new URLSearchParams("page=3&unknown=x"));
    expect(filters).toEqual({ sort: "-created" });
  });
});

describe("parseDatasetsFiltersFromSearchParams", () => {
  // The datasets page receives `string | string[]` per key. Flattening an array
  // with String() produced `"a,b"` — one value matching no zone — so selecting a
  // second option emptied the listing (LEDG-2255).
  it("preserves an array of values instead of joining them", () => {
    const filters = parseDatasetsFiltersFromSearchParams({
      geozone: ["country:pt", "country-group:eu"],
      granularity: ["country", "other"],
    });
    expect(filters.geozone).toEqual(["country:pt", "country-group:eu"]);
    expect(filters.granularity).toEqual(["country", "other"]);
  });

  it("handles a single string value", () => {
    const filters = parseDatasetsFiltersFromSearchParams({ geozone: "country:pt", q: "saude" });
    expect(filters.geozone).toBe("country:pt");
    expect(filters.q).toBe("saude");
  });

  it("skips undefined values and tolerates no params at all", () => {
    expect(parseDatasetsFiltersFromSearchParams({ geozone: undefined })).toEqual({
      sort: "-created",
    });
    expect(parseDatasetsFiltersFromSearchParams(undefined)).toEqual({ sort: "-created" });
  });
});

describe("getDatasetSortDefault", () => {
  it("maps the sort param back to its option key", () => {
    expect(getDatasetSortDefault(null)).toBe("relevancia");
    expect(getDatasetSortDefault("-created")).toBe("criacao");
    expect(getDatasetSortDefault("-followers")).toBe("subscritores");
    expect(getDatasetSortDefault("something-else")).toBe("relevancia");
  });
});
