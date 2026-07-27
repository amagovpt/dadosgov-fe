"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { InputText } from "@ama-pt/agora-design-system";

interface ResourceLinkSectionProps {
  resourceUrl: string;
  hasUrlError: boolean;
  onResourceUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ResourceLinkSection({
  resourceUrl,
  hasUrlError,
  onResourceUrlChange,
}: ResourceLinkSectionProps) {
  const { t } = useTranslation(["admin-common", "admin-community-resources"]);

  return (
    <>
      <h2 className="admin-page__section-title">
        {t("admin-community-resources:form.reuse")}
      </h2>

      <div className="admin-page__fields-group">
        <InputText
          label={t("admin-community-resources:form.exactFileLinkRequired")}
          placeholder={t("admin-community-resources:form.exactFileLinkPlaceholder")}
          id="resource-url"
          value={resourceUrl}
          onChange={onResourceUrlChange}
          hasError={hasUrlError}
          hasFeedback={hasUrlError}
          feedbackState="danger"
          errorFeedbackText={t("admin-common:forms.requiredField")}
        />
      </div>
    </>
  );
}
