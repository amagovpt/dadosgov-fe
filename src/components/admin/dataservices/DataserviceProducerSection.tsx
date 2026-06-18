"use client";

import React, { useMemo } from "react";
import type { DropdownSectionProps } from "@ama-pt/agora-design-system";
import ProducerIdentitySection from "@/components/admin/forms/ProducerIdentitySection";
import { buildProducerItems, renderDropdownSection } from "@/components/admin/community-resources/dropdownOptions";

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
          Recomendamos que publique em nome de uma organização se se tratar de uma atividade
          profissional.
        </>
      }
    />
  );
}
