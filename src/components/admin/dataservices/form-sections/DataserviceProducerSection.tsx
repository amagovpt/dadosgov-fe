"use client";

import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { DropdownSectionProps } from "@ama-pt/agora-design-system";
import ProducerIdentitySection from "@/components/admin/forms/ProducerIdentitySection";
import { buildProducerItems, renderDropdownSection } from "@/components/admin/community-resources/config/dropdownOptions";

interface UserOrganization {
  id: string;
  name: string;
}

interface DataserviceProducerSectionProps {
  displayName: string;
  organizations: UserOrganization[];
}

export default function DataserviceProducerSection({
  displayName,
  organizations,
}: DataserviceProducerSectionProps) {
  const { t } = useTranslation("admin-dataservices");
  const producerOptions = useMemo(
    () =>
      renderDropdownSection(
        "identity",
        buildProducerItems(displayName, organizations),
      ) as
        | React.ReactElement<DropdownSectionProps>
        | React.ReactElement<DropdownSectionProps>[],
    [displayName, organizations],
  );

  return (
    <ProducerIdentitySection
      producerOptions={producerOptions}
      helperDescription={
        <>
          {t("form.producerHelper")}
        </>
      }
    />
  );
}
