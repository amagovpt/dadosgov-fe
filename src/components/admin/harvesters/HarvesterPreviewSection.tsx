"use client";

import React from "react";
import { Button } from "@ama-pt/agora-design-system";
import HarvesterPreviewResult from "@/components/admin/harvesters/HarvesterPreviewResult";
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
      <HarvesterPreviewResult
        isPreviewing={isPreviewing}
        previewJob={previewJob}
        previewError={previewError}
        showEmptyErrorText
        showPendingCount
      />

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
