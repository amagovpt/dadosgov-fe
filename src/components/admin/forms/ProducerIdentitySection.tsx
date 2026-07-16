"use client";

import React from "react";
import Link from "next/link";
import type { DropdownSectionProps } from "@ama-pt/agora-design-system";
import AppIcon from "@/components/Primitives/AppIcon";
import AdminSelectAdapter from "@/components/admin/AdminSelectAdapter";

interface ProducerIdentitySectionProps {
  producerOptions:
    | React.ReactElement<DropdownSectionProps>
    | React.ReactElement<DropdownSectionProps>[];
  selectedProducerRef?: React.RefObject<string>;
  initialValue?: string;
  onValueChange?: (value: string) => void;
  helperDescription: React.ReactNode;
}

export default function ProducerIdentitySection({
  producerOptions,
  selectedProducerRef,
  initialValue,
  onValueChange,
  helperDescription,
}: ProducerIdentitySectionProps) {
  return (
    <>
      <h2 className="admin-page__section-title">Produtor</h2>

      <AdminSelectAdapter
        label="Verifique a identidade que deseja usar na publicação."
        placeholder="Para pesquisar..."
        id="producer-identity"
        valueRef={selectedProducerRef}
        initialValue={initialValue}
        onValueChange={onValueChange}
      >
        {producerOptions}
      </AdminSelectAdapter>

      <div className="admin-page__org-card">
        <p className="admin-page__org-card-title">Não pertence a nenhuma organização.</p>
        <p className="admin-page__org-card-description">{helperDescription}</p>
        <Link href="/admin/organizations/new" className="admin-page__org-card-link">
          Crie ou integre uma organização em dados.gov.pt
          <AppIcon name="agora-line-arrow-right-circle" className="h-24 w-24" />
        </Link>
      </div>
    </>
  );
}
