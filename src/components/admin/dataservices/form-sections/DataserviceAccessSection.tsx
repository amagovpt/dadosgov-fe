"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import {
  DropdownOption,
  DropdownSection,
  InputSelect,
  InputText,
  RadioButton,
} from "@ama-pt/agora-design-system";

type Option = {
  value: string;
  label: string;
};

type AudienceRole = {
  role: string;
  label: string;
};

interface DataserviceAccessSectionProps {
  accessType: string;
  authRequestUrl: string;
  businessDocUrl: string;
  idPrefix?: string;
  accountAccessValue?: string;
  accessAudiences?: Record<string, string>;
  audienceRoles?: AudienceRole[];
  audienceConditions?: Option[];
  reasonCategory?: string;
  restrictionReasons?: Option[];
  reasonText?: string;
  onAccessTypeChange: (value: string) => void;
  onAuthRequestUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBusinessDocUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAudienceChange?: (role: string, condition: string) => void;
  onReasonCategoryChange?: (value: string) => void;
  onReasonTextChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function DataserviceAccessSection({
  accessType,
  authRequestUrl,
  businessDocUrl,
  idPrefix = "api",
  accountAccessValue = "account",
  accessAudiences = {},
  audienceRoles = [],
  audienceConditions = [],
  reasonCategory = "",
  restrictionReasons = [],
  reasonText = "",
  onAccessTypeChange,
  onAuthRequestUrlChange,
  onBusinessDocUrlChange,
  onAudienceChange,
  onReasonCategoryChange,
  onReasonTextChange,
}: DataserviceAccessSectionProps) {
  const { t } = useTranslation("admin-dataservices");
  const showRestrictedFields =
    accessType === "restricted" &&
    audienceRoles.length > 0 &&
    audienceConditions.length > 0 &&
    onAudienceChange;

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
              id={`${idPrefix}-access-open`}
              name={`${idPrefix}-access-type`}
              checked={accessType === "open"}
              onChange={() => onAccessTypeChange("open")}
            />
            <RadioButton
              label={t("fields.accessAccount")}
              id={`${idPrefix}-access-account`}
              name={`${idPrefix}-access-type`}
              checked={accessType === accountAccessValue}
              onChange={() => onAccessTypeChange(accountAccessValue)}
            />
            <RadioButton
              label={t("fields.accessRestricted")}
              id={`${idPrefix}-access-restricted`}
              name={`${idPrefix}-access-type`}
              checked={accessType === "restricted"}
              onChange={() => onAccessTypeChange("restricted")}
            />
          </div>
        </div>

        {showRestrictedFields && (
          <>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {audienceRoles.map((role) => (
                <InputSelect
                  key={role.role}
                  label={role.label}
                  placeholder={t("fields.selectOption")}
                  id={`${idPrefix}-access-audience-${role.role}`}
                  onChange={(options) =>
                    onAudienceChange(role.role, (options[0]?.value as string) || "")
                  }
                >
                  <DropdownSection name={`audience-${role.role}`}>
                    {audienceConditions.map((condition) => (
                      <DropdownOption
                        key={condition.value}
                        value={condition.value}
                        selected={accessAudiences[role.role] === condition.value}
                      >
                        {condition.label}
                      </DropdownOption>
                    ))}
                  </DropdownSection>
                </InputSelect>
              ))}
            </div>

            {restrictionReasons.length > 0 && onReasonCategoryChange && (
              <InputSelect
                label={t("fields.restrictionReason")}
                placeholder={t("fields.selectOption")}
                id={`${idPrefix}-access-reason-category`}
                onChange={(options) =>
                  onReasonCategoryChange((options[0]?.value as string) || "")
                }
              >
                <DropdownSection name="reason-category">
                  {restrictionReasons.map((reason) => (
                    <DropdownOption
                      key={reason.value}
                      value={reason.value}
                      selected={reasonCategory === reason.value}
                    >
                      {reason.label}
                    </DropdownOption>
                  ))}
                </DropdownSection>
              </InputSelect>
            )}

            {reasonCategory === "other" && onReasonTextChange && (
              <InputText
                label={t("fields.restrictionReasonText")}
                placeholder={t("fields.restrictionReasonTextPlaceholder")}
                id={`${idPrefix}-access-reason-text`}
                value={reasonText}
                onChange={onReasonTextChange}
              />
            )}
          </>
        )}

        <InputText
          label={t("fields.authRequestUrl")}
          placeholder={t("fields.urlPlaceholder")}
          id={`${idPrefix}-auth-tool`}
          value={authRequestUrl}
          onChange={onAuthRequestUrlChange}
        />
        <InputText
          label={t("fields.businessDocUrl")}
          placeholder={t("fields.urlPlaceholder")}
          id={`${idPrefix}-doc-commercial`}
          value={businessDocUrl}
          onChange={onBusinessDocUrlChange}
        />
      </div>
    </>
  );
}
