"use client";

import { useId } from "react";
import { useTranslation } from "react-i18next";
import FileUploadModal from "@/components/admin/FileUploadModal";
import type { ResourceUploadFeedback } from "@/components/admin/FileUploadModal/types";
import { DatasetResourcesTable } from "../resources/DatasetResourcesTable";
import { DatasetWizardHelp } from "../publication-wizard/DatasetWizardHelp";
import {
  getDatasetAuxiliarItem,
  getResourceDatasetAuxiliarItems,
} from "../config/datasetsAuxiliarItems";
import { DatasetContentDescription, useDatasetSection } from "../DatasetContentProvider";
import { can } from "@/utils/permissions";
import type { AdminAuxiliaryItem, AdminHelpBlock } from "@/service/types/admin/common";
import type { Dataset, Resource } from "@/service/types/dataset";
import type { ResourceType } from "@/service/types/catalog";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface DatasetsEditResourcesTabProps {
  uploadFeedback: ResourceUploadFeedback | null;
  onClearUploadFeedback: () => void;
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
  uploadFeedback,
  onClearUploadFeedback,
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
  const addSection = useDatasetSection("add-resources");
  const inputId = useId();
  const canManage = can(dataset, "edit_resources") && !dataset.deleted;
  const helpItems = getResourceDatasetAuxiliarItems(auxiliaryItems);
  const formatsItem = getDatasetAuxiliarItem(helpItems, "resource-formats");
  const documentationItem = getDatasetAuxiliarItem(helpItems, "resource-documentation");
  const formatsHelp = {
    title: formatsItem?.title ?? "",
    hidden: formatsItem?.hidden,
    content: (
      <>
        {introduction && formatHtmlParagraphs(introduction.description)}
        {formatsItem?.content}
        {!!allowedExtensions?.length && (
          <p className="mt-16">
            {t("resources.allowedFiles", { extensions: allowedExtensions.join(", ") })}
          </p>
        )}
      </>
    ),
  };
  const metadataHelp = {
    title: documentationItem?.title ?? "",
    hidden: documentationItem?.hidden,
    content: (
      <>
        <p>{t("resources.metadataHelp")}</p>
        {documentationItem?.content}
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
            {addSection?.title ?? ""}
          </h2>
          <DatasetContentDescription
            html={addSection?.description}
            className="max-w-[592px] text-m-regular"
          />
        </div>
        <fieldset disabled={isSubmitting || !canManage} className="min-w-0">
          <legend className="sr-only">{addSection?.title}</legend>
          <FileUploadModal
            appearance="wizard"
            saveMode="editor"
            feedback={uploadFeedback}
            onClearFeedback={onClearUploadFeedback}
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
        {helpItems
          .filter(
            (item) => !["resource-formats", "resource-documentation"].includes(item.key ?? "")
          )
          .map((item, index) => (
            <DatasetWizardHelp key={item.key || index} item={item} />
          ))}
      </div>
    </div>
  );
}
