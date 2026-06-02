"use client";

import React from "react";
import {
  Button,
  CardNoResults,
  Icon,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@ama-pt/agora-design-system";
import StatusDot from "@/components/admin/StatusDot";
import { createPaginationProps } from "@/utils/createPaginationProps";
import type { HarvestJob } from "@/types/api";

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

  return (
    <Table
      paginationProps={createPaginationProps(
        jobsPageSize,
        jobsTotal,
        jobsPage,
        setJobsPage,
        setJobsPageSize,
      )}
    >
      <TableHeader>
        <TableRow>
          <TableHeaderCell>ID de tarefa</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Começou em</TableHeaderCell>
          <TableHeaderCell>Concluído em</TableHeaderCell>
          <TableHeaderCell>Conjuntos de dados</TableHeaderCell>
          <TableHeaderCell>API</TableHeaderCell>
          <TableHeaderCell>
            <Icon name="agora-line-check" className="w-16 h-16" />
          </TableHeaderCell>
          <TableHeaderCell>
            <Icon name="agora-line-eye-off" className="w-16 h-16" />
          </TableHeaderCell>
          <TableHeaderCell>
            <img src="/Icons/box.svg" alt="Arquivados" className="w-24 h-24" />
          </TableHeaderCell>
          <TableHeaderCell>
            <Icon name="agora-line-x" className="w-16 h-16" />
          </TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => {
          const items = job.items || [];
          const doneCount = items.filter((i) => i.status === "done").length;
          const skippedCount = items.filter((i) => i.status === "skipped").length;
          const archivedCount = items.filter((i) => i.status === "archived").length;
          const failedCount = items.filter((i) => i.status === "failed").length;
          return (
            <TableRow key={job.id}>
              <TableCell headerLabel="ID de tarefa">
                <a
                  href={`/pages/admin/harvesters/${slug}/jobs/${job.id}`}
                  className="text-primary-600 underline uppercase text-xs"
                >
                  {job.id}
                </a>
              </TableCell>
              <TableCell headerLabel="Status">
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
              </TableCell>
              <TableCell headerLabel="Começou em">
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
              <TableCell headerLabel="Concluído em">
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
              <TableCell headerLabel="Conjuntos de dados">{items.length}</TableCell>
              <TableCell headerLabel="API">{job.errors?.length || 0}</TableCell>
              <TableCell headerLabel="Concluídos">{doneCount}</TableCell>
              <TableCell headerLabel="Ignorados">{skippedCount}</TableCell>
              <TableCell headerLabel="Arquivados">{archivedCount}</TableCell>
              <TableCell headerLabel="Falhados">{failedCount}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
