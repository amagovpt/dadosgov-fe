"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { DropdownOption, DropdownSection, InputSelect } from "@ama-pt/agora-design-system";
import AdminExternalUrlFields from "@/components/admin/forms/AdminExternalUrlFields";

interface DataserviceDatasetLink {
  url: string;
}

interface DataserviceDatasetLinksSectionProps {
  datasetLinks: DataserviceDatasetLink[];
  datasetLinkErrors: Record<number, string>;
  onDatasetUrlChange: (index: number, value: string) => void;
  onRemoveDatasetLink: (index: number) => void;
  onAddDatasetLink: () => void;
}

export default function DataserviceDatasetLinksSection({
  datasetLinks,
  datasetLinkErrors,
  onDatasetUrlChange,
  onRemoveDatasetLink,
  onAddDatasetLink,
}: DataserviceDatasetLinksSectionProps) {
  const { t } = useTranslation("admin-dataservices");

  return (
    <>
      <InputSelect
        label={t("datasetLinks.searchLabel")}
        placeholder={t("datasetLinks.searchPlaceholder")}
        id="dataset-search"
      >
        <DropdownSection name="datasets">
          <DropdownOption value="dataset1">{t("datasetLinks.sampleDataset")}</DropdownOption>
        </DropdownSection>
      </InputSelect>

      <AdminExternalUrlFields
        entries={datasetLinks}
        errors={datasetLinkErrors}
        idPrefix="dataset-url"
        label={t("datasetLinks.linkLabel")}
        placeholder={t("fields.urlPlaceholder")}
        itemClassName="mt-16"
        removeButtonAppearance="link"
        onEntryChange={onDatasetUrlChange}
        onRemoveEntry={onRemoveDatasetLink}
        addLabel={t("datasetLinks.add")}
        onAddEntry={onAddDatasetLink}
      />
    </>
  );
}
