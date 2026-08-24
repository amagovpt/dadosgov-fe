"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  DropdownOption,
  type DropdownSectionProps,
  DropdownSection,
  StatusCard,
} from "@ama-pt/agora-design-system";
import AdminSelectAdapter from "@/components/admin/AdminSelectAdapter";

interface HarvesterProducerSectionProps {
  organizations: Array<{ id: string; name: string }>;
  selectedProducerRef: React.RefObject<string>;
  hasProducerError: boolean;
  onProducerChange: (value: string) => void;
  /** Search the whole catalogue server-side instead of a fixed list. */
  searchable?: boolean;
  onSearch?: (query: string) => void;
  searchNoResultsText?: string;
  /** The user belongs to no organization they may publish a harvester for. */
  hasNoEligibleOrganization?: boolean;
}

export default function HarvesterProducerSection({
  organizations,
  selectedProducerRef,
  hasProducerError,
  onProducerChange,
  searchable,
  onSearch,
  searchNoResultsText,
  hasNoEligibleOrganization,
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

      {hasNoEligibleOrganization ? (
        <StatusCard
          variant="warning"
          showIcon
          description={
            <>
              {t("fields.producerNoEligibleOrg")}{" "}
              <Link href="/admin/organizations/new" className="admin-page__org-card-link">
                {t("fields.producerCreateOrganization")}
              </Link>
            </>
          }
        />
      ) : (
        <div className="admin-page__fields-group">
          <AdminSelectAdapter
            label={t("fields.producerLabel")}
            placeholder={t("fields.producerPlaceholder")}
            id="harvester-producer"
            valueRef={selectedProducerRef}
            onValueChange={onProducerChange}
            hasError={hasProducerError}
            errorMessage={t("fields.producerError")}
            searchable={searchable}
            onSearch={onSearch}
            searchInputPlaceholder={t("fields.producerSearchPlaceholder")}
            searchNoResultsText={searchNoResultsText}
            required
          >
            {producerOptions}
          </AdminSelectAdapter>
        </div>
      )}
    </>
  );
}
