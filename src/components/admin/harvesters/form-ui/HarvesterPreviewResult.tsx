"use client";

import React from "react";
import { useTranslation } from "react-i18next";
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

function formatPreviewDate(date: string | null | undefined, isPreviewing: boolean | undefined, emptyDate: string) {
  if (date) {
    return new Date(date).toLocaleString("pt-PT", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return isPreviewing ? "..." : emptyDate;
}

function getStatusVariant(
  status?: HarvestPreviewJob["status"],
): "success" | "danger" | "neutral" {
  if (status === "done") return "success";
  if (status === "failed" || status === "done-errors") return "danger";
  return "neutral";
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
  const { t } = useTranslation("admin-harvesters");
  const pendingCount =
    previewJob?.items.filter((item) => item.status === "pending" || item.status === "started")
      .length ?? 0;
  const getStatusLabel = (status?: HarvestPreviewJob["status"], isPreviewing?: boolean) => {
    if (status === "done") return t("preview.statusLabels.done");
    if (status === "failed") return t("preview.statusLabels.failed");
    if (status === "done-errors") return t("preview.statusLabels.doneErrors");
    if (status === "processing") return t("preview.statusLabels.processing");
    return isPreviewing ? t("preview.statusLabels.processing") : t("preview.statusLabels.pending");
  };

  return (
    <div className={className}>
      {title ? <h2 className="admin-page__section-title">{title}</h2> : null}

      {isPreviewing && (
        <StatusCard
          variant="informative"
          showIcon
          description={
            title ? (
              <strong>
                {t("preview.previewingStrong")} {t("preview.pleaseWait")}
              </strong>
            ) : (
              <>
                <strong>{t("preview.previewingStrong")}</strong>
                <br />
                {t("preview.pleaseWaitTesting")}
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
              <strong>{t("preview.error")}</strong> - {previewError}
            </>
          }
        />
      ) : null}

      <div className="mb-24 flex flex-col gap-8">
        <p className="flex items-center gap-6 text-sm text-neutral-900">
          <Icon name="agora-line-calendar" className="h-16 w-16" />
          {t("preview.startedAt")}:{" "}
          {formatPreviewDate(previewJob?.started, isPreviewing, t("preview.emptyDate"))}
        </p>
        <p className="flex items-center gap-6 text-sm text-neutral-900">
          <Icon name="agora-line-calendar" className="h-16 w-16" />
          {t("preview.endedAt")}:{" "}
          {formatPreviewDate(previewJob?.ended, isPreviewing, t("preview.emptyDate"))}
        </p>
        <p className="flex items-center gap-6 text-sm text-neutral-900">
          {t("preview.status")}:{" "}
          <Pill variant={getStatusVariant(previewJob?.status)}>
            {getStatusLabel(previewJob?.status, isPreviewing)}
          </Pill>
        </p>
        <p className="flex items-center gap-12 text-sm text-neutral-900">
          {t("preview.items")}:
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
          ({previewJob?.items.length ?? 0} {t("preview.total")})
        </p>
      </div>

      {title ? <h2 className="admin-page__section-title">{t("preview.errors")}</h2> : null}

      {previewJob && previewJob.errors.length > 0 ? (
        previewJob.errors.map((error, index) => (
          <StatusCard
            key={index}
            variant="danger"
            showIcon
            description={
              <>
                <strong>{t("preview.errorUpper")}</strong> {error.message}
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
              <strong>{t("preview.errorUpper")}</strong> {previewError}
            </>
          }
        />
      ) : showEmptyErrorText && !isPreviewing ? (
        <p className="text-sm text-neutral-700">{t("preview.noErrors")}</p>
      ) : null}

      {title ? (
        <p className="mt-24 text-sm font-semibold uppercase text-neutral-700">
          {t("preview.itemsCount", { count: previewJob?.items.length ?? 0 })}
        </p>
      ) : null}
    </div>
  );
}
