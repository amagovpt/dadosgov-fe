"use client";

import { useId } from "react";
import { useTranslation } from "react-i18next";
import FileUploadModal from "@/components/admin/FileUploadModal";
import { DatasetResourcesTable } from "../resources/DatasetResourcesTable";
import { DatasetWizardHelp } from "../publication-wizard/DatasetWizardHelp";
import { getResourceDatasetAuxiliarItems } from "../config/datasetsAuxiliarItems";
import { can } from "@/utils/permissions";
import type { AdminAuxiliaryItem, AdminHelpBlock } from "@/service/types/admin/common";
import type { Dataset, Resource } from "@/service/types/dataset";
import type { ResourceType } from "@/service/types/catalog";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface DatasetsEditResourcesTabProps {
  dataset: Dataset;
  isSubmitting: boolean;
  resourceTypes: ResourceType[];
  allowedExtensions: string[] | null;
  auxiliaryItems?: AdminAuxiliaryItem[];
  introduction?: AdminHelpBlock;
  onFilesUpload: (files: File[]) => Promise<void>;
  onUrlAdd: (url: string) => Promise<void>;
  onResourceClick: (resource: Resource) => void;
  onResourceDelete: (resource: Resource, onDeleted: () => void) => void;
}

export default function DatasetsEditResourcesTab({
  dataset,
  isSubmitting,
  resourceTypes,
  allowedExtensions,
  auxiliaryItems,
  introduction,
  onFilesUpload,
  onUrlAdd,
  onResourceClick,
  onResourceDelete,
}: DatasetsEditResourcesTabProps) {
  const { t } = useTranslation("admin-datasets");
  const inputId = useId();
  const canManage = can(dataset, "edit_resources") && !dataset.deleted;
  const helpItems = getResourceDatasetAuxiliarItems(auxiliaryItems);
  const formatsHelp = {
    title: t("resources.formatsHelpTitle"),
    content: (
      <>
        {introduction && formatHtmlParagraphs(introduction.description)}
        {helpItems[0]?.content}
        {!!allowedExtensions?.length && (
          <p className="mt-16">
            {t("resources.allowedFiles", { extensions: allowedExtensions.join(", ") })}
          </p>
        )}
      </>
    ),
  };
  const metadataHelp = {
    title: t("resources.metadataHelpTitle"),
    content: (
      <>
        <p>{t("resources.metadataHelp")}</p>
        {helpItems[1]?.content}
      </>
    ),
  };
  return (
    <div className="flex min-w-0 flex-col gap-64" aria-busy={isSubmitting}>
      <section
        className="flex w-full max-w-[800px] flex-col gap-32"
        aria-labelledby={`${inputId}-add-title`}
      >
        <p className="text-s-regular text-primary-900">{t("form.optionalFields")}</p>
        <div className="flex flex-col gap-8 text-primary-900">
          <h2 id={`${inputId}-add-title`} className="text-xl-bold">
            {t("resources.addTitle")}
          </h2>
          <p className="max-w-[592px] text-m-regular">{t("resources.addDescription")}</p>
        </div>
        <fieldset disabled={isSubmitting || !canManage} className="min-w-0">
          <legend className="sr-only">{t("resources.addTitle")}</legend>
          <FileUploadModal
            appearance="wizard"
            saveMode="editor"
            inputId={`${inputId}-url`}
            disabled={isSubmitting || !canManage}
            uploadedFiles={[]}
            resourceUrls={[]}
            onFilesChange={onFilesUpload}
            onUrlAdd={onUrlAdd}
            allowedExtensions={allowedExtensions}
          />
        </fieldset>
        <DatasetWizardHelp item={formatsHelp} />
      </section>
      <div className="flex min-w-0 flex-col gap-32">
        <DatasetResourcesTable
          savedResources={dataset.resources}
          resourceTypes={resourceTypes}
          onResourceClick={onResourceClick}
          onResourceDelete={onResourceDelete}
          selectable={!!canManage}
        />
        <DatasetWizardHelp item={metadataHelp} />
        {helpItems.slice(2).map((item, index) => (
          <DatasetWizardHelp key={index} item={item} />
        ))}
      </div>
    </div>
  );
}
