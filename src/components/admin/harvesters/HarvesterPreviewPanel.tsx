"use client";

import React from "react";
import { Icon, Pill, StatusCard } from "@ama-pt/agora-design-system";
import type { HarvestPreviewJob } from "@/service/types/harvester";

interface HarvesterPreviewPanelProps {
  isPreviewing: boolean;
  previewJob: HarvestPreviewJob | null;
  previewError: string | null;
}

export function HarvesterPreviewPanel({ isPreviewing, previewJob, previewError }: HarvesterPreviewPanelProps) {
  if (!isPreviewing && !previewJob && !previewError) return null;

  return (
    <div className="mt-24 flex flex-col gap-12">
      <h2 className="admin-page__section-title">Resultado da pré-visualização</h2>

      {isPreviewing && (
        <StatusCard
          variant="informative"
          showIcon
          description={<strong>A pré-visualizar o harvester... Por favor aguarde.</strong>}
        />
      )}

      {previewError && (
        <StatusCard
          variant="danger"
          showIcon
          description={<><strong>Erro</strong> — {previewError}</>}
        />
      )}

      {previewJob && (
        <>
          <div className="flex flex-col gap-6 text-sm text-neutral-800">
            <p className="flex items-center gap-8">
              <Icon name="agora-line-calendar" className="w-16 h-16" />
              <span>
                <strong>Iniciado em:</strong>{" "}
                {previewJob.started
                  ? new Date(previewJob.started).toLocaleString("pt-PT", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </span>
            </p>
            <p className="flex items-center gap-8">
              <Icon name="agora-line-calendar" className="w-16 h-16" />
              <span>
                <strong>Terminado em:</strong>{" "}
                {previewJob.ended
                  ? new Date(previewJob.ended).toLocaleString("pt-PT", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </span>
            </p>
            <p className="flex items-center gap-8">
              <strong>Estado:</strong>
              <Pill
                variant={
                  previewJob.status === "done"
                    ? "success"
                    : previewJob.status === "failed" || previewJob.status === "done-errors"
                      ? "danger"
                      : "neutral"
                }
              >
                {previewJob.status === "done"
                  ? "Concluído"
                  : previewJob.status === "failed"
                    ? "Erro"
                    : previewJob.status === "done-errors"
                      ? "Concluído com erros"
                      : "Em processamento"}
              </Pill>
            </p>
            <p className="flex items-center gap-12">
              <strong>Elementos:</strong>
              <span className="flex items-center gap-4">
                <Icon name="agora-line-check" className="w-16 h-16" />
                {previewJob.items.filter((i) => i.status === "done").length}
              </span>
              <span className="flex items-center gap-4">
                <Icon name="agora-line-alert-triangle" className="w-16 h-16" />
                {previewJob.items.filter((i) => i.status === "failed").length}
              </span>
              <span className="flex items-center gap-4">
                <Icon name="agora-line-info-mark" className="w-16 h-16" />
                {previewJob.items.filter((i) => i.status === "skipped").length}
              </span>
              ({previewJob.items.length} no total)
            </p>
          </div>

          {previewJob.errors.length > 0 && (
            <div className="flex flex-col gap-8">
              <p className="text-sm font-semibold text-neutral-900">Erros</p>
              {previewJob.errors.map((error, i) => (
                <StatusCard
                  key={i}
                  variant="danger"
                  showIcon
                  description={<><strong>ERRO</strong> {error.message}</>}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
