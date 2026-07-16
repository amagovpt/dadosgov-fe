"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { StatusCard } from "@ama-pt/agora-design-system";
import AdminStepActions from "@/components/admin/forms/AdminStepActions";
import DataserviceDatasetLinksSection from "@/components/admin/dataservices/form-sections/DataserviceDatasetLinksSection";
import type { AdminHelpBlock } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface ApiRegistrationDatasetsStepProps {
  datasetLinks: { url: string }[];
  datasetLinkErrors: Record<number, string>;
  onDatasetUrlChange: (index: number, value: string) => void;
  onRemoveDatasetLink: (index: number) => void;
  onAddDatasetLink: () => void;
  onPreviousStep: () => void;
  onNextStep: () => void;
  datasetLinksInfo?: AdminHelpBlock;
}

export default function ApiRegistrationDatasetsStep({
  datasetLinks,
  datasetLinkErrors,
  onDatasetUrlChange,
  onRemoveDatasetLink,
  onAddDatasetLink,
  onPreviousStep,
  onNextStep,
  datasetLinksInfo,
}: ApiRegistrationDatasetsStepProps) {
  const { t } = useTranslation("admin-dataservices");

  return (
    <>
      {datasetLinksInfo ? (
        <StatusCard
          variant="informative"
          showIcon
          description={
            datasetLinksInfo.title ? (
              <>
                <strong>{datasetLinksInfo.title}</strong>
                <br />
                {formatHtmlParagraphs(datasetLinksInfo.description)}
              </>
            ) : (
              formatHtmlParagraphs(datasetLinksInfo.description)
            )
          }
        />
      ) : null}

      <form
        className="admin-page__form"
        onSubmit={(event) => {
          event.preventDefault();
          onNextStep();
        }}
      >
        <DataserviceDatasetLinksSection
          datasetLinks={datasetLinks}
          datasetLinkErrors={datasetLinkErrors}
          onDatasetUrlChange={onDatasetUrlChange}
          onRemoveDatasetLink={onRemoveDatasetLink}
          onAddDatasetLink={onAddDatasetLink}
        />

        <AdminStepActions
          previousAction={{
            label: t("form.previous"),
            appearance: "outline",
            variant: "neutral",
            onClick: onPreviousStep,
          }}
          primaryAction={{
            label: t("form.next"),
            type: "submit",
            hasIcon: true,
            trailingIcon: "agora-line-arrow-right-circle",
            trailingIconHover: "agora-solid-arrow-right-circle",
          }}
        />
      </form>
    </>
  );
}
