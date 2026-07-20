"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  CardNoResults,
  Icon,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import StatusDot from "@/components/admin/StatusDot";
import AdminPaginatedTable from "@/components/admin/lists/AdminPaginatedTable";
import type { HarvestJob, HarvestItem, HarvestError } from "@/service/types/harvester";

const TOTAL_COLUMNS = 11;

function isJobFailed(job: HarvestJob): boolean {
  return job.status === "failed" || job.status === "done-errors";
}

function extractDatasetId(errors: HarvestItem["errors"]): string | null {
  for (const err of errors ?? []) {
    const match = err.message?.match(/Dataset:([a-f0-9]{24})/i);
    if (match) return match[1];
  }
  return null;
}

function JobLogsPanel({ job }: { job: HarvestJob }) {
  const { t } = useTranslation("admin-harvesters");
  // The list endpoint sends only the failed items in `error_items`; the detail
  // endpoint sends the full `items` array. Support both.
  const itemsWithErrors = (job.error_items ?? job.items ?? []).filter(
    (i) => i.errors?.length > 0
  );
  const jobErrors = job.errors || [];

  const hasContent = jobErrors.length > 0 || itemsWithErrors.length > 0;

  if (!hasContent) {
    return <p className="text-sm text-neutral-500 italic">{t("jobDetail.jobs.noLogs")}</p>;
  }

  return (
    <div className="flex flex-col gap-16">
      {jobErrors.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-neutral-700 mb-8 uppercase tracking-wide">
            {t("jobDetail.jobs.jobErrors")} ({jobErrors.length})
          </p>
          <ul className="flex flex-col gap-4">
            {jobErrors.map((err, i) => {
              const e = err as { message?: string; details?: string };
              return (
                <li key={i} className="rounded bg-red-50 px-12 py-8 text-xs text-red-800 font-mono">
                  <span className="font-semibold">{e.message || JSON.stringify(err)}</span>
                  {e.details && <div className="mt-4 text-red-700 opacity-80">{e.details}</div>}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {itemsWithErrors.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-neutral-700 mb-8 uppercase tracking-wide">
            {t("jobDetail.jobs.datasetErrors")} ({itemsWithErrors.length})
          </p>
          <ul className="flex flex-col gap-8">
            {itemsWithErrors.map((item, i) => {
              const label = item.dataset?.title ?? null;
              const link = item.dataset?.page || item.remote_url;
              const internalId = item.dataset?.id ?? extractDatasetId(item.errors);
              return (
                <li key={i} className="rounded border border-red-200 bg-red-50 px-12 py-10">
                  <div className="flex items-center gap-8 mb-6">
                    <Icon name="agora-line-layers-menu" className="w-14 h-14 text-red-600 shrink-0" />
                    {link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-primary-700 underline truncate"
                      >
                        {label}
                      </a>
                    ) : (
                      <span className="text-xs font-semibold text-neutral-800 font-mono truncate">
                        {label}
                      </span>
                    )}
                    <span className="ml-auto shrink-0 text-xs text-red-700 font-medium">
                      {t("jobDetail.jobs.errorsCount", { count: item.errors.length })}
                    </span>
                  </div>
                  <div className="mb-8 flex flex-wrap gap-16 rounded border border-red-100 bg-white px-10 py-6 text-[11px] font-mono">
                    <span>
                      <span className="font-sans text-neutral-400 mr-4">ID Remoto:</span>
                      <span className="text-neutral-700">{item.remote_id}</span>
                    </span>
                    {internalId && (
                      <span>
                        <span className="font-sans text-neutral-400 mr-4">ID dados.gov:</span>
                        <span className="text-neutral-700">{internalId}</span>
                      </span>
                    )}
                  </div>
                  <ul className="flex flex-col gap-4 pl-22">
                    {item.errors.map((err: HarvestError, j: number) => (
                      <li key={j} className="text-xs text-red-800">
                        <span className="font-medium">{err.message}</span>
                        {err.details && (
                          <div className="mt-2 text-red-600 opacity-80 font-mono text-[11px]">
                            {err.details}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

interface HarvesterJobsTableProps {
  jobs: HarvestJob[];
  jobsTotal: number;
  jobsPage: number;
  jobsPageSize: number;
  setJobsPage: (page: number) => void;
  setJobsPageSize: (size: number) => void;
  slug: string;
}

export function HarvesterJobsTable({
  jobs,
  jobsTotal,
  jobsPage,
  jobsPageSize,
  setJobsPage,
  setJobsPageSize,
  slug,
}: HarvesterJobsTableProps) {
  const { t } = useTranslation("admin-harvesters");
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const jobStatusLabels: Record<string, string> = {
    pending: t("jobDetail.jobStatus.pending"),
    initializing: t("jobDetail.jobStatus.initializing"),
    initialized: t("jobDetail.jobStatus.initialized"),
    started: t("jobDetail.jobStatus.started"),
    processing: t("jobDetail.jobStatus.processing"),
    done: t("status.done"),
    "done-errors": t("jobDetail.jobStatus.doneErrors"),
    failed: t("jobDetail.jobStatus.failed"),
  };

  const toggleExpand = (jobId: string) => {
    setExpandedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  };

  if (jobs.length === 0) {
    return (
      <CardNoResults
        icon={<Icon name="agora-line-edit" className="w-12 h-12 text-primary-500 icon-xl" />}
        title={t("jobDetail.jobs.emptyTitle")}
        position="center"
        hasAnchor={false}
        extraDescription={
          <div className="mt-24">
            <Button variant="primary" appearance="outline">
              {t("jobDetail.jobs.settings")}
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <AdminPaginatedTable
      pageSize={jobsPageSize}
      totalItems={jobsTotal}
      currentPage={jobsPage}
      setCurrentPage={setJobsPage}
      setPageSize={setJobsPageSize}
    >
      <TableHeader>
        <TableRow>
          <TableHeaderCell>{t("jobDetail.table.taskId")}</TableHeaderCell>
          <TableHeaderCell>{t("jobDetail.table.status")}</TableHeaderCell>
          <TableHeaderCell>{t("jobDetail.startedAt")}</TableHeaderCell>
          <TableHeaderCell>{t("jobDetail.table.completedAt")}</TableHeaderCell>
          <TableHeaderCell>{t("columns.datasets")}</TableHeaderCell>
          <TableHeaderCell>{t("columns.api")}</TableHeaderCell>
          <TableHeaderCell>
            <Icon name="agora-line-check" className="w-16 h-16" />
          </TableHeaderCell>
          <TableHeaderCell>
            <Icon name="agora-line-eye-off" className="w-16 h-16" />
          </TableHeaderCell>
          <TableHeaderCell>
            <img src="/Icons/box.svg" alt={t("jobDetail.table.archived")} className="w-24 h-24" />
          </TableHeaderCell>
          <TableHeaderCell>
            <Icon name="agora-line-x" className="w-16 h-16" />
          </TableHeaderCell>
          <TableHeaderCell>{t("jobDetail.table.logs")}</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => {
          // Prefer the server-computed counts (jobs list); fall back to deriving
          // them from `items` when present (job detail shape).
          const items = job.items || [];
          const counts = job.item_counts;
          const totalCount = counts?.total ?? items.length;
          const doneCount = counts?.done ?? items.filter((i) => i.status === "done").length;
          const skippedCount = counts?.skipped ?? items.filter((i) => i.status === "skipped").length;
          const archivedCount =
            counts?.archived ?? items.filter((i) => i.status === "archived").length;
          const failedCount = counts?.failed ?? items.filter((i) => i.status === "failed").length;
          const failed = isJobFailed(job);
          const expanded = expandedJobs.has(job.id);

          return (
            <React.Fragment key={job.id}>
              <TableRow>
                <TableCell headerLabel={t("jobDetail.table.taskId")}>
                  <a
                    href={`/admin/harvesters/${slug}/jobs/${job.id}`}
                    className="text-primary-600 underline uppercase text-xs"
                  >
                    {job.id}
                  </a>
                </TableCell>
                <TableCell headerLabel={t("jobDetail.table.status")}>
                  <StatusDot
                    variant={
                      job.status === "done"
                        ? "success"
                        : failed
                          ? "danger"
                          : "informative"
                    }
                  >
                    {jobStatusLabels[job.status] || job.status}
                  </StatusDot>
                </TableCell>
                <TableCell headerLabel={t("jobDetail.startedAt")}>
                  {job.started
                    ? new Date(job.started).toLocaleString("pt-PT", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </TableCell>
                <TableCell headerLabel={t("jobDetail.table.completedAt")}>
                  {job.ended
                    ? new Date(job.ended).toLocaleString("pt-PT", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </TableCell>
                <TableCell headerLabel={t("columns.datasets")}>{totalCount}</TableCell>
                <TableCell headerLabel={t("columns.api")}>{job.errors?.length || 0}</TableCell>
                <TableCell headerLabel={t("jobDetail.table.completed")}>{doneCount}</TableCell>
                <TableCell headerLabel={t("jobDetail.table.skipped")}>{skippedCount}</TableCell>
                <TableCell headerLabel={t("jobDetail.table.archived")}>{archivedCount}</TableCell>
                <TableCell headerLabel={t("jobDetail.table.failed")}>{failedCount}</TableCell>
                <TableCell headerLabel={t("jobDetail.table.logs")}>
                  {failed && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(job.id)}
                      title={
                        expanded
                          ? t("jobDetail.table.closeLogs")
                          : t("jobDetail.jobs.viewLogs")
                      }
                      className="flex items-center gap-4 text-xs text-primary-600 hover:text-primary-800 transition-colors"
                    >
                      <Icon
                        name={expanded ? "agora-solid-chevron-up" : "agora-line-chevron-down"}
                        className="w-16 h-16"
                      />
                    </button>
                  )}
                </TableCell>
              </TableRow>

              {failed && expanded && (
                <TableRow>
                  <TableCell
                    headerLabel={t("jobDetail.table.logs")}
                    colSpan={TOTAL_COLUMNS}
                    className="bg-neutral-50 px-24 py-16"
                  >
                    <JobLogsPanel job={job} />
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          );
        })}
      </TableBody>
    </AdminPaginatedTable>
  );
}
