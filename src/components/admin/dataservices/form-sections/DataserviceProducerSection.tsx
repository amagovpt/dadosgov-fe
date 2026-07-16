"use client";

import React, { useMemo } from "react";
import type { DropdownSectionProps } from "@ama-pt/agora-design-system";
import ProducerIdentitySection from "@/components/admin/forms/ProducerIdentitySection";
import { buildProducerItems, renderDropdownSection } from "@/components/admin/community-resources/config/dropdownOptions";
import type { AdminHelpBlock } from "@/service/types/admin/common";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";

interface UserOrganization {
  id: string;
  name: string;
}

interface DataserviceProducerSectionProps {
  displayName: string;
  organizations: UserOrganization[];
  helper?: AdminHelpBlock;
}

export default function DataserviceProducerSection({
  displayName,
  organizations,
  helper,
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
      helperDescription={helper ? stripHtmlTags(helper.description) : undefined}
    />
  );
}
