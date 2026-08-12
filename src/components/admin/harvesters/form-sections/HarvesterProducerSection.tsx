"use client";

import React from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("admin-harvesters");
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
      <h2 className="admin-page__section-title">{t("fields.producer")}</h2>

      <div className="admin-page__fields-group">
        <AdminSelectAdapter
          label={t("fields.producerLabel")}
          placeholder={t("fields.producerPlaceholder")}
          id="harvester-producer"
          valueRef={selectedProducerRef}
          onValueChange={onProducerChange}
          hasError={hasProducerError}
          errorMessage={t("fields.producerError")}
          required
        >
          {producerOptions}
        </AdminSelectAdapter>
      </div>
    </>
  );
}
