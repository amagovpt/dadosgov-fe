"use client";

import React from "react";
import { DropdownOption, DropdownSection } from "@ama-pt/agora-design-system";
import IsolatedSelect from "@/components/admin/IsolatedSelect";

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
  const options = organizations.map((organization) => (
    <DropdownOption key={organization.id} value={organization.id}>
      {organization.name}
    </DropdownOption>
  ));

  return (
    <>
      <h2 className="admin-page__section-title">Produtor</h2>

      <div className="admin-page__fields-group">
        <IsolatedSelect
          key={`producer-${organizations.length}`}
          label="Confirme a identidade que pretende utilizar na publicação. *"
          placeholder="Selecione o produtor..."
          id="harvester-producer"
          onChangeRef={selectedProducerRef}
          onChangeCallback={onProducerChange}
          hasError={hasProducerError}
          errorFeedbackText="Selecione uma organização"
          required
        >
          <DropdownSection name="identity">{options}</DropdownSection>
        </IsolatedSelect>
      </div>
    </>
  );
}
