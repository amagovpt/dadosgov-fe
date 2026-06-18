"use client";

import React from "react";
import { Icon, Pill, StatusCard } from "@ama-pt/agora-design-system";
import type { HarvestPreviewJob } from "@/service/types/harvester";

interface HarvesterPreviewResultProps {
  isPreviewing: boolean;
  previewJob: HarvestPreviewJob | null;
  previewError: string | null;
  title?: string;
  className?: string;
  showEmptyErrorText?: boolean;
  showPendingCount?: boolean;
}

function formatPreviewDate(date?: string | null, isPreviewing?: boolean) {
  if (date) {
    return new Date(date).toLocaleString("pt-PT", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return isPreviewing ? "..." : "—";
}

function getStatusVariant(
  status?: HarvestPreviewJob["status"],
): "success" | "danger" | "neutral" {
  if (status === "done") return "success";
  if (status === "failed" || status === "done-errors") return "danger";
  return "neutral";
}

function getStatusLabel(status?: HarvestPreviewJob["status"], isPreviewing?: boolean) {
  if (status === "done") return "Concluído";
  if (status === "failed") return "Erro";
  if (status === "done-errors") return "Concluído com erros";
  if (status === "processing") return "Em processamento";
  return isPreviewing ? "Em processamento" : "Pendente";
}

export default function HarvesterPreviewResult({
  isPreviewing,
  previewJob,
  previewError,
  title,
  className = "flex flex-col gap-12",
  showEmptyErrorText = false,
  showPendingCount = false,
}: HarvesterPreviewResultProps) {
  const pendingCount =
    previewJob?.items.filter((item) => item.status === "pending" || item.status === "started")
      .length ?? 0;

  return (
    <div className={className}>
      {title ? <h2 className="admin-page__section-title">{title}</h2> : null}

      {isPreviewing && (
        <StatusCard
          variant="informative"
          showIcon
          description={
            title ? (
              <strong>A pré-visualizar o harvester... Por favor aguarde.</strong>
            ) : (
              <>
                <strong>A pré-visualizar o harvester...</strong>
                <br />
                Por favor aguarde enquanto o harvester é testado.
              </>
            )
          }
        />
      )}

      {previewError && title ? (
        <StatusCard
          variant="danger"
          showIcon
          description={
            <>
              <strong>Erro</strong> — {previewError}
            </>
          }
        />
      ) : null}

      <div className="mb-24 flex flex-col gap-8">
        <p className="flex items-center gap-6 text-sm text-neutral-900">
          <Icon name="agora-line-calendar" className="h-16 w-16" />
          Iniciado em: {formatPreviewDate(previewJob?.started, isPreviewing)}
        </p>
        <p className="flex items-center gap-6 text-sm text-neutral-900">
          <Icon name="agora-line-calendar" className="h-16 w-16" />
          Terminado em: {formatPreviewDate(previewJob?.ended, isPreviewing)}
        </p>
        <p className="flex items-center gap-6 text-sm text-neutral-900">
          Estado:{" "}
          <Pill variant={getStatusVariant(previewJob?.status)}>
            {getStatusLabel(previewJob?.status, isPreviewing)}
          </Pill>
        </p>
        <p className="flex items-center gap-12 text-sm text-neutral-900">
          Elementos:
          <span className="flex items-center gap-4">
            <Icon name="agora-line-check" className="h-16 w-16" />
            {previewJob?.items.filter((item) => item.status === "done").length ?? 0}
          </span>
          <span className="flex items-center gap-4">
            <Icon name="agora-line-alert-triangle" className="h-16 w-16" />
            {previewJob?.items.filter((item) => item.status === "failed").length ?? 0}
          </span>
          <span className="flex items-center gap-4">
            <Icon name="agora-line-info-mark" className="h-16 w-16" />
            {previewJob?.items.filter((item) => item.status === "skipped").length ?? 0}
          </span>
          {showPendingCount ? (
            <span className="flex items-center gap-4">
              <Icon name="agora-line-x" className="h-16 w-16" />
              {pendingCount}
            </span>
          ) : null}
          ({previewJob?.items.length ?? 0} no total)
        </p>
      </div>

      {title ? <h2 className="admin-page__section-title">Erros</h2> : null}

      {previewJob && previewJob.errors.length > 0 ? (
        previewJob.errors.map((error, index) => (
          <StatusCard
            key={index}
            variant="danger"
            showIcon
            description={
              <>
                <strong>ERRO</strong> {error.message}
              </>
            }
          />
        ))
      ) : previewError && !title ? (
        <StatusCard
          variant="danger"
          showIcon
          description={
            <>
              <strong>ERRO</strong> {previewError}
            </>
          }
        />
      ) : showEmptyErrorText && !isPreviewing ? (
        <p className="text-sm text-neutral-700">Nenhum erro encontrado.</p>
      ) : null}

      {title ? (
        <p className="mt-24 text-sm font-semibold uppercase text-neutral-700">
          {previewJob?.items.length ?? 0} itens
        </p>
      ) : null}
    </div>
  );
}
