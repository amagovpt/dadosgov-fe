"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { InputText } from "@ama-pt/agora-design-system";
import DragAndDropUploader from "@/components/Primitives/DragAndDropUploader/DragAndDropUploader";

interface FileOrLinkSectionProps {
  file: File | null;
  fileError: string | null;
  resourceUrl: string;
  hasResourceUrlError: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSecurityError: () => void;
  onResourceUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function FileOrLinkSection({
  file,
  fileError,
  resourceUrl,
  hasResourceUrlError,
  onFileChange,
  onSecurityError,
  onResourceUrlChange,
}: FileOrLinkSectionProps) {
  const { t } = useTranslation("admin-community-resources");

  return (
    <>
      <h2 className="admin-page__section-title">{t("form.fileOrLink")}</h2>

      <div className="admin-page__fields-group">
        <div className="[&_.drag-and-drop-area_.agora-btn]:w-fit [&_.instructions]:items-center [&_.instructions]:text-center">
          <DragAndDropUploader
            label={t("form.files")}
            dragAndDropLabel={t("form.dragAndDropFile")}
            inputLabel={t("form.selectOrDragFile")}
            selectedFilesLabel={t("form.selectedFile")}
            removeFileButtonLabel={t("form.removeFile")}
            replaceFileButtonLabel={t("form.replaceFile")}
            extensionsInstructions={t("form.maxSize420")}
            maxSize={440401920}
            maxCount={1}
            maxSizeExceededErrorLabel={t("form.maxSizeExceeded420")}
            forbiddenExtensionErrorLabel={t("form.forbiddenExtension")}
            hasError={!!fileError}
            hasFeedback={!!fileError}
            feedbackState="danger"
            feedbackText={fileError ?? undefined}
            onChange={onFileChange}
            onSecurityError={onSecurityError}
          />
        </div>

        <div className="admin-page__divider-or">
          <span className="admin-page__divider-or-text">{t("form.or")}</span>
        </div>

        <InputText
          label={file ? t("form.exactFileLink") : t("form.exactFileLinkRequired")}
          placeholder="https://..."
          id="resource-url"
          value={resourceUrl}
          onChange={onResourceUrlChange}
          hasError={hasResourceUrlError}
          hasFeedback={hasResourceUrlError}
          feedbackState="danger"
          errorFeedbackText={t("form.fileOrLinkRequired")}
        />
      </div>
    </>
  );
}
