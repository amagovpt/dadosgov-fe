"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import AdminStepActions from "@/components/admin/forms/AdminStepActions";
import HarvesterPreviewResult from "@/components/admin/harvesters/form-ui/HarvesterPreviewResult";
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
  const { t } = useTranslation("admin-harvesters");

  return (
    <div className="admin-page__form">
      <HarvesterPreviewResult
        isPreviewing={isPreviewing}
        previewJob={previewJob}
        previewError={previewError}
        showEmptyErrorText
        showPendingCount
      />

      <AdminStepActions
        previousAction={{
          label: t("form.previous"),
          appearance: "outline",
          variant: "neutral",
          hasIcon: true,
          leadingIcon: "agora-line-arrow-left-circle",
          leadingIconHover: "agora-solid-arrow-left-circle",
          onClick: onPrevious,
        }}
        primaryAction={{
          label: isCreating ? t("form.creating") : t("form.next"),
          hasIcon: true,
          trailingIcon: "agora-line-arrow-right-circle",
          trailingIconHover: "agora-solid-arrow-right-circle",
          onClick: onCreate,
          disabled: isCreating,
        }}
      />
    </div>
  );
}
