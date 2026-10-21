/**
 * The state of the database schema, as the audit endpoint reports it.
 *
 * Mirrors `udata/db/migration_audit.py`. Nine states rather than the three
 * `udata db status` knows, because three of its green answers are not success:
 * a migration recorded without ever running (what restoring a dump produces),
 * one that failed and was marked by hand, and one that ran while logging
 * errors and reported OK.
 */
export type MigrationState =
  | "applied"
  | "not_applied"
  | "recorded_only"
  | "recorded_after_failure"
  | "applied_with_errors"
  | "failed"
  | "empty_record"
  | "orphan"
  | "legacy";

export interface MigrationAuditEntry {
  filename: string;
  state: MigrationState;
  /** ISO date of the last operation; null on a migration that never ran. */
  date: string | null;
  ops: number;
  /** How many times it was recorded rather than run. */
  marked: number;
  /** How many real runs failed. Separates "marked once" from "failed thrice". */
  failed_runs: number;
  errors: number;
  /**
   * The error lines themselves, capped at twenty by the backend. `errors`
   * keeps the true count, so a truncated list never misreports how bad it
   * was.
   */
  messages: string[];
  /** Only present for the failure states, and truncated by the backend. */
  traceback: string | null;
}

export interface MigrationsAudit {
  generated_at: string;
  total: number;
  /** Every state is a key, always, even at zero. */
  counts: Record<MigrationState, number>;
  anomalies: number;
  /**
   * 🚩 Decided by the backend, never recomputed here. Filtering a table must
   * not be able to change the verdict, and the command and the page must not
   * be able to disagree about the same environment.
   */
  clean: boolean;
  migrations: MigrationAuditEntry[];
}
