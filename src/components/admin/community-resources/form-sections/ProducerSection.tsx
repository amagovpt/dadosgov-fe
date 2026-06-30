"use client";

import React from "react";
import type { DropdownSectionProps } from "@ama-pt/agora-design-system";
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
  return (
    <ProducerIdentitySection
      producerOptions={producerOptions}
      selectedProducerRef={selectedProducerRef}
      helperDescription={
        <>
          Quando o conjunto de dados for produzido no contexto de atividade profissional, é
          recomendável que seja publicado em nome da organização responsável.
        </>
      }
    />
  );
}
