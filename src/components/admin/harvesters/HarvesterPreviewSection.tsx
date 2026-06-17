"use client";

import React from "react";
import { Button, Icon, Pill, StatusCard } from "@ama-pt/agora-design-system";
import type { HarvestPreviewJob } from "@/service/types/harvester";

interface HarvesterPreviewSectionProps {
  isPreviewing: boolean;
  previewJob: HarvestPreviewJob | null;
  previewError: string | null;
  isCreating: boolean;
  onPrevious: () => void;
  onCreate: () => void;
}

export default function HarvesterPreviewSection({
  isPreviewing,
  previewJob,
  previewError,
  isCreating,
  onPrevious,
  onCreate,
}: HarvesterPreviewSectionProps) {
  return (
    <div className="admin-page__form">
      {isPreviewing && (
        <StatusCard
          variant="informative"
          showIcon
          description={
            <>
              <strong>A pré-visualizar o harvester...</strong>
              <br />
              Por favor aguarde enquanto o harvester é testado.
            </>
          }
        />
      )}

      <div className="mb-24 flex flex-col gap-8">
        <p className="flex items-center gap-6 text-sm text-neutral-900">
          <Icon name="agora-line-calendar" className="h-16 w-16" />
          Iniciado em:{" "}
          {previewJob?.started
            ? new Date(previewJob.started).toLocaleString("pt-PT", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : isPreviewing
              ? "..."
              : "—"}
        </p>
        <p className="flex items-center gap-6 text-sm text-neutral-900">
          <Icon name="agora-line-calendar" className="h-16 w-16" />
          Terminado em:{" "}
          {previewJob?.ended
            ? new Date(previewJob.ended).toLocaleString("pt-PT", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : isPreviewing
              ? "..."
              : "—"}
        </p>
        <p className="flex items-center gap-6 text-sm text-neutral-900">
          Estado:{" "}
          <Pill
            variant={
              previewJob
                ? previewJob.status === "done"
                  ? "success"
                  : previewJob.status === "failed" || previewJob.status === "done-errors"
                    ? "danger"
                    : "neutral"
                : "neutral"
            }
          >
            {previewJob
              ? previewJob.status === "done"
                ? "Concluído"
                : previewJob.status === "failed"
                  ? "Erro"
                  : previewJob.status === "done-errors"
                    ? "Concluído com erros"
                    : previewJob.status === "processing"
                      ? "Em processamento"
                      : "Pendente"
              : isPreviewing
                ? "Em processamento"
                : "Pendente"}
          </Pill>
        </p>
        <p className="flex items-center gap-12 text-sm text-neutral-900">
          Elementos:
          <span className="flex items-center gap-4">
            <Icon name="agora-line-check" className="h-16 w-16" />{" "}
            {previewJob?.items.filter((item) => item.status === "done").length ?? 0}
          </span>
          <span className="flex items-center gap-4">
            <Icon name="agora-line-alert-triangle" className="h-16 w-16" />{" "}
            {previewJob?.items.filter((item) => item.status === "failed").length ?? 0}
          </span>
          <span className="flex items-center gap-4">
            <Icon name="agora-line-info-mark" className="h-16 w-16" />{" "}
            {previewJob?.items.filter((item) => item.status === "skipped").length ?? 0}
          </span>
          <span className="flex items-center gap-4">
            <Icon name="agora-line-x" className="h-16 w-16" />{" "}
            {previewJob?.items.filter(
              (item) => item.status === "pending" || item.status === "started",
            ).length ?? 0}
          </span>
          ({previewJob?.items.length ?? 0} no total)
        </p>
      </div>

      <h2 className="admin-page__section-title">Erros</h2>

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
      ) : previewError ? (
        <StatusCard
          variant="danger"
          showIcon
          description={
            <>
              <strong>ERRO</strong> {previewError}
            </>
          }
        />
      ) : !isPreviewing ? (
        <p className="text-sm text-neutral-700">Nenhum erro encontrado.</p>
      ) : null}

      <p className="mt-24 text-sm font-semibold uppercase text-neutral-700">
        {previewJob?.items.length ?? 0} itens
      </p>

      <div className="admin-page__actions">
        <Button
          appearance="outline"
          variant="neutral"
          hasIcon
          leadingIcon="agora-line-arrow-left-circle"
          leadingIconHover="agora-solid-arrow-left-circle"
          onClick={onPrevious}
        >
          Anterior
        </Button>
        <Button
          variant="primary"
          hasIcon
          trailingIcon="agora-line-arrow-right-circle"
          trailingIconHover="agora-solid-arrow-right-circle"
          onClick={onCreate}
          disabled={isCreating}
        >
          {isCreating ? "A criar..." : "Seguinte"}
        </Button>
      </div>
    </div>
  );
}
