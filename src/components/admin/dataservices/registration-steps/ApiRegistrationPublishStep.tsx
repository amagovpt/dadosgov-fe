"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Button, CardGeneral, StatusCard } from "@ama-pt/agora-design-system";
import PublicationFeedbackButton from "@/components/admin/PublicationFeedbackButton";
import type { Dataservice } from "@/service/types/dataservice";
import type { AdminCard } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface ApiRegistrationPublishStepProps {
  createdDataservice: Dataservice | null;
  apiName: string;
  apiDescription: string;
  createdCard?: AdminCard;
  apiError?: string | null;
  isPublishing: boolean;
  onPublish: () => void;
  onSaveDraft: () => void;
}

export default function ApiRegistrationPublishStep({
  createdDataservice,
  apiName,
  apiDescription,
  createdCard,
  apiError,
  isPublishing,
  onPublish,
  onSaveDraft,
}: ApiRegistrationPublishStepProps) {
  const { t } = useTranslation("admin-dataservices");

  return (
    <>
      {createdCard ? (
        <StatusCard
          variant="success"
          showIcon
          description={
            <>
              <strong>{createdCard.title}</strong>
              <br />
              {formatHtmlParagraphs(createdCard.description)}
            </>
          }
        />
      ) : null}

      {apiError && <StatusCard variant="danger" showIcon description={apiError} />}

      <CardGeneral
        variant="white-outline"
        isCardHorizontal
        isBlockedLink
        iconDefault="agora-line-layers-menu"
        iconHover="agora-solid-layers-menu"
        titleText={createdDataservice?.title || apiName || t("form.untitled")}
        descriptionText={
          createdDataservice?.description || apiDescription || t("form.noDescription")
        }
        anchor={{
          href: createdDataservice ? `/dataservices/${createdDataservice.id}` : "#",
          children: "",
        }}
      />

      <PublicationFeedbackButton />

      <div className="admin-page__actions flex justify-end gap-[18px]">
        <Button
          appearance="outline"
          variant="neutral"
          onClick={onSaveDraft}
          disabled={isPublishing}
        >
          {t("form.saveDraft")}
        </Button>
        <Button variant="primary" onClick={onPublish} disabled={isPublishing || !createdDataservice}>
          {isPublishing ? t("form.publishing") : t("form.publishApi")}
        </Button>
      </div>
    </>
  );
}
