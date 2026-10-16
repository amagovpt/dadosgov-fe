"use client";

import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { Button, StatusCard } from "@ama-pt/agora-design-system";
import FileUploadModal from "@/components/admin/FileUploadModal";
import { PendingResourceTable } from "@/components/admin/FileUploadModal/PendingResourceTable";
import type { PendingResourceMeta } from "@/components/admin/FileUploadModal/types";
import type { ResourceType } from "@/service/types/catalog";
import type { AdminHelpBlock } from "@/service/types/admin/common";
import type { AuxiliarItem } from "@/components/admin/AuxiliarList";
import { DatasetWizardHelp } from "./DatasetWizardHelp";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import type { Resource } from "@/service/types/dataset";
import { DatasetWizardResourcesTable } from "./DatasetWizardResourcesTable";

export interface DatasetWizardStep3Props {
  redesigned?: boolean;
  datasetId?: string;
  savedResources?: Resource[];
  onResourcesChange?: (resources: Resource[]) => void;
  introduction?: AdminHelpBlock;
  auxiliaryItems?: AuxiliarItem[];
  uploadedFiles: File[];
  setUploadedFiles: Dispatch<SetStateAction<File[]>>;
  resourceUrls: string[];
  setResourceUrls: Dispatch<SetStateAction<string[]>>;
  showFileError: boolean;
  setShowFileError: Dispatch<SetStateAction<boolean>>;
  allowedExtensions: string[] | null;
  resourceTypes: ResourceType[];
  resourceMetadata: Record<string, PendingResourceMeta>;
  onEditMeta: (key: string, meta: PendingResourceMeta, newUrl?: string) => void;
  onPreviousStep: () => void;
  onStep3Next: () => void;
  isSubmitting: boolean;
}

export function DatasetWizardStep3(props: DatasetWizardStep3Props) {
  const { t } = useTranslation("admin-datasets");
  const {
    uploadedFiles,
    introduction,
    auxiliaryItems,
    setUploadedFiles,
    resourceUrls,
    setResourceUrls,
    showFileError,
    setShowFileError,
    allowedExtensions,
    resourceTypes,
    resourceMetadata,
    onEditMeta,
    onPreviousStep,
    onStep3Next,
    isSubmitting,
  } = props;

  if (props.redesigned) {
    const formatsHelp = {
      title: t("resources.formatsHelpTitle"),
      content: (
        <>
          {introduction && formatHtmlParagraphs(introduction.description)}
          {auxiliaryItems?.[0]?.content}
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
          {auxiliaryItems?.[1]?.content}
        </>
      ),
    };
    return (
      <div className="flex w-full min-w-0 flex-col gap-64">
        <section
          className="flex w-[800px] max-w-full flex-col gap-32"
          aria-labelledby="add-resources-title"
        >
          <div className="flex flex-col gap-8">
            <h3 id="add-resources-title" className="text-xl-bold text-primary-900">
              {t("resources.addTitle")}
            </h3>
            <p className="max-w-[592px] text-m-regular text-primary-900">
              {t("resources.addDescription")}
            </p>
          </div>
          <fieldset disabled={isSubmitting} className="min-w-0">
            <legend className="sr-only">{t("resources.addTitle")}</legend>
            <FileUploadModal
              appearance="wizard"
              uploadedFiles={uploadedFiles}
              resourceUrls={resourceUrls}
              hasError={showFileError}
              onFilesChange={(files) => {
                setUploadedFiles(files);
                if (files.length) setShowFileError(false);
              }}
              onUrlAdd={(url) => {
                setResourceUrls((previous) =>
                  previous.includes(url) ? previous : [...previous, url]
                );
                setShowFileError(false);
              }}
              allowedExtensions={allowedExtensions}
            />
          </fieldset>
          <DatasetWizardHelp item={formatsHelp} />
        </section>
        <fieldset disabled={isSubmitting} className="flex min-w-0 flex-col gap-32">
          <legend className="sr-only">{t("resources.addedTitle")}</legend>
          <DatasetWizardResourcesTable {...props} />
          <DatasetWizardHelp item={metadataHelp} />
          {auxiliaryItems?.slice(2).map((item, index) => (
            <DatasetWizardHelp key={index} item={item} />
          ))}
        </fieldset>
        <div data-dataset-actions className="flex w-full justify-between gap-16">
          <Button
            appearance="outline"
            variant="primary"
            hasIcon
            leadingIcon="agora-line-arrow-left-circle"
            leadingIconHover="agora-solid-arrow-left-circle"
            onClick={onPreviousStep}
            disabled={isSubmitting}
          >
            {t("form.previousAction")}
          </Button>
          <Button
            variant="primary"
            hasIcon
            trailingIcon="agora-line-arrow-right-circle"
            trailingIconHover="agora-solid-arrow-right-circle"
            onClick={onStep3Next}
            disabled={isSubmitting}
          >
            {isSubmitting ? t("form.loadingNext") : t("form.nextAction")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {introduction ? (
        <StatusCard
          variant="informative"
          showIcon
          description={
            introduction.title ? (
              <>
                <strong>{introduction.title}</strong>
                <br />
                {formatHtmlParagraphs(introduction.description)}
              </>
            ) : (
              formatHtmlParagraphs(introduction.description)
            )
          }
        />
      ) : null}

      <div className="admin-page__form">
        <FileUploadModal
          uploadedFiles={uploadedFiles}
          resourceUrls={resourceUrls}
          hasError={showFileError}
          onFilesChange={(files) => {
            setUploadedFiles(files);
            if (files.length > 0) setShowFileError(false);
          }}
          onUrlAdd={(url) => {
            setResourceUrls((prev) => {
              if (prev.includes(url)) return prev;
              return [...prev, url];
            });
            setShowFileError(false);
          }}
          allowedExtensions={allowedExtensions}
        />
        {auxiliaryItems?.map((item, index) => (
          <DatasetWizardHelp key={index} item={item} />
        ))}
        {(uploadedFiles.length > 0 || resourceUrls.length > 0) && (
          <PendingResourceTable
            files={uploadedFiles}
            urls={resourceUrls}
            onFileReplace={(index, file) => {
              const updated = [...uploadedFiles];
              updated[index] = file;
              setUploadedFiles(updated);
            }}
            onFileRemove={(index) => setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))}
            onUrlRemove={(url) => setResourceUrls((prev) => prev.filter((u) => u !== url))}
            resourceTypes={resourceTypes}
            resourceMetadata={resourceMetadata}
            onEditMeta={onEditMeta}
          />
        )}

        <div data-dataset-actions className="admin-page__actions">
          <Button
            appearance="outline"
            variant="neutral"
            hasIcon
            leadingIcon="agora-line-arrow-left-circle"
            leadingIconHover="agora-solid-arrow-left-circle"
            onClick={onPreviousStep}
            disabled={isSubmitting}
          >
            {t("form.previousAction")}
          </Button>
          <Button
            variant="primary"
            hasIcon
            trailingIcon="agora-line-arrow-right-circle"
            trailingIconHover="agora-solid-arrow-right-circle"
            onClick={onStep3Next}
            disabled={isSubmitting}
          >
            {isSubmitting ? t("form.loadingNext") : t("form.nextAction")}
          </Button>
        </div>
      </div>
    </>
  );
}
