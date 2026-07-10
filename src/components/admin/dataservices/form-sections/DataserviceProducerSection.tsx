"use client";

import React, { useMemo } from "react";
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
  initialValue?: string;
  onValueChange?: (value: string) => void;
}

export default function DataserviceProducerSection({
  displayName,
  organizations,
  initialValue,
  onValueChange,
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
      initialValue={initialValue}
      onValueChange={onValueChange}
      helperDescription={
        <>
          Recomendamos que publique em nome de uma organização se se tratar de uma atividade
          profissional.
        </>
      }
    />
  );
}
