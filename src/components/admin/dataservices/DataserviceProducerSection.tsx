"use client";

import React from "react";
import { DropdownOption, DropdownSection, InputSelect } from "@ama-pt/agora-design-system";
import AppIcon from "@/components/Primitives/AppIcon";

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
  const options = [
    <DropdownOption key="user" value="user">
      {displayName}
    </DropdownOption>,
    ...organizations.map((organization) => (
      <DropdownOption key={organization.id} value={organization.id}>
        {organization.name}
      </DropdownOption>
    )),
  ];

  return (
    <>
      <h2 className="admin-page__section-title">Produtor</h2>

      <InputSelect
        label="Verifique a identidade que deseja usar na publicação."
        placeholder="Para pesquisar..."
        id="producer-identity"
      >
        <DropdownSection name="identity">{options}</DropdownSection>
      </InputSelect>

      <div className="admin-page__org-card">
        <p className="admin-page__org-card-title">Não pertence a nenhuma organização.</p>
        <p className="admin-page__org-card-description">
          Recomendamos que publique em nome de uma organização se se tratar de uma atividade
          profissional.
        </p>
        <a href="/pages/admin/organizations/new" className="admin-page__org-card-link">
          Crie ou integre uma organização em dados.gov.pt
          <AppIcon name="agora-line-arrow-right-circle" className="h-24 w-24" />
        </a>
      </div>
    </>
  );
}
