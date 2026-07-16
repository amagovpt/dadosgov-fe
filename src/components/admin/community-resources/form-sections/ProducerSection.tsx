"use client";

import React from "react";
import type { DropdownSectionProps } from "@ama-pt/agora-design-system";
import ProducerIdentitySection from "@/components/admin/forms/ProducerIdentitySection";
import type { AdminHelpBlock } from "@/service/types/admin/common";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";

interface ProducerSectionProps {
  producerOptions:
    | React.ReactElement<DropdownSectionProps>
    | React.ReactElement<DropdownSectionProps>[];
  selectedProducerRef: React.RefObject<string>;
  helper?: AdminHelpBlock;
}

export default function ProducerSection({
  producerOptions,
  selectedProducerRef,
  helper,
}: ProducerSectionProps) {
  return (
    <ProducerIdentitySection
      producerOptions={producerOptions}
      selectedProducerRef={selectedProducerRef}
      helperDescription={helper ? stripHtmlTags(helper.description) : undefined}
    />
  );
}
