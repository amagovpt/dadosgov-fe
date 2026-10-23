"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { Button, StatusCard } from "@ama-pt/agora-design-system";
import FileUploadModal from "@/components/admin/FileUploadModal";
import { usePendingResourceEditor } from "@/components/admin/FileUploadModal/usePendingResourceEditor";
import { PendingResourceTable } from "@/components/admin/FileUploadModal/PendingResourceTable";
import type {
  PendingResourceMeta,
  ResourceUploadFeedback,
} from "@/components/admin/FileUploadModal/types";
import type { ResourceType } from "@/service/types/catalog";
import type { AdminHelpBlock } from "@/service/types/admin/common";
import type { AuxiliarItem } from "@/components/admin/AuxiliarList";
import { DatasetWizardHelp } from "./DatasetWizardHelp";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import type { Resource } from "@/service/types/dataset";
import { DatasetResourcesTable } from "../resources/DatasetResourcesTable";
import { getDatasetAuxiliarItem } from "../config/datasetsAuxiliarItems";
import { DatasetContentDescription, useDatasetSection } from "../DatasetContentProvider";

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
  const addSection = useDatasetSection("add-resources");
  const listSection = useDatasetSection("resource-list");
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

  const { openEditors, editor } = usePendingResourceEditor();
  const [uploadFeedback, setUploadFeedback] = useState<ResourceUploadFeedback | null>(null);
  const latestProps = useRef(props);
  const knownFiles = useRef(uploadedFiles);
  useEffect(() => {
    latestProps.current = props;
    knownFiles.current = props.uploadedFiles;
  }, [props]);

  function editResources(items: (File | string)[], isNew = false) {
    setUploadFeedback(null);
    openEditors(
      items.map((item) => {
        const isUrl = typeof item === "string";
        const file = isUrl ? undefined : item;
        const name = isUrl ? item : item.name;
        const key = `${isUrl ? "url" : "file"}-${name}`;
        return {
          isUrl,
          name,
          file,
          resourceTypes,
          allowedExtensions,
          initialMeta: resourceMetadata[key] ?? {
            title: name,
            resourceType: "main",
            description: "",
          },
          onDiscard: isNew
            ? () => {
                setUploadFeedback(null);
                const current = latestProps.current;
                if (file)
                  current.setUploadedFiles((previous) =>
                    previous.filter((other) => other !== file)
                  );
                else
                  current.setResourceUrls((previous) => previous.filter((other) => other !== name));
              }
            : undefined,
          onSave: (meta: PendingResourceMeta, newUrl?: string, replacement?: File) => {
            const current = latestProps.current;
            if (
              newUrl &&
              newUrl !== name &&
              (current.resourceUrls.includes(newUrl) ||
                current.savedResources?.some((resource) => resource.url === newUrl))
            )
              throw new Error(t("resourceEditing.duplicateUrl"));
            if (
              replacement &&
              current.uploadedFiles.some(
                (other) => other !== file && other.name === replacement.name
              )
            )
              throw new Error(t("resourceEditor.duplicateFile"));
            if (replacement) {
              current.setUploadedFiles((previous) =>
                previous.map((other) => (other === file ? replacement : other))
              );
              current.onEditMeta(`file-${replacement.name}`, meta);
            } else current.onEditMeta(key, meta, newUrl);
            if (isNew)
              setUploadFeedback({
                source: isUrl ? "url" : "file",
                variant: "success",
                message: t(isUrl ? "resources.linkAdded" : "resources.filesAdded"),
              });
          },
        };
      })
    );
  }

  function addFiles(files: File[]) {
    // Agora can replay its uploader callback in Strict Mode before React commits the new props.
    const names = new Set(knownFiles.current.map((file) => file.name));
    const added = files.filter((file) => {
      if (names.has(file.name)) return false;
      names.add(file.name);
      return true;
    });
    if (!added.length) return;
    const next = [...knownFiles.current, ...added];
    knownFiles.current = next;
    setUploadedFiles(next);
    if (files.length) setShowFileError(false);
    editResources(added, true);
  }

  function addUrl(url: string) {
    if (
      resourceUrls.includes(url) ||
      props.savedResources?.some((resource) => resource.url === url)
    )
      throw new Error(t("resourceEditing.duplicateUrl"));
    setResourceUrls((previous) => [...previous, url]);
    setShowFileError(false);
    editResources([url], true);
  }

  if (props.redesigned) {
    const formatsItem = getDatasetAuxiliarItem(auxiliaryItems ?? [], "resource-formats");
    const documentationItem = getDatasetAuxiliarItem(
      auxiliaryItems ?? [],
      "resource-documentation"
    );
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
      <>
        {editor}
        <div className="flex w-full min-w-0 flex-col gap-64">
          <section
            className="flex w-[800px] max-w-full flex-col gap-32"
            aria-labelledby="add-resources-title"
          >
            <div className="flex flex-col gap-8">
              <h3 id="add-resources-title" className="text-xl-bold text-primary-900">
                {addSection?.title ?? ""}
              </h3>
              <DatasetContentDescription
                html={addSection?.description}
                className="max-w-[592px] text-m-regular text-primary-900"
              />
            </div>
            <fieldset disabled={isSubmitting} className="min-w-0">
              <legend className="sr-only">{addSection?.title}</legend>
              <FileUploadModal
                appearance="wizard"
                saveMode="editor"
                feedback={uploadFeedback}
                onClearFeedback={() => setUploadFeedback(null)}
                uploadedFiles={uploadedFiles}
                resourceUrls={resourceUrls}
                hasError={showFileError}
                onFilesChange={addFiles}
                onUrlAdd={addUrl}
                allowedExtensions={allowedExtensions}
              />
            </fieldset>
            <DatasetWizardHelp item={formatsHelp} />
          </section>
          <fieldset disabled={isSubmitting} className="flex min-w-0 flex-col gap-32">
            <legend className="sr-only">{listSection?.title}</legend>
            <DatasetResourcesTable
              savedResources={props.savedResources}
              resourceTypes={resourceTypes}
              datasetId={props.datasetId}
              onResourcesChange={props.onResourcesChange}
              pending={{
                uploadedFiles,
                resourceUrls,
                resourceMetadata,
                setUploadedFiles,
                setResourceUrls,
                onEditMeta,
                onEditResource: (item) => editResources([item]),
              }}
            />
            <DatasetWizardHelp item={metadataHelp} />
            {auxiliaryItems
              ?.filter(
                (item) => !["resource-formats", "resource-documentation"].includes(item.key ?? "")
              )
              .map((item, index) => (
                <DatasetWizardHelp key={item.key || index} item={item} />
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
      </>
    );
  }

  return (
    <>
      {editor}
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
          onFilesChange={addFiles}
          onUrlAdd={addUrl}
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
