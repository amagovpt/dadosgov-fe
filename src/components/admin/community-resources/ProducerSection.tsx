"use client";

import React from "react";
import type { DropdownSectionProps } from "@ama-pt/agora-design-system";
import { Icon } from "@ama-pt/agora-design-system";
import AdminSelectAdapter from "@/components/admin/AdminSelectAdapter";

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
    <>
      <h2 className="admin-page__section-title">Produtor</h2>

      <AdminSelectAdapter
        label="Verifique a identidade que deseja usar na publicação."
        placeholder="Para pesquisar..."
        id="producer-identity"
        valueRef={selectedProducerRef}
      >
        {producerOptions}
      </AdminSelectAdapter>

      <div className="admin-page__org-card">
        <p className="admin-page__org-card-title">Não pertence a nenhuma organização.</p>
        <p className="admin-page__org-card-description">
          Quando o conjunto de dados for produzido no contexto de atividade profissional, é
          recomendável que seja publicado em nome da organização responsável.
        </p>
        <a href="/pages/admin/organizations/new" className="admin-page__org-card-link">
          Crie ou integre uma organização em dados.gov.pt
          <Icon name="agora-line-arrow-right-circle" className="h-24 w-24" />
        </a>
      </div>
    </>
  );
}
