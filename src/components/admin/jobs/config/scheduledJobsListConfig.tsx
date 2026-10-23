import { format } from "date-fns";

import StatusDot from "@/components/admin/StatusDot";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";
import {
  createDateSorter,
  createLocaleStringSorter,
  sortItems,
} from "@/utils/admin-lists/listHelpers";
import type { ScheduledJob } from "@/service/types/scheduled-jobs";

export type ScheduledJobSortField = "name" | "task" | "kind" | "last_run_at" | "status";

export type ScheduledJobKind = "harvester" | "system";

/**
 * 🔑 Harvester or system job, decided by the TASK and never by the name.
 *
 * `udata/harvest/actions.py` schedules a source with `task="harvest"` and
 * `name=f"Harvest {source.name} ({source.id})"`. The prefix is a consequence
 * of that, so reading the name would be reading the side effect: a system job
 * named "Harvest metrics" would be misfiled, and a harvester whose source is
 * renamed would stay correct only by luck.
 */
export function getJobKind(job: ScheduledJob): ScheduledJobKind {
  return job.task === "harvest" ? "harvester" : "system";
}

/**
 * A job that has never run is ordinary, not broken -- the portal registers
 * many it has simply not needed yet.
 *
 * 🚩 The invalid-date guard is not defensive clutter. `src/utils/formatDate.ts`
 * documents that a non-empty string which is not a date reaches date-fns and
 * throws `RangeError: Invalid time value`, taking the whole render with it. A
 * column formatter is exactly where that would happen.
 */
export function getLastRunLabel(job: ScheduledJob, neverLabel: string): string {
  if (!job.last_run_at) return neverLabel;

  const parsed = new Date(job.last_run_at);
  if (Number.isNaN(parsed.getTime())) return neverLabel;

  return format(parsed, "dd/MM/yyyy HH:mm");
}

export function filterJobsBySearch(jobs: ScheduledJob[], searchQuery: string): ScheduledJob[] {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return jobs;

  // The name carries the source id for harvesters ("Harvest X (abc123)"), so
  // searching by id finds the job too -- useful when diagnosing from a log.
  return jobs.filter((job) => job.name.toLowerCase().includes(query));
}

export function filterJobsByKind(jobs: ScheduledJob[], kindFilter: string): ScheduledJob[] {
  if (kindFilter !== "harvester" && kindFilter !== "system") return jobs;
  return jobs.filter((job) => getJobKind(job) === kindFilter);
}

export function sortScheduledJobs(
  jobs: ScheduledJob[],
  sortField: ScheduledJobSortField | null,
  sortOrder: "ascending" | "descending" | "none"
): ScheduledJob[] {
  return sortItems(jobs, sortField, sortOrder, {
    name: createLocaleStringSorter((job) => job.name),
    task: createLocaleStringSorter((job) => job.task),
    kind: createLocaleStringSorter(getJobKind),
    status: createLocaleStringSorter((job) => (job.enabled ? "1" : "0")),
    last_run_at: createDateSorter((job) => job.last_run_at ?? ""),
  });
}

/**
 * The task names the portal knows how to run but never does.
 *
 * This is the question the page exists for. Reading the schedule tells you
 * what runs; only the difference against the registered tasks tells you what
 * does not -- the purges and the inactive-account chores that have been
 * sitting unscheduled without anybody noticing.
 */
export function getUnscheduledTaskNames(
  schedulable: string[],
  jobs: ScheduledJob[]
): string[] {
  const scheduled = new Set(jobs.map((job) => job.task));
  return schedulable.filter((task) => !scheduled.has(task)).sort((a, b) => a.localeCompare(b));
}

interface ScheduledJobColumnsOptions {
  labels: {
    name: string;
    task: string;
    kind: string;
    schedule: string;
    lastRun: string;
    status: string;
  };
  kindLabels: Record<ScheduledJobKind, string>;
  statusLabels: { enabled: string; disabled: string };
  neverLabel: string;
}

/**
 * 🚩 No actions column, and none is coming. The page is read-only by
 * requirement: the write endpoints exist but are closed behind
 * admin_permission, and nothing here should suggest otherwise.
 */
export function createScheduledJobColumns({
  labels,
  kindLabels,
  statusLabels,
  neverLabel,
}: ScheduledJobColumnsOptions): AdminListColumn<ScheduledJob, ScheduledJobSortField>[] {
  return [
    {
      id: "name",
      header: labels.name,
      sortField: "name",
      sortType: "string",
      renderCell: (job) => job.name,
      exportValue: (job) => job.name,
    },
    {
      id: "kind",
      header: labels.kind,
      sortField: "kind",
      sortType: "string",
      renderCell: (job) => kindLabels[getJobKind(job)],
      exportValue: (job) => kindLabels[getJobKind(job)],
    },
    {
      id: "task",
      header: labels.task,
      sortField: "task",
      sortType: "string",
      renderCell: (job) => job.task,
      exportValue: (job) => job.task,
    },
    {
      id: "schedule",
      header: labels.schedule,
      // The backend formats this already (schedule_display). Rebuilding it
      // from the crontab here would be a second implementation of the same
      // rule, free to drift from the one the scheduler actually obeys.
      renderCell: (job) => job.schedule,
      exportValue: (job) => job.schedule,
    },
    {
      id: "last_run_at",
      header: labels.lastRun,
      sortField: "last_run_at",
      sortType: "date",
      renderCell: (job) => getLastRunLabel(job, neverLabel),
      exportValue: (job) => getLastRunLabel(job, neverLabel),
    },
    {
      id: "status",
      header: labels.status,
      sortField: "status",
      sortType: "string",
      renderCell: (job) => (
        <StatusDot variant={job.enabled ? "success" : "neutral"}>
          {job.enabled ? statusLabels.enabled : statusLabels.disabled}
        </StatusDot>
      ),
      exportValue: (job) => (job.enabled ? statusLabels.enabled : statusLabels.disabled),
    },
  ];
}
