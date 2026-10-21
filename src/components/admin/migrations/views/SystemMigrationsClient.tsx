"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Icon, StatusCard } from "@ama-pt/agora-design-system";

import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import StatusDot from "@/components/admin/StatusDot";
import StatusFilterSelect from "@/components/admin/StatusFilterSelect";
import { useAdminListController } from "@/hooks/admin-lists/useAdminListController";
import { paginateItems } from "@/utils/admin-lists/listHelpers";
import { fetchMigrationsAudit } from "@/service/api/system";
import type { MigrationState, MigrationsAudit } from "@/service/types/migrations-audit";
import {
  buildStateSummary,
  createMigrationColumns,
  filterMigrationsByState,
  filterMigrationsBySearch,
  sortMigrations,
  type MigrationSortField,
} from "../config/migrationsAuditListConfig";

/**
 * The state of this environment's database schema, read-only (LEDG-2655).
 *
 * PPR came back from a production dump with 34 migrations claiming to be
 * applied and none of them run, and the only way to see that was a shell on
 * the machine. Whoever has no production access had to request a deploy just
 * to read the state — which takes longer than the window in which it helps.
 *
 * 🚩 READ-ONLY BY REQUIREMENT. Applying, marking or unmarking a migration is
 * the most destructive operation the portal has, and it must not have a
 * button. Nothing here calls anything but GET.
 */

/** Mirrors ANOMALOUS_STATES in udata/db/migration_audit.py. */
const ANOMALOUS_STATES: ReadonlySet<MigrationState> = new Set([
  "not_applied",
  "recorded_only",
  "recorded_after_failure",
  "applied_with_errors",
  "failed",
  "empty_record",
]);

