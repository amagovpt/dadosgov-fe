import { describe, expect, it } from "vitest";
import { activeDatastories } from "../activeDatastories";

describe("activeDatastories", () => {
  it("drops datastories deactivated in the CMS", () => {
    expect(
      activeDatastories([
        { isActive: true, metadata: { slug: "a" } },
        { isActive: false, metadata: { slug: "b" } },
      ])
    ).toEqual([{ slug: "a" }]);
  });

  it("keeps datastories whose flag is unset", () => {
    expect(
      activeDatastories([
        { isActive: null, metadata: { slug: "a" } },
        { metadata: { slug: "b" } },
      ])
    ).toEqual([{ slug: "a" }, { slug: "b" }]);
  });

  it("returns an empty list when there are no references", () => {
    expect(activeDatastories(undefined)).toEqual([]);
    expect(activeDatastories([])).toEqual([]);
  });
});
