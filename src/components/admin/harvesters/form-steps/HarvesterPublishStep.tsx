"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Button, StatusCard } from "@ama-pt/agora-design-system";
import PublicationFeedbackButton from "@/components/admin/PublicationFeedbackButton";
import type { AdminCard } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface HarvesterPublishStepProps {
  createError: string | null;
  onViewInAdmin: () => void;
  onRequestValidation: () => void;
  createdPendingCard?: AdminCard;
}

export default function HarvesterPublishStep({
  createError,
  onViewInAdmin,
  onRequestValidation,
  createdPendingCard,
}: HarvesterPublishStepProps) {
  const { t } = useTranslation("admin-harvesters");

  return (
    <div className="admin-page__form">
      {createError && (
        <StatusCard
          variant="danger"
          showIcon
          description={
            <>
              <strong>{t("form.createErrorTitle")}</strong>
              <br />
              {createError}
            </>
          }
        />
      )}

      {!createError && createdPendingCard && (
        <StatusCard
          variant="warning"
          showIcon
          description={
            <>
              <strong>{createdPendingCard.title}</strong>
              <br />
              {formatHtmlParagraphs(createdPendingCard.description)}
            </>
          }
        />
      )}

      <div className="mt-16 flex justify-start">
        <PublicationFeedbackButton />
      </div>

      <div className="admin-page__actions">
        <Button appearance="outline" variant="neutral" onClick={onViewInAdmin}>
          {t("form.viewInAdmin")}
        </Button>
        <Button
          appearance="outline"
          variant="neutral"
          hasIcon
          trailingIcon="agora-line-external-link"
          trailingIconHover="agora-solid-external-link"
          onClick={onRequestValidation}
        >
          {t("form.requestValidation")}
        </Button>
      </div>
    </div>
  );
}
