"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { StatusCard } from "@ama-pt/agora-design-system";
import AdminStepActions from "@/components/admin/forms/AdminStepActions";
import type { AdminCard } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface OrganizationSuccessStepProps {
  onPrevious: () => void;
  onFinish: () => void;
  createdCard?: AdminCard;
}

export default function OrganizationSuccessStep({
  onPrevious,
  onFinish,
  createdCard,
}: OrganizationSuccessStepProps) {
  const { t } = useTranslation(["admin-common", "admin-organizations"]);

  return (
    <div className="admin-page__form">
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

      <AdminStepActions
        previousAction={{
          label: t("admin-organizations:form.previous"),
          appearance: "outline",
          variant: "neutral",
          onClick: onPrevious,
        }}
        primaryAction={{
          label: t("admin-common:actions.save"),
          hasIcon: true,
          trailingIcon: "agora-line-check-circle",
          trailingIconHover: "agora-solid-check-circle",
          onClick: onFinish,
        }}
      />
    </div>
  );
}
