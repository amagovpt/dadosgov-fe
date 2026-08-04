"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import DragAndDropUploader from "@/components/Primitives/DragAndDropUploader/DragAndDropUploader";

interface ImageUploadFieldProps {
  label?: string;
  required?: boolean;
  uploaderLabel?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSecurityError: () => void;
  error?: string | null;
  previewSrc?: string;
  previewAlt?: string;
  previewPlacement?: "before" | "after";
  previewLabel?: string;
  previewLabelClassName?: string;
  previewWrapperClassName?: string;
  previewImageClassName?: string;
  uploaderWrapperClassName?: string;
  files?: File[];
  dragAndDropLabel?: string;
  inputLabel?: string;
  accept?: string;
  maxSize?: number;
  extensionsInstructions?: string;
  maxSizeExceededErrorLabel?: string;
  forbiddenExtensionErrorLabel?: string;
}

export default function ImageUploadField({
  label,
  required = false,
  uploaderLabel,
  onChange,
  onSecurityError,
  error = null,
  previewSrc,
  previewAlt,
  previewPlacement = "after",
  previewLabel,
  previewLabelClassName = "mb-2 text-sm text-neutral-600",
  previewWrapperClassName = "mt-4 flex justify-center",
  previewImageClassName = "max-w-[200px] max-h-[150px] object-contain border border-neutral-200 rounded",
  uploaderWrapperClassName = "mt-2 [&_.instructions]:items-center [&_.instructions]:text-center [&_.drag-and-drop-area_.agora-btn]:w-fit",
  files,
  dragAndDropLabel,
  inputLabel,
  accept = ".jpg,.jpeg,.png",
  maxSize = 4194304,
  extensionsInstructions,
  maxSizeExceededErrorLabel,
  forbiddenExtensionErrorLabel,
}: ImageUploadFieldProps) {
  const { t } = useTranslation("admin-common");

  const resolvedLabel = label ?? t("forms.imageUpload.coverImage");
  const resolvedUploaderLabel = uploaderLabel ?? t("forms.imageUpload.files");
  const resolvedPreviewAlt = previewAlt ?? t("forms.imageUpload.coverImage");
  const resolvedDragAndDropLabel = dragAndDropLabel ?? t("forms.imageUpload.dragAndDrop");
  const resolvedInputLabel = inputLabel ?? t("forms.imageUpload.selectOrDrag");
  const resolvedExtensionsInstructions =
    extensionsInstructions ?? t("forms.imageUpload.extensionsInstructions");
  const resolvedMaxSizeExceededErrorLabel =
    maxSizeExceededErrorLabel ?? t("forms.imageUpload.maxSizeExceeded");
  const resolvedForbiddenExtensionErrorLabel =
    forbiddenExtensionErrorLabel ?? t("forms.imageUpload.forbiddenExtension");

  const preview = previewSrc ? (
    <div className={previewWrapperClassName}>
      {previewLabel ? <p className={previewLabelClassName}>{previewLabel}</p> : null}
      <img src={previewSrc} alt={resolvedPreviewAlt} className={previewImageClassName} />
    </div>
  ) : null;

  return (
    <div>
      <span className="text-primary-900 text-base font-medium leading-7">
        {resolvedLabel}
        {required ? " *" : ""}
      </span>
      {previewPlacement === "before" ? preview : null}
      <div className={uploaderWrapperClassName}>
        <DragAndDropUploader
          label={resolvedUploaderLabel}
          dragAndDropLabel={resolvedDragAndDropLabel}
          inputLabel={resolvedInputLabel}
          selectedFilesLabel={t("forms.imageUpload.selectedFile")}
          removeFileButtonLabel={t("forms.imageUpload.removeFile")}
          replaceFileButtonLabel={t("forms.imageUpload.replaceFile")}
          extensionsInstructions={resolvedExtensionsInstructions}
          accept={accept}
          maxSize={maxSize}
          maxCount={1}
          maxSizeExceededErrorLabel={resolvedMaxSizeExceededErrorLabel}
          forbiddenExtensionErrorLabel={resolvedForbiddenExtensionErrorLabel}
          files={files}
          hasError={!!error}
          hasFeedback={!!error}
          feedbackState="danger"
          feedbackText={error ?? undefined}
          onChange={onChange}
          onSecurityError={onSecurityError}
        />
      </div>
      {previewPlacement === "after" ? preview : null}
    </div>
  );
}
