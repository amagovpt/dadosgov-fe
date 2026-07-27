"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, InputText } from "@ama-pt/agora-design-system";
import DragAndDropUploader from "@/components/Primitives/DragAndDropUploader/DragAndDropUploader";
import { POISONED_FILE_WARNING } from "@/lib/security/translateUploadError";
import { validateFileExtensions } from "@/lib/files/validateFileExtensions";
import { FileUploadModalProps } from "./types";

export default function FileUploadModal({
  uploadedFiles,
  resourceUrls,
  onFilesChange,
  onUrlAdd,
  hasError,
  allowedExtensions = null,
}: FileUploadModalProps) {
  const { t } = useTranslation("admin-common");
  const hasSelection = uploadedFiles.length > 0 || resourceUrls.length > 0;
  const [localUrl, setLocalUrl] = useState("");
  const localUrlRef = useRef("");
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSelection) return;

    const frameId = requestAnimationFrame(() => {
      setUrlError(null);
    });

    return () => cancelAnimationFrame(frameId);
  }, [hasSelection]);
  const [extensionErrors, setExtensionErrors] = useState<string[]>([]);
  const [securityErrors, setSecurityErrors] = useState<string[]>([]);
  const [uploaderKey, setUploaderKey] = useState(0);

  const invalidUrlMessage = t("fileUpload.url.invalid");

  const handleAddUrl = () => {
    const trimmedUrl = (localUrl || localUrlRef.current).trim();
    if (!trimmedUrl) {
      setUrlError(invalidUrlMessage);
      return;
    }
    try {
      const parsed = new URL(trimmedUrl);
      if (parsed.protocol !== "https:") {
        setUrlError(invalidUrlMessage);
        return;
      }
    } catch {
      setUrlError(invalidUrlMessage);
      return;
    }
    onUrlAdd(trimmedUrl);
    setLocalUrl("");
    localUrlRef.current = "";
    setUrlError(null);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <InputText
          label={t("fileUpload.url.label")}
          placeholder="https://"
          id="inline-resource-url"
          value={localUrl}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setLocalUrl(e.target.value);
            localUrlRef.current = e.target.value;
            setUrlError(null);
          }}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") handleAddUrl();
          }}
          hasError={!hasSelection && (!!urlError || hasError)}
          hasFeedback={!!urlError}
          feedbackState="danger"
          feedbackText={urlError ?? ""}
        />
        <div className="mt-12 w-fit [&_button]:mt-0">
          <Button
            variant="primary"
            appearance="outline"
            hasIcon
            leadingIcon="agora-line-plus-circle"
            leadingIconHover="agora-solid-plus-circle"
            onClick={handleAddUrl}
          >
            {t("fileUpload.actions.add")}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 border-t border-neutral-300" />
        <span className="px-3 text-sm text-neutral-500">{t("fileUpload.or")}</span>
        <div className="flex-1 border-t border-neutral-300" />
      </div>

      <div className="[&_.drag-and-drop-area_.agora-btn]:w-fit [&_.instructions]:items-center [&_.instructions]:text-center">
        <DragAndDropUploader
          key={uploaderKey}
          multiple
          label={t("fileUpload.files.label")}
          dragAndDropLabel={t("fileUpload.files.dragAndDrop")}
          inputLabel={t("fileUpload.files.selectOrDrag")}
          selectedFilesLabel={t("fileUpload.files.selectedFiles")}
          removeFileButtonLabel={t("fileUpload.files.removeFile")}
          replaceFileButtonLabel={t("fileUpload.files.replaceFile")}
          maxSizeExceededErrorLabel={t("fileUpload.files.maxSizeExceeded")}
          forbiddenExtensionErrorLabel={t("fileUpload.files.forbiddenExtension")}
          hasError={
            securityErrors.length > 0 || extensionErrors.length > 0 || (hasError && !hasSelection)
          }
          hasFeedback={
            securityErrors.length > 0 || extensionErrors.length > 0 || (hasError && !hasSelection)
          }
          feedbackState="danger"
          feedbackText={
            securityErrors.length > 0
              ? t("fileUpload.files.securityError")
              : extensionErrors.length > 0
                ? extensionErrors.length === 1
                  ? t("fileUpload.files.invalidSingle", { name: extensionErrors[0] })
                  : t("fileUpload.files.invalidMultiple", {
                      names: extensionErrors.join(", "),
                    })
                : hasError && !hasSelection
                  ? t("forms.requiredField")
                  : undefined
          }
          onChange={(e) => {
            const picked = Array.from((e.target as HTMLInputElement).files || []);
            if (picked.length === 0) return;
            const { valid, invalid } = validateFileExtensions(picked, allowedExtensions);
            setExtensionErrors(invalid);
            setSecurityErrors([]);
            const existingNames = new Set(uploadedFiles.map((f) => f.name));
            const uniqueNew = valid.filter((f) => !existingNames.has(f.name));
            if (uniqueNew.length > 0) onFilesChange([...uploadedFiles, ...uniqueNew]);
            setUploaderKey((k) => k + 1);
          }}
          onSecurityError={(rejections) =>
            setSecurityErrors(rejections.map(() => POISONED_FILE_WARNING))
          }
        />
      </div>
    </div>
  );
}
