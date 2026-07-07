"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { InputText, RadioButton } from "@ama-pt/agora-design-system";

interface DataserviceAccessSectionProps {
  accessType: string;
  authRequestUrl: string;
  businessDocUrl: string;
  onAccessTypeChange: (value: string) => void;
  onAuthRequestUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBusinessDocUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function DataserviceAccessSection({
  accessType,
  authRequestUrl,
  businessDocUrl,
  onAccessTypeChange,
  onAuthRequestUrlChange,
  onBusinessDocUrlChange,
}: DataserviceAccessSectionProps) {
  const { t } = useTranslation("admin-dataservices");

  return (
    <>
      <h2 className="admin-page__section-title">{t("fields.access")}</h2>

      <div className="admin-page__fields-group">
        <div className="flex flex-col gap-8">
          <span className="text-primary-900 text-base font-medium leading-7">
            {t("fields.accessType")}
          </span>
          <div className="flex flex-row gap-4">
            <RadioButton
              label={t("fields.accessOpen")}
              id="access-open"
              name="access-type"
              checked={accessType === "open"}
              onChange={() => onAccessTypeChange("open")}
            />
            <RadioButton
              label={t("fields.accessAccount")}
              id="access-account"
              name="access-type"
              checked={accessType === "account"}
              onChange={() => onAccessTypeChange("account")}
            />
            <RadioButton
              label={t("fields.accessRestricted")}
              id="access-restricted"
              name="access-type"
              checked={accessType === "restricted"}
              onChange={() => onAccessTypeChange("restricted")}
            />
          </div>
        </div>
        <InputText
          label={t("fields.authRequestUrl")}
          placeholder={t("fields.urlPlaceholder")}
          id="api-auth-tool"
          value={authRequestUrl}
          onChange={onAuthRequestUrlChange}
        />
        <InputText
          label={t("fields.businessDocUrl")}
          placeholder={t("fields.urlPlaceholder")}
          id="api-doc-commercial"
          value={businessDocUrl}
          onChange={onBusinessDocUrlChange}
        />
      </div>
    </>
  );
}
