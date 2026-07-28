"use client";

import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StatusCard } from "@ama-pt/agora-design-system";
import type { DropdownSectionProps } from "@ama-pt/agora-design-system";
import AdminSelectAdapter from "@/components/admin/AdminSelectAdapter";
import { renderDropdownSection } from "@/components/admin/community-resources/config/dropdownOptions";
import type { AdminHelpBlock } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface UserOrganization {
  id: string;
  name: string;
}

interface DataserviceProducerSectionProps {
  /** Only organizations eligible to publish an API (public-service badge). */
  organizations: UserOrganization[];
  helper?: AdminHelpBlock;
  initialValue?: string;
  onValueChange?: (value: string) => void;
}

export default function DataserviceProducerSection({
  organizations,
  helper,
  initialValue,
  onValueChange,
}: DataserviceProducerSectionProps) {
  const { t } = useTranslation(["admin-common", "admin-dataservices"]);
  const producerOptions = useMemo(
    () =>
      // No personal option: an API can only be published in the name of an
      // organization with the "public-service" badge.
      renderDropdownSection(
        "identity",
        organizations.map((organization) => ({
          value: organization.id,
          label: organization.name,
        })),
      ) as
        | React.ReactElement<DropdownSectionProps>
        | React.ReactElement<DropdownSectionProps>[],
    [organizations],
  );

  return (
    <>
      <h2 className="admin-page__section-title">{t("admin-common:forms.producerTitle")}</h2>

      {organizations.length === 0 ? (
        <StatusCard
          variant="warning"
          showIcon
          description={t("admin-dataservices:form.noEligibleOrganizationWarning")}
        />
      ) : (
        <>
          <AdminSelectAdapter
            label={t("admin-dataservices:form.producerOrganizationLabel")}
            placeholder={t("admin-dataservices:form.producerOrganizationPlaceholder")}
            id="producer-identity"
            initialValue={initialValue}
            onValueChange={onValueChange}
          >
            {producerOptions}
          </AdminSelectAdapter>
          <div className="admin-page__field-helper mt-8 text-sm text-neutral-700">
            {helper
              ? formatHtmlParagraphs(helper.description)
              : t("admin-dataservices:form.publicServiceProducerHelper")}
          </div>
        </>
      )}
    </>
  );
}
