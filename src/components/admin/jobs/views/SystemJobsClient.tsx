"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StatusCard } from "@ama-pt/agora-design-system";

import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import StatusFilterSelect from "@/components/admin/StatusFilterSelect";
import { useAdminListController } from "@/hooks/admin-lists/useAdminListController";
import { paginateItems } from "@/utils/admin-lists/listHelpers";
import { fetchScheduledJobs, fetchSchedulableJobs } from "@/service/api/system";
import type { ScheduledJob } from "@/service/types/scheduled-jobs";
import {
  createScheduledJobColumns,
  filterJobsByKind,
  filterJobsBySearch,
  getUnscheduledTaskNames,
  sortScheduledJobs,
  type ScheduledJobSortField,
} from "../config/scheduledJobsListConfig";

/**
 * The portal's Celery Beat schedule, read-only (LEDG-2614).
 *
 * Until this page existed, answering "is this job on?", "when did it last
 * run?" or "how often is it scheduled?" meant opening a shell on the machine.
 *
 * 🚩 READ-ONLY BY REQUIREMENT. No create, edit, delete, enable/disable or run.
 * The write endpoints exist and are closed behind admin_permission on the
 * backend; nothing here should suggest they are reachable.
 */
export default function SystemJobsClient() {
  const { t } = useTranslation("admin-jobs");

  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [schedulable, setSchedulable] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    searchQuery,
    handleSearch,
    sortField,
    sortOrder,
    handleSort,
    getSortOrder,
    filters,
    updateFilter,
  } = useAdminListController<ScheduledJobSortField, { kindFilter: string }>({
    initialFilters: { kindFilter: "" },
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Fetched together but judged apart: the schedule is the page, the
      // registered task names are a footnote to it.
      const [scheduled, registered] = await Promise.all([
        fetchScheduledJobs(),
        fetchSchedulableJobs(),
      ]);
      if (cancelled) return;

      // 🚩 null means the request failed; [] means the portal schedules
      // nothing. Criterion 7 is this line: collapsing them here would make the
      // page say "no jobs" while the backend is down.
      setHasLoadError(scheduled === null);
      setJobs(scheduled ?? []);
      setSchedulable(registered);
      setIsLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const columns = useMemo(
    () =>
      createScheduledJobColumns({
        labels: {
          name: t("columns.name"),
          task: t("columns.task"),
          kind: t("columns.kind"),
          schedule: t("columns.schedule"),
          lastRun: t("columns.lastRun"),
          status: t("columns.status"),
        },
        kindLabels: { harvester: t("kind.harvester"), system: t("kind.system") },
        statusLabels: { enabled: t("status.enabled"), disabled: t("status.disabled") },
        neverLabel: t("values.never"),
      }),
    [t]
  );

  // The endpoint returns the whole schedule unpaginated, unsearched and
  // unsorted, so all three happen here. With 48 jobs that is free.
  const filteredJobs = useMemo(
    () => filterJobsByKind(filterJobsBySearch(jobs, searchQuery), filters.kindFilter),
    [jobs, searchQuery, filters.kindFilter]
  );

  const sortedJobs = useMemo(
    () => sortScheduledJobs(filteredJobs, sortField, sortOrder),
    [filteredJobs, sortField, sortOrder]
  );

  const visibleJobs = useMemo(
    () => paginateItems(sortedJobs, currentPage, pageSize),
    [sortedJobs, currentPage, pageSize]
  );

  /**
   * The registered tasks nothing schedules -- the purges, the inactive-account
   * chores. Reading the schedule says what runs; only this difference says
   * what does not, which is the question that sends people to the machine.
   *
   * Subordinate on purpose: if its fetch failed the section disappears and the
   * table above is untouched. Claiming "nothing is unscheduled" on a failed
   * request would be worse than saying nothing.
   */
  const unscheduled = useMemo(
    () => (schedulable ? getUnscheduledTaskNames(schedulable, jobs) : []),
    [schedulable, jobs]
  );

  /**
   * Rendered in the feedback slot because that is the only place AdminListPage
   * accepts arbitrary content -- `children` is typed to Table elements alone.
   * It earns the position: a note about what the schedule is MISSING belongs
   * above the schedule, not after it.
   */
  const unscheduledNotice =
    !isLoading && !hasLoadError && unscheduled.length > 0 ? (
      <div className="mb-24">
        <StatusCard
          variant="informative"
          showIcon
          description={`${t("unscheduled.description")} ${unscheduled.join(", ")}`}
          title={t("unscheduled.count", { count: unscheduled.length })}
        />
      </div>
    ) : undefined;

  return (
    <AdminListPage
      breadcrumbItems={[{ label: t("title"), url: "/admin/system/jobs" }]}
      title={t("title")}
      // Without this the AdminLayout applies its default headerAction -- a
      // "Publicar" dropdown with five creation targets -- on a page that must
      // offer no writes at all.
      headerAction={null}
      isLoading={isLoading}
      count={filteredJobs.length}
      hasItems={visibleJobs.length > 0}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      search={{
        label: t("search.label"),
        placeholder: t("search.placeholder"),
        onChange: handleSearch,
      }}
      filters={
        <StatusFilterSelect
          value={filters.kindFilter}
          onChange={(value) => updateFilter("kindFilter", value)}
          options={[
            { value: "", label: t("filters.all") },
            { value: "harvester", label: t("filters.harvester") },
            { value: "system", label: t("filters.system") },
          ]}
        />
      }
      feedback={unscheduledNotice}
      emptyState={
        hasLoadError ? (
          <StatusCard variant="danger" showIcon description={t("errors.loadFailed")} />
        ) : (
          <AdminEmptyState
            title={t("emptyState.title")}
            description={t("emptyState.description")}
          />
        )
      }
    >
      <AdminListTable
        items={visibleJobs}
        columns={columns}
        getSortOrder={getSortOrder}
        handleSort={handleSort}
        getRowKey={(job) => job.id}
      />
    </AdminListPage>
  );
}
