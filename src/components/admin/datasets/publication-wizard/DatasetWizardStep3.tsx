"use client";

import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { Button, StatusCard } from "@ama-pt/agora-design-system";
import FileUploadModal from "@/components/admin/FileUploadModal";
import { PendingResourceTable } from "@/components/admin/FileUploadModal/PendingResourceTable";
import type { PendingResourceMeta } from "@/components/admin/FileUploadModal/types";
import type { ResourceType } from "@/service/types/catalog";

export interface DatasetWizardStep3Props {
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

  return (
    <>
      <StatusCard
        variant="informative"
        showIcon
        description={
          <>
            <strong>{t("form.whatIsFileTitle")}</strong>
            <br />
            {t("form.whatIsFileDescription")}
          </>
        }
      />

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

        <div className="admin-page__actions">
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
