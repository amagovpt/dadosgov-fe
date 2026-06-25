"use client";

import React from "react";
import {
  Button,
  DropdownOption,
  DropdownSection,
  InputSelect,
  StatusCard,
} from "@ama-pt/agora-design-system";
import type { OrganizationSuggestion } from "@/service/types/identity";

interface OrganizationSelectionStepProps {
  orgSuggestions: OrganizationSuggestion[];
  onSearchChange: (value: string) => void;
  onSelectOrganization: (organizationId: string) => void;
  onCreateOrganization: () => void;
}

export default function OrganizationSelectionStep({
  orgSuggestions,
  onSearchChange,
  onSelectOrganization,
  onCreateOrganization,
}: OrganizationSelectionStepProps) {
  return (
    <div className="admin-page__form">
      <StatusCard
        variant="informative"
        showIcon
        description={
          <>
            <strong>Inscreva-se numa organização</strong>
            <br />
            Uma organização é uma entidade na qual os utilizadores podem colaborar. Conjuntos de
            dados publicados dentro de uma organização podem ser editados pelos seus membros.
          </>
        }
      />

      <div>
        <InputSelect
          label="Organização"
          placeholder="Pesquisar uma organização em dados.gov.pt..."
          id="search-organization"
          searchable
          searchInputPlaceholder="Escreva para pesquisar..."
          searchNoResultsText="Nenhum resultado encontrado"
          onSearchInputChange={onSearchChange}
          onChange={(options: { value?: string }[]) => {
            const selectedId = options?.[0]?.value;
            if (selectedId) {
              onSelectOrganization(selectedId);
            }
          }}
        >
          <DropdownSection name="organizations">
            {orgSuggestions.map((organization) => (
              <DropdownOption key={organization.id} value={organization.id}>
                {organization.name}
              </DropdownOption>
            ))}
          </DropdownSection>
        </InputSelect>

        <div className="admin-page__divider-or">
          <span className="admin-page__divider-or-text">ou</span>
        </div>

        <div className="mt-16 flex justify-center">
          <Button variant="primary" onClick={onCreateOrganization}>
            Criar uma organização
          </Button>
        </div>
      </div>
    </div>
  );
}
