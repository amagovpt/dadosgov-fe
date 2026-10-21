/**
 * LEDG-2655. All the page's real logic lives in the config module, with no DOM
 * and no design system, which is what makes criteria 5 and 9 assertions rather
 * than opinions about the design.
 */

import { describe, expect, it } from "vitest";

import {
  buildStateSummary,
  filterMigrationsByState,
  filterMigrationsBySearch,
  getDateLabel,
  getDetailLabel,
  getStateVariant,
  sortMigrations,
} from "../config/migrationsAuditListConfig";
import type { MigrationAuditEntry, MigrationState } from "@/service/types/migrations-audit";

const ALL_STATES: MigrationState[] = [
  "applied",
  "not_applied",
  "recorded_only",
  "recorded_after_failure",
  "applied_with_errors",
  "failed",
  "empty_record",
  "orphan",
  "legacy",
];

const ANOMALOUS = new Set<MigrationState>([
  "not_applied",
  "recorded_only",
  "recorded_after_failure",
  "applied_with_errors",
  "failed",
  "empty_record",
]);

const entry = (over: Partial<MigrationAuditEntry> = {}): MigrationAuditEntry => ({
  filename: "2026-01-01-something.py",
  state: "applied",
  date: "2026-01-01T10:00:00+00:00",
  ops: 1,
  marked: 0,
  failed_runs: 0,
  errors: 0,
  messages: [],
  traceback: null,
  ...over,
});

const zeroCounts = () =>
  Object.fromEntries(ALL_STATES.map((s) => [s, 0])) as Record<MigrationState, number>;

const STATE_LABELS = Object.fromEntries(ALL_STATES.map((s) => [s, s])) as Record<
  MigrationState,
  string
>;

const DETAIL_LABELS = {
  ops: (n: number) => `${n} ops`,
  marked: (n: number) => `marked ${n}x`,
  failedRuns: (n: number) => `${n} failed runs`,
  errors: (n: number) => `${n} errors`,
};

describe("getStateVariant", () => {
  it("gives every state a variant", () => {
    // A state added to the backend without one here would render grey on the
    // page, with nobody noticing it had no colour decided for it.
    for (const state of ALL_STATES) {
      expect(getStateVariant(state), state).toBeDefined();
    }
  });

  /**
   * 🚩 The colour is the argument. `udata db status` prints a green date for
   * recorded-only, marked-after-failing and applied-with-errors, which is the
   * blindness this page corrects; inheriting its palette would inherit that.
   */
  it("paints green only the state that means what it says", () => {
    const green = ALL_STATES.filter((s) => getStateVariant(s) === "success");
    expect(green).toEqual(["applied"]);
  });

  it("treats orphan and legacy as informative, not as problems", () => {
    expect(getStateVariant("orphan")).toBe("informative");
    expect(getStateVariant("legacy")).toBe("informative");
  });
});

describe("buildStateSummary", () => {
  /** 🔑 Criterion 9, as an assertion. */
  it("yields a single entry on a healthy environment", () => {
    const counts = { ...zeroCounts(), applied: 69 };

    const summary = buildStateSummary(counts, STATE_LABELS);

    expect(summary).toHaveLength(1);
    expect(summary[0].state).toBe("applied");
  });

  it("omits the states at zero", () => {
    const counts = { ...zeroCounts(), applied: 48, failed: 2 };

    const summary = buildStateSummary(counts, STATE_LABELS);

    expect(summary.map((s) => s.state)).toEqual(["failed", "applied"]);
  });

  it("puts the worst first, so the summary reads in order of what to look at", () => {
    const counts = { ...zeroCounts(), applied: 10, not_applied: 3, failed: 1 };

    const summary = buildStateSummary(counts, STATE_LABELS);

    expect(summary.map((s) => s.state)).toEqual(["failed", "not_applied", "applied"]);
  });

  it("says nothing at all about an empty environment", () => {
    expect(buildStateSummary(zeroCounts(), STATE_LABELS)).toEqual([]);
  });
});

describe("getDateLabel", () => {
  it("formats the date of a migration that ran", () => {
    expect(getDateLabel(entry(), "—")).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
  });

  it("renders a migration that never ran as an em dash", () => {
    expect(getDateLabel(entry({ date: null }), "—")).toBe("—");
  });

  /** A non-date string reaches date-fns and throws, taking the table with it. */
  it("does not throw on a value that is not a date", () => {
    expect(() => getDateLabel(entry({ date: "never" }), "—")).not.toThrow();
    expect(getDateLabel(entry({ date: "never" }), "—")).toBe("—");
  });
});

describe("getDetailLabel", () => {
  /**
   * What `udata db status` cannot say at all: the difference between a
   * migration marked once and one that failed repeatedly before somebody
   * marked it by hand.
   */
  it("names the markings and the failed runs", () => {
    const detail = getDetailLabel(
      entry({ ops: 3, marked: 1, failed_runs: 2, errors: 5 }),
      DETAIL_LABELS
    );

    expect(detail).toContain("marked 1x");
    expect(detail).toContain("2 failed runs");
    expect(detail).toContain("5 errors");
  });

  it("says only what applies, with nothing padded to zero", () => {
    expect(getDetailLabel(entry({ ops: 1 }), DETAIL_LABELS)).toBe("1 ops");
  });

  it("is empty for a migration with no record at all", () => {
    expect(getDetailLabel(entry({ ops: 0 }), DETAIL_LABELS)).toBe("");
  });
});

describe("filtering", () => {
  const entries = [
    entry({ filename: "2026-01-01-alpha.py", state: "applied" }),
    entry({ filename: "2026-02-01-beta.py", state: "failed" }),
    entry({ filename: "2026-03-01-gamma.py", state: "orphan" }),
  ];

  it("finds a migration by a fragment of its name", () => {
    expect(filterMigrationsBySearch(entries, " BETA ")).toHaveLength(1);
  });

  /** Criterion 5: the anomalies have to be reachable in one click. */
  it("narrows to the anomalies, leaving orphans out of them", () => {
    const anomalies = filterMigrationsByState(entries, "anomalies", ANOMALOUS);

    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].state).toBe("failed");
  });

  it("narrows to the applied ones", () => {
    expect(filterMigrationsByState(entries, "applied", ANOMALOUS)).toHaveLength(1);
  });

  it("returns everything for any other filter", () => {
    expect(filterMigrationsByState(entries, "", ANOMALOUS)).toHaveLength(3);
  });
});

describe("sortMigrations", () => {
  it("orders by filename, which is chronological", () => {
    const entries = [entry({ filename: "2026-05-01-b.py" }), entry({ filename: "2026-01-01-a.py" })];

    expect(sortMigrations(entries, "filename", "ascending")[0].filename).toContain("2026-01-01");
  });

  it("orders by state worst-first, not alphabetically", () => {
    const entries = [entry({ state: "applied" }), entry({ state: "failed" })];

    expect(sortMigrations(entries, "state", "ascending")[0].state).toBe("failed");
  });

  it("sorts by date without choking on one that never ran", () => {
    const entries = [entry({ date: null }), entry({ date: "2026-01-01T10:00:00+00:00" })];

    expect(() => sortMigrations(entries, "date", "ascending")).not.toThrow();
    expect(sortMigrations(entries, "date", "ascending")).toHaveLength(2);
  });
});
