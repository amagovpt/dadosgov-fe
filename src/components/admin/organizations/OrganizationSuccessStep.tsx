"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { StatusCard } from "@ama-pt/agora-design-system";
import AdminStepActions from "@/components/admin/forms/AdminStepActions";

interface OrganizationSuccessStepProps {
  onPrevious: () => void;
  onFinish: () => void;
}

export default function OrganizationSuccessStep({
  onPrevious,
  onFinish,
}: OrganizationSuccessStepProps) {
  const { t } = useTranslation(["admin-common", "admin-organizations"]);

  return (
    <div className="admin-page__form">
      <StatusCard
        variant="success"
        showIcon
        description={
          <>
            <strong>{t("admin-organizations:form.successTitle")}</strong>
            <br />
            {t("admin-organizations:form.successDescription")}
          </>
        }
      />

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
