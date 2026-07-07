"use client";

import React from "react";
import type { DropdownSectionProps } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import ProducerIdentitySection from "@/components/admin/forms/ProducerIdentitySection";

interface ProducerSectionProps {
  producerOptions:
    | React.ReactElement<DropdownSectionProps>
    | React.ReactElement<DropdownSectionProps>[];
  selectedProducerRef: React.RefObject<string>;
}

export default function ProducerSection({
  producerOptions,
  selectedProducerRef,
}: ProducerSectionProps) {
  const { t } = useTranslation("admin-community-resources");

  return (
    <ProducerIdentitySection
      producerOptions={producerOptions}
      selectedProducerRef={selectedProducerRef}
      helperDescription={t("form.producerHelper")}
    />
  );
}
