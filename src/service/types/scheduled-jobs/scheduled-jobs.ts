/**
 * The Celery Beat schedule, as the backend serialises it.
 *
 * Mirrors `job_fields` in `udata/core/jobs/api.py` field for field. The portal
 * schedules two kinds of thing through the same mechanism: the harvesters
 * (one PeriodicTask per source) and the system jobs that keep metrics, badges
 * and purges running.
 */
export interface ScheduledJobCrontab {
  minute: string;
  hour: string;
  day_of_week: string;
  day_of_month: string;
  month_of_year: string;
}

export interface ScheduledJobInterval {
  every: number;
  period: string;
}

export interface ScheduledJob {
  id: string;
  name: string;
  description?: string | null;
  /**
   * The registered task this job runs.
   *
   * 🔑 This is what tells a harvester apart from a system job, and the name is
   * not. `udata/harvest/actions.py` schedules a source with `task="harvest"`
   * and `name=f"Harvest {source.name} ({source.id})"` — the prefix is a
   * consequence of that, so a system job called "Harvest metrics" would fool
   * any check that reads the name instead.
   */
  task: string;
  crontab?: ScheduledJobCrontab | null;
  interval?: ScheduledJobInterval | null;
  args: unknown[];
  kwargs: Record<string, unknown>;
  /** Already formatted by the backend. Do not rebuild it from the crontab. */
  schedule: string;
  /** Null on a job that has never run — which is ordinary, not an error. */
  last_run_at?: string | null;
  last_run_id?: string | null;
  enabled: boolean;
}