export default function SystemMigrationsClient() {
  const { t } = useTranslation("admin-migrations");

  const [audit, setAudit] = useState<MigrationsAudit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());

  const toggleExpanded = (filename: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(filename)) next.delete(filename);
      else next.add(filename);
      return next;
    });

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
  } = useAdminListController<MigrationSortField, { stateFilter: string }>({
    initialFilters: { stateFilter: "" },
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await fetchMigrationsAudit();
      if (cancelled) return;

      // 🚩 null is a failed request; a valid envelope with total 0 is a portal
      // with nothing recorded. Collapsing them here would tell somebody who
      // just restored a dump that the schema is fine.
      setHasLoadError(result === null);
      setAudit(result);
      setIsLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stateLabels = useMemo(
    () =>
      ({
        applied: t("states.applied"),
        not_applied: t("states.not_applied"),
        recorded_only: t("states.recorded_only"),
        recorded_after_failure: t("states.recorded_after_failure"),
        applied_with_errors: t("states.applied_with_errors"),
        failed: t("states.failed"),
        empty_record: t("states.empty_record"),
        orphan: t("states.orphan"),
        legacy: t("states.legacy"),
      }) as Record<MigrationState, string>,
    [t]
  );

  const columns = useMemo(
    () =>
      createMigrationColumns({
        labels: {
          filename: t("columns.filename"),
          state: t("columns.state"),
          date: t("columns.date"),
          detail: t("columns.detail"),
        },
        stateLabels,
        detailLabels: {
          ops: (count) => t("detail.ops", { count }),
          marked: (count) => t("detail.marked", { count }),
          failedRuns: (count) => t("detail.failedRuns", { count }),
          errors: (count) => t("detail.errors", { count }),
        },
        neverLabel: t("values.never"),
        renderToggle: (entry) =>
          entry.messages.length > 0 || entry.traceback ? (
            <Button
              appearance="link"
              variant="neutral"
              onClick={() => toggleExpanded(entry.filename)}
              aria-expanded={expanded.has(entry.filename)}
            >
              <span className="flex items-center gap-4">
                <Icon
                  name={
                    expanded.has(entry.filename)
                      ? "agora-solid-chevron-up"
                      : "agora-line-chevron-down"
                  }
                  className="h-16 w-16"
                />
                {expanded.has(entry.filename) ? t("detail.hideErrors") : t("detail.showErrors")}
              </span>
            </Button>
          ) : null,
      }),
    [t, stateLabels, expanded]
  );

  // Memoised so the filter chain below does not re-run on every render:
  // `?? []` builds a new array each time, which the dependency array sees as
  // a change.
  const entries = useMemo(() => audit?.migrations ?? [], [audit]);

  const filtered = useMemo(
    () =>
      filterMigrationsByState(
        filterMigrationsBySearch(entries, searchQuery),
        filters.stateFilter,
        ANOMALOUS_STATES
      ),
    [entries, searchQuery, filters.stateFilter]
  );

  const sorted = useMemo(
    () => sortMigrations(filtered, sortField, sortOrder),
    [filtered, sortField, sortOrder]
  );

  const visible = useMemo(
    () => paginateItems(sorted, currentPage, pageSize),
    [sorted, currentPage, pageSize]
  );

  /**
   * The verdict, in the feedback slot because that is the only place
   * AdminListPage takes arbitrary content — `children` is typed to Table
   * elements alone.
   *
   * 🔑 It reads `audit.clean` and `audit.counts`, which are the TOTALS from the
   * backend, never the filtered list. Narrowing the table to "anomalies only"
   * must not make a healthy environment look broken, nor the reverse.
   */
  const verdict = useMemo(() => {
    if (isLoading || hasLoadError || !audit) return undefined;

    const breakdown = buildStateSummary(audit.counts, stateLabels);

    return (
      <div className="mb-24 flex flex-col gap-8">
        <StatusCard
          variant={audit.clean ? "success" : "danger"}
          showIcon
          description={
            audit.clean
              ? t("summary.clean", { total: audit.total })
              : `${t("summary.anomalies", { count: audit.anomalies })} ${t("summary.ofTotal", {
                  total: audit.total,
                })}`
          }
        />
        <div className="flex flex-wrap gap-16">
          {breakdown.map((item) => (
            <StatusDot key={item.state} variant={item.variant}>
              {`${item.count} · ${item.label}`}
            </StatusDot>
          ))}
        </div>
      </div>
    );
  }, [isLoading, hasLoadError, audit, stateLabels, t]);

  return (
    <AdminListPage
      breadcrumbItems={[{ label: t("title"), url: "/admin/system/migrations" }]}
      title={t("title")}
      description={t("intro.description")}
      // Without this the AdminLayout applies its default headerAction -- a
      // "Publicar" dropdown with five creation targets -- on a page that must
      // offer no writes at all.
      headerAction={null}
      isLoading={isLoading}
      count={filtered.length}
      hasItems={visible.length > 0}
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
          value={filters.stateFilter}
          onChange={(value) => updateFilter("stateFilter", value)}
          options={[
            { value: "", label: t("filters.all") },
            { value: "anomalies", label: t("filters.anomalies") },
            { value: "applied", label: t("filters.applied") },
          ]}
        />
      }
      feedback={verdict}
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
        items={visible}
        columns={columns}
        getSortOrder={getSortOrder}
        handleSort={handleSort}
        getRowKey={(entry) => entry.filename}
        renderExpandedRow={(entry) => {
          if (!expanded.has(entry.filename)) return null;

          return (
            <div className="flex flex-col gap-8 py-8">
              {entry.messages.length > 0 && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm font-medium text-neutral-900">{t("detail.errorsTitle")}</p>
                  <ul className="flex flex-col gap-2">
                    {entry.messages.map((message, index) => (
                      <li key={index} className="font-mono text-xs break-all text-danger-700">
                        {message}
                      </li>
                    ))}
                  </ul>
                  {/* The count is the true total; the list is capped. Saying so
                      keeps "11 errors" from looking like a contradiction when
                      only 20 of 30 are listed. */}
                  {entry.errors > entry.messages.length && (
                    <p className="text-xs text-neutral-700">
                      {t("detail.truncated", {
                        shown: entry.messages.length,
                        total: entry.errors,
                      })}
                    </p>
                  )}
                </div>
              )}
              {entry.traceback && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm font-medium text-neutral-900">
                    {t("detail.tracebackTitle")}
                  </p>
                  <pre className="overflow-x-auto rounded-4 bg-neutral-100 p-8 font-mono text-xs">
                    {entry.traceback}
                  </pre>
                </div>
              )}
            </div>
          );
        }}
      />
    </AdminListPage>
  );
}
