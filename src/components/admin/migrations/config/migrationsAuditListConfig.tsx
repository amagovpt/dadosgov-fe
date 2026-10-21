import type { ReactNode } from "react";
import { format } from "date-fns";

import StatusDot from "@/components/admin/StatusDot";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";
import {
  createDateSorter,
  createLocaleStringSorter,
  sortItems,
} from "@/utils/admin-lists/listHelpers";
import type { MigrationAuditEntry, MigrationState } from "@/service/types/migrations-audit";

export type MigrationSortField = "filename" | "state" | "date";

type Variant = "success" | "warning" | "danger" | "informative";

/**
 * 🚩 Green is reserved for the one state that means what it says.
 *
 * `udata db status` paints three of the others green too -- recorded-only,
 * marked-after-failing, applied-with-errors -- and that is the whole reason
 * this page exists. Repeating its colour scheme would repeat its blindness.
 */
const STATE_VARIANTS: Record<MigrationState, Variant> = {
  applied: "success",
  not_applied: "warning",
  recorded_only: "warning",
  applied_with_errors: "warning",
  failed: "danger",
  recorded_after_failure: "danger",
  empty_record: "danger",
  // Informative, not a warning: an orphan is what syncing with upstream
  // leaves behind, and a legacy record is what old dumps contain. Neither is
  // somebody's mistake, and neither counts as an anomaly in the verdict.
  orphan: "informative",
  legacy: "informative",
};

/** Worst first, so the summary reads top-down in order of what to look at. */
const SEVERITY: MigrationState[] = [
  "failed",
  "recorded_after_failure",
  "empty_record",
  "recorded_only",
  "applied_with_errors",
  "not_applied",
  "orphan",
  "legacy",
  "applied",
];

export function getStateVariant(state: MigrationState): Variant {
  return STATE_VARIANTS[state];
}

/**
 * A job that never ran has no date, which is ordinary.
 *
 * The invalid-date guard is not clutter: `src/utils/formatDate.ts` documents
 * that a non-empty string which is not a date reaches date-fns and throws
 * RangeError, and inside a column formatter that takes the whole table down
 * rather than one cell.
 */
export function getDateLabel(entry: MigrationAuditEntry, neverLabel: string): string {
  if (!entry.date) return neverLabel;

  const parsed = new Date(entry.date);
  if (Number.isNaN(parsed.getTime())) return neverLabel;

  return format(parsed, "dd/MM/yyyy HH:mm");
}

interface DetailLabels {
  ops: (count: number) => string;
  marked: (count: number) => string;
  failedRuns: (count: number) => string;
  errors: (count: number) => string;
}

/**
 * The counts that separate "recorded once" from "failed three times and then
 * marked by hand" -- which `udata db status` cannot say at all.
 *
 * Composed from the structured fields, never from text the backend sent: the
 * payload is technical and language-neutral, and the sentences belong here.
 */
export function getDetailLabel(entry: MigrationAuditEntry, labels: DetailLabels): string {
  const bits: string[] = [];
  if (entry.ops) bits.push(labels.ops(entry.ops));
  if (entry.marked) bits.push(labels.marked(entry.marked));
  if (entry.failed_runs) bits.push(labels.failedRuns(entry.failed_runs));
  if (entry.errors) bits.push(labels.errors(entry.errors));
  return bits.join(" · ");
}

/**
 * The per-state breakdown, worst first and **omitting the states at zero**.
 *
 * 🔑 That omission is criterion 9: on a healthy environment this is a single
 * entry, so "nothing to see here" is something the eye registers rather than
 * something it has to compute from nine numbers that are mostly zero.
 */
export function buildStateSummary(
  counts: Record<MigrationState, number>,
  labels: Record<MigrationState, string>
): Array<{ state: MigrationState; count: number; label: string; variant: Variant }> {
  return SEVERITY.filter((state) => (counts[state] ?? 0) > 0).map((state) => ({
    state,
    count: counts[state],
    label: labels[state],
    variant: STATE_VARIANTS[state],
  }));
}

export function filterMigrationsBySearch(
  entries: MigrationAuditEntry[],
  searchQuery: string
): MigrationAuditEntry[] {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return entries;
  return entries.filter((entry) => entry.filename.toLowerCase().includes(query));
}

export function filterMigrationsByState(
  entries: MigrationAuditEntry[],
  stateFilter: string,
  anomalousStates: ReadonlySet<MigrationState>
): MigrationAuditEntry[] {
  if (stateFilter === "anomalies") {
    return entries.filter((entry) => anomalousStates.has(entry.state));
  }
  if (stateFilter === "applied") {
    return entries.filter((entry) => entry.state === "applied");
  }
  return entries;
}

export function sortMigrations(
  entries: MigrationAuditEntry[],
  sortField: MigrationSortField | null,
  sortOrder: "ascending" | "descending" | "none"
): MigrationAuditEntry[] {
  return sortItems(entries, sortField, sortOrder, {
    // The filename starts with the date, so sorting by it is chronological --
    // which is also the order the scheduler applies them in.
    filename: createLocaleStringSorter((entry) => entry.filename),
    state: createLocaleStringSorter((entry) => String(SEVERITY.indexOf(entry.state))),
    date: createDateSorter((entry) => entry.date ?? ""),
  });
}

interface MigrationColumnsOptions {
  labels: { filename: string; state: string; date: string; detail: string };
  stateLabels: Record<MigrationState, string>;
  detailLabels: DetailLabels;
  neverLabel: string;
  /**
   * The control that opens the error list, supplied by the page because the
   * expansion state lives there. Returns nothing for a migration with nothing
   * to show, so a healthy row carries no dead affordance.
   */
  renderToggle?: (entry: MigrationAuditEntry) => ReactNode;
}

/**
 * 🚩 No actions column. Applying, marking or unmarking a migration is the most
 * destructive operation the portal has, and it must not have a button.
 */
export function createMigrationColumns({
  labels,
  stateLabels,
  detailLabels,
  neverLabel,
  renderToggle,
}: MigrationColumnsOptions): AdminListColumn<MigrationAuditEntry, MigrationSortField>[] {
  return [
    {
      id: "filename",
      header: labels.filename,
      sortField: "filename",
      sortType: "string",
      renderCell: (entry) => entry.filename.replace(/\.py$/, ""),
      exportValue: (entry) => entry.filename,
    },
    {
      id: "state",
      header: labels.state,
      sortField: "state",
      sortType: "string",
      renderCell: (entry) => (
        <StatusDot variant={getStateVariant(entry.state)}>{stateLabels[entry.state]}</StatusDot>
      ),
      exportValue: (entry) => stateLabels[entry.state],
    },
    {
      id: "date",
      header: labels.date,
      sortField: "date",
      sortType: "date",
      renderCell: (entry) => getDateLabel(entry, neverLabel),
      exportValue: (entry) => getDateLabel(entry, neverLabel),
    },
    {
      id: "detail",
      header: labels.detail,
      renderCell: (entry) => (
        <div className="flex flex-col gap-4">
          <span>{getDetailLabel(entry, detailLabels)}</span>
          {renderToggle?.(entry)}
        </div>
      ),
      exportValue: (entry) => getDetailLabel(entry, detailLabels),
    },
  ];
}
