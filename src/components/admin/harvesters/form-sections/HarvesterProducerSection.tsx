"use client";

import React from "react";
import {
  DropdownOption,
  type DropdownSectionProps,
  DropdownSection,
} from "@ama-pt/agora-design-system";
import AdminSelectAdapter from "@/components/admin/AdminSelectAdapter";

interface HarvesterProducerSectionProps {
  organizations: Array<{ id: string; name: string }>;
  selectedProducerRef: React.RefObject<string>;
  hasProducerError: boolean;
  onProducerChange: () => void;
}

export default function HarvesterProducerSection({
  organizations,
  selectedProducerRef,
  hasProducerError,
  onProducerChange,
}: HarvesterProducerSectionProps) {
  const producerOptions: React.ReactElement<DropdownSectionProps> = (
    <DropdownSection name="identity">
      {organizations.map((organization) => (
        <DropdownOption key={organization.id} value={organization.id}>
          {organization.name}
        </DropdownOption>
      ))}
    </DropdownSection>
  );

  return (
    <>
      <h2 className="admin-page__section-title">Produtor</h2>

      <div className="admin-page__fields-group">
        <AdminSelectAdapter
          label="Confirme a identidade que pretende utilizar na publicação. *"
          placeholder="Selecione o produtor..."
          id="harvester-producer"
          valueRef={selectedProducerRef}
          onValueChange={onProducerChange}
          hasError={hasProducerError}
          errorMessage="Selecione uma organização"
          required
        >
          {producerOptions}
        </AdminSelectAdapter>
      </div>
    </>
  );
}
