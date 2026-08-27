/**
 * LEDG-2294: the system topics table had no sorting at all — the screen was
 * server-paginated and no column declared a `sortField`. Two of its four columns
 * (the dataset and reuse counts) have no sort key in `TopicApiParser`, so the
 * screen now loads the whole catalogue once and sorts every column client-side,
 * following the harvesters precedent. These tests pin the comparators.
 */

import { describe, expect, it } from "vitest";
import { sortTopics, type TopicSortField } from "../topicsListConfig";
import type { Topic } from "@/service/types/topic";

function makeTopic(partial: Partial<Topic> = {}): Topic {
  return {
    id: "t-1",
    name: "Ambiente",
    slug: "ambiente",
    description: null,
    created_at: "2026-01-01T00:00:00Z",
    datasets_count: 0,
    reuses_count: 0,
    ...partial,
  } as Topic;
}

const ambiente = makeTopic({
  id: "t-1",
  name: "Ambiente",
  created_at: "2026-03-01T00:00:00Z",
  datasets_count: 12,
  reuses_count: 3,
});
const cultura = makeTopic({
  id: "t-2",
  name: "Cultura",
  created_at: "2026-01-01T00:00:00Z",
  datasets_count: 40,
  reuses_count: 1,
});
const saude = makeTopic({
  id: "t-3",
  name: "Saúde",
  created_at: "2026-02-01T00:00:00Z",
  datasets_count: 5,
  reuses_count: 9,
});

const topics = [ambiente, cultura, saude];
const ids = (list: Topic[]) => list.map((topic) => topic.id);

describe("sortTopics", () => {
  const cases: { field: TopicSortField; ascending: string[] }[] = [
    { field: "name", ascending: ["t-1", "t-2", "t-3"] },
    { field: "created_at", ascending: ["t-2", "t-3", "t-1"] },
    { field: "datasets", ascending: ["t-3", "t-1", "t-2"] },
    { field: "reuses", ascending: ["t-2", "t-1", "t-3"] },
  ];

  for (const { field, ascending } of cases) {
    it(`sorts by ${field} in both directions`, () => {
      expect(ids(sortTopics(topics, field, "ascending"))).toEqual(ascending);
      expect(ids(sortTopics(topics, field, "descending"))).toEqual([...ascending].reverse());
    });
  }

  it("leaves the order untouched with no field or no direction", () => {
    expect(ids(sortTopics(topics, null, "ascending"))).toEqual(ids(topics));
    expect(ids(sortTopics(topics, "name", "none"))).toEqual(ids(topics));
  });

  it("does not mutate the array it was given", () => {
    const original = [...topics];
    sortTopics(topics, "datasets", "descending");
    expect(topics).toEqual(original);
  });

  it("treats a missing count as zero rather than dropping the row", () => {
    const noCounts = makeTopic({ id: "t-4", datasets_count: undefined });
    const sorted = sortTopics([cultura, noCounts], "datasets", "ascending");
    expect(ids(sorted)).toEqual(["t-4", "t-2"]);
  });

  it("orders names by locale, so accents do not sink to the bottom", () => {
    const orcamento = makeTopic({ id: "t-5", name: "Órgãos" });
    const sorted = sortTopics([saude, orcamento], "name", "ascending");
    expect(ids(sorted)).toEqual(["t-5", "t-3"]);
  });
});
