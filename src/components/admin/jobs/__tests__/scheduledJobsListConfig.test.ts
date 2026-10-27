/**
 * LEDG-2614. The jobs page has one piece of real logic and it lives here, in a
 * module with no DOM and no design system: which jobs are harvesters, what a
 * job that never ran shows, and which registered tasks nobody schedules.
 *
 * Everything the page does beyond this is composition of AdminListPage.
 */

import { describe, expect, it } from "vitest";

import {
  filterJobsByKind,
  filterJobsBySearch,
  getJobKind,
  getLastRunLabel,
  getUnscheduledTaskNames,
  sortScheduledJobs,
} from "../config/scheduledJobsListConfig";
import type { ScheduledJob } from "@/service/types/scheduled-jobs";

const job = (over: Partial<ScheduledJob> = {}): ScheduledJob => ({
  id: "1",
  name: "count-tags",
  task: "count-tags",
  args: [],
  kwargs: {},
  schedule: "0 * * * *",
  last_run_at: "2026-10-20T09:00:00+00:00",
  enabled: true,
  ...over,
});

const NEVER = "—";

describe("getJobKind", () => {
  it("calls a job scheduled by the harvest task a harvester", () => {
    expect(getJobKind(job({ task: "harvest", name: "Harvest EMEL (abc123)" }))).toBe("harvester");
  });

  it("calls everything else a system job", () => {
    expect(getJobKind(job({ task: "compute-site-metrics" }))).toBe("system");
    expect(getJobKind(job({ task: "purge-datasets" }))).toBe("system");
  });

  /**
   * 🚩 Criterion 5, and the reason this is a function rather than a `startsWith`
   * in a column. The backend names a harvester's schedule "Harvest <source>
   * (<id>)" as a consequence of setting task="harvest"; reading the name would
   * be reading the side effect, and these two cases are where that breaks.
   */
  it("classifies by task, not by the name prefix", () => {
    const misleadingName = job({ task: "compute-site-metrics", name: "Harvest metrics daily" });
    expect(getJobKind(misleadingName)).toBe("system");

    const renamedSource = job({ task: "harvest", name: "Câmara Municipal de Lisboa" });
    expect(getJobKind(renamedSource)).toBe("harvester");
  });
});

describe("getLastRunLabel", () => {
  it("formats the date of a job that has run", () => {
    expect(getLastRunLabel(job({ last_run_at: "2026-10-20T09:30:00+00:00" }), NEVER)).toMatch(
      /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/
    );
  });

  /** Criterion 6: never having run is ordinary, not an error. */
  it("renders a job that never ran as an em dash", () => {
    expect(getLastRunLabel(job({ last_run_at: null }), NEVER)).toBe(NEVER);
    expect(getLastRunLabel(job({ last_run_at: undefined }), NEVER)).toBe(NEVER);
    expect(getLastRunLabel(job({ last_run_at: "" }), NEVER)).toBe(NEVER);
  });

  /**
   * 🚩 A non-empty string that is not a date reaches date-fns and throws
   * RangeError, which in a column formatter takes the whole table down. The
   * guard turns a broken page into one wrong cell.
   */
  it("does not throw on a value that is not a date", () => {
    expect(() => getLastRunLabel(job({ last_run_at: "never" }), NEVER)).not.toThrow();
    expect(getLastRunLabel(job({ last_run_at: "never" }), NEVER)).toBe(NEVER);
  });
});

describe("filtering", () => {
  const jobs = [
    job({ id: "1", name: "Harvest EMEL (abc)", task: "harvest" }),
    job({ id: "2", name: "count-tags", task: "count-tags" }),
    job({ id: "3", name: "purge-chunks", task: "purge-chunks" }),
  ];

  it("finds jobs by a fragment of the name, ignoring case and padding", () => {
    expect(filterJobsBySearch(jobs, "  EMEL ")).toHaveLength(1);
    expect(filterJobsBySearch(jobs, "count")).toHaveLength(1);
  });

  it("finds a harvester by the source id carried in its name", () => {
    expect(filterJobsBySearch(jobs, "abc")[0]?.id).toBe("1");
  });

  it("returns everything for an empty search", () => {
    expect(filterJobsBySearch(jobs, "   ")).toHaveLength(3);
  });

  it("separates harvesters from system jobs, and shows all for anything else", () => {
    expect(filterJobsByKind(jobs, "harvester")).toHaveLength(1);
    expect(filterJobsByKind(jobs, "system")).toHaveLength(2);
    expect(filterJobsByKind(jobs, "")).toHaveLength(3);
  });
});

describe("sortScheduledJobs", () => {
  const jobs = [
    job({ id: "1", name: "zebra" }),
    job({ id: "2", name: "alpha" }),
  ];

  it("orders by name in both directions", () => {
    expect(sortScheduledJobs(jobs, "name", "ascending")[0].name).toBe("alpha");
    expect(sortScheduledJobs(jobs, "name", "descending")[0].name).toBe("zebra");
  });

  it("leaves the order alone when nothing is sorted", () => {
    expect(sortScheduledJobs(jobs, null, "none")[0].id).toBe("1");
  });

  it("sorts by last run without choking on a job that never ran", () => {
    const mixed = [
      job({ id: "a", last_run_at: null }),
      job({ id: "b", last_run_at: "2026-10-20T09:00:00+00:00" }),
    ];
    expect(() => sortScheduledJobs(mixed, "last_run_at", "ascending")).not.toThrow();
    expect(sortScheduledJobs(mixed, "last_run_at", "ascending")).toHaveLength(2);
  });
});

describe("getUnscheduledTaskNames", () => {
  /**
   * The question the page exists to answer. In production 23 task types are
   * registered and 15 are never scheduled -- the purges and the
   * inactive-account chores among them -- and today finding that out means
   * opening a shell on the machine.
   */
  it("lists registered tasks that no scheduled job runs", () => {
    const schedulable = ["harvest", "count-tags", "purge-datasets", "delete-inactive-users"];
    const scheduled = [job({ task: "harvest" }), job({ task: "count-tags" })];

    expect(getUnscheduledTaskNames(schedulable, scheduled)).toEqual([
      "delete-inactive-users",
      "purge-datasets",
    ]);
  });

  it("says nothing is missing when every registered task is scheduled", () => {
    expect(getUnscheduledTaskNames(["harvest"], [job({ task: "harvest" })])).toEqual([]);
  });

  it("counts a task once however many jobs run it", () => {
    const scheduled = [
      job({ id: "1", task: "harvest" }),
      job({ id: "2", task: "harvest" }),
      job({ id: "3", task: "harvest" }),
    ];
    expect(getUnscheduledTaskNames(["harvest", "purge-reuses"], scheduled)).toEqual([
      "purge-reuses",
    ]);
  });
});
