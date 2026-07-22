"use client";

import React, { useMemo } from "react";
import { StatusCard } from "@ama-pt/agora-design-system";
import type { DropdownSectionProps } from "@ama-pt/agora-design-system";
import AdminSelectAdapter from "@/components/admin/AdminSelectAdapter";
import { renderDropdownSection } from "@/components/admin/community-resources/config/dropdownOptions";

interface UserOrganization {
  id: string;
  name: string;
}

interface DataserviceProducerSectionProps {
  /** Only organizations eligible to publish an API (public-service badge). */
  organizations: UserOrganization[];
  initialValue?: string;
  onValueChange?: (value: string) => void;
}

export default function DataserviceProducerSection({
  organizations,
  initialValue,
  onValueChange,
}: DataserviceProducerSectionProps) {
  const producerOptions = useMemo(
    () =>
      // No personal ("Eu próprio") option: an API can only be published in the
      // name of an organization with the "Serviço público" badge.
      renderDropdownSection(
        "identity",
        organizations.map((organization) => ({
          value: organization.id,
          label: organization.name,
        })),
      ) as
        | React.ReactElement<DropdownSectionProps>
        | React.ReactElement<DropdownSectionProps>[],
    [organizations],
  );

  return (
    <>
      <h2 className="admin-page__section-title">Produtor</h2>

      {organizations.length === 0 ? (
        <StatusCard
          variant="warning"
          showIcon
          description={
            <>
              Só é possível publicar uma API em nome de uma organização com o emblema
              &quot;Serviço público&quot;. A sua conta não pertence a nenhuma organização
              elegível, por isso não pode criar uma API.
            </>
          }
        />
      ) : (
        <>
          <AdminSelectAdapter
            label="Organização em nome da qual a API será publicada."
            placeholder="Selecione a organização..."
            id="producer-identity"
            initialValue={initialValue}
            onValueChange={onValueChange}
          >
            {producerOptions}
          </AdminSelectAdapter>
          <p className="admin-page__field-helper mt-8 text-sm text-neutral-700">
            As APIs só podem ser publicadas em nome de uma organização com o emblema
            &quot;Serviço público&quot;.
          </p>
        </>
      )}
    </>
  );
}
