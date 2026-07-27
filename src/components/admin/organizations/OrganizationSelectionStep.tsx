"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  DropdownOption,
  DropdownSection,
  InputSelect,
  StatusCard,
} from "@ama-pt/agora-design-system";
import type { OrganizationSuggestion } from "@/service/types/identity";
import type { AdminHelpBlock } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface OrganizationSelectionStepProps {
  orgSuggestions: OrganizationSuggestion[];
  onSearchChange: (value: string) => void;
  onSelectOrganization: (organizationId: string) => void;
  onCreateOrganization: () => void;
  introduction?: AdminHelpBlock;
}

export default function OrganizationSelectionStep({
  orgSuggestions,
  onSearchChange,
  onSelectOrganization,
  onCreateOrganization,
  introduction,
}: OrganizationSelectionStepProps) {
  const { t } = useTranslation("admin-organizations");

  return (
    <div className="admin-page__form">
      {introduction ? (
        <StatusCard
          variant="informative"
          showIcon
          description={
            <>
              <strong>{introduction.title}</strong>
              <br />
              {formatHtmlParagraphs(introduction.description)}
            </>
          }
        />
      ) : null}

      <div>
        <InputSelect
          label={t("form.organizationLabel")}
          placeholder={t("form.organizationPlaceholder")}
          id="search-organization"
          searchable
          searchInputPlaceholder={t("form.searchInputPlaceholder")}
          searchNoResultsText={t("form.noResults")}
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
          <span className="admin-page__divider-or-text">{t("form.or")}</span>
        </div>

        <div className="mt-16 flex justify-center">
          <Button variant="primary" onClick={onCreateOrganization}>
            {t("form.createOrganization")}
          </Button>
        </div>
      </div>
    </div>
  );
}
