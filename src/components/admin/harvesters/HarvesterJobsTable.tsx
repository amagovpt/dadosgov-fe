"use client";

import React from "react";
import { Button, CardNoResults, Icon } from "@ama-pt/agora-design-system";
import StatusDot from "@/components/admin/StatusDot";
import AdminListTable, { type AdminListColumn } from "@/components/admin/lists/AdminListTable";
import AdminPaginatedTable from "@/components/admin/lists/AdminPaginatedTable";
import type { HarvestJob } from "@/service/types/harvester";

const JOB_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  initializing: "A inicializar",
  initialized: "Inicializado",
  started: "Iniciado",
  processing: "Em processamento",
  done: "Terminado",
  "done-errors": "Falhado",
  failed: "Falhado",
};

interface HarvestJobRow extends HarvestJob {
  _doneCount: number;
  _skippedCount: number;
  _archivedCount: number;
  _failedCount: number;
}

function getJobRows(jobs: HarvestJob[]): HarvestJobRow[] {
  return jobs.map((job) => {
    const items = job.items || [];
    return {
      ...job,
      _doneCount: items.filter((item) => item.status === "done").length,
      _skippedCount: items.filter((item) => item.status === "skipped").length,
      _archivedCount: items.filter((item) => item.status === "archived").length,
      _failedCount: items.filter((item) => item.status === "failed").length,
    };
  });
}

function createColumns(slug: string): AdminListColumn<HarvestJobRow>[] {
  return [
    {
      id: "job_id",
      header: "ID de tarefa",
      headerLabel: "ID de tarefa",
      renderCell: (job) => (
        <a
          href={`/pages/admin/harvesters/${slug}/jobs/${job.id}`}
          className="text-primary-600 underline uppercase text-xs"
        >
          {job.id}
        </a>
      ),
    },
    {
      id: "status",
      header: "Status",
      headerLabel: "Status",
      renderCell: (job) => (
        <StatusDot
          variant={
            job.status === "done"
              ? "success"
              : job.status === "failed" || job.status === "done-errors"
                ? "danger"
                : "informative"
          }
        >
          {JOB_STATUS_LABELS[job.status] || job.status}
        </StatusDot>
      ),
    },
    {
      id: "started",
      header: "Começou em",
      headerLabel: "Começou em",
      renderCell: (job) =>
        job.started
          ? new Date(job.started).toLocaleString("pt-PT", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
    },
    {
      id: "ended",
      header: "Concluído em",
      headerLabel: "Concluído em",
      renderCell: (job) =>
        job.ended
          ? new Date(job.ended).toLocaleString("pt-PT", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
    },
    {
      id: "datasets",
      header: "Conjuntos de dados",
      headerLabel: "Conjuntos de dados",
      renderCell: (job) => job.items?.length || 0,
    },
    {
      id: "api_errors",
      header: "API",
      headerLabel: "API",
      renderCell: (job) => job.errors?.length || 0,
    },
    {
      id: "done",
      header: <Icon name="agora-line-check" className="w-16 h-16" />,
      headerLabel: "Concluídos",
      renderCell: (job) => job._doneCount,
    },
    {
      id: "skipped",
      header: <Icon name="agora-line-eye-off" className="w-16 h-16" />,
      headerLabel: "Ignorados",
      renderCell: (job) => job._skippedCount,
    },
    {
      id: "archived",
      header: <img src="/Icons/box.svg" alt="Arquivados" className="w-24 h-24" />,
      headerLabel: "Arquivados",
      renderCell: (job) => job._archivedCount,
    },
    {
      id: "failed",
      header: <Icon name="agora-line-x" className="w-16 h-16" />,
      headerLabel: "Falhados",
      renderCell: (job) => job._failedCount,
    },
  ];
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
  if (jobs.length === 0) {
    return (
      <CardNoResults
        icon={<Icon name="agora-line-edit" className="w-12 h-12 text-primary-500 icon-xl" />}
        title="Sem trabalhos no momento"
        position="center"
        hasAnchor={false}
        extraDescription={
          <div className="mt-24">
            <Button variant="primary" appearance="outline">
              Aceda às configurações
            </Button>
          </div>
        }
      />
    );
  }

  const rows = getJobRows(jobs);
  const columns = createColumns(slug);

  return (
    <AdminPaginatedTable
      pageSize={jobsPageSize}
      totalItems={jobsTotal}
      currentPage={jobsPage}
      setCurrentPage={setJobsPage}
      setPageSize={setJobsPageSize}
    >
      <AdminListTable items={rows} columns={columns} getRowKey={(job) => job.id} />
    </AdminPaginatedTable>
  );
}
