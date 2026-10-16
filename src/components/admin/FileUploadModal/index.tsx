"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, InputText, StatusCard } from "@ama-pt/agora-design-system";
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
  appearance = "default",
}: FileUploadModalProps) {
  const { t } = useTranslation("admin-common");
  const { t: td } = useTranslation("admin-datasets");
  const wizard = appearance === "wizard";
  const [added, setAdded] = useState<"url" | "file" | null>(null);
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
    setAdded("url");
  };

  return (
    <div className={wizard ? "flex flex-col gap-32" : "flex flex-col gap-8"}>
      <div className={wizard ? "flex flex-col gap-24" : "flex flex-col gap-2"}>
        <InputText
          label={wizard ? td("resources.addLink") : t("fileUpload.url.label")}
          placeholder={wizard ? td("resources.urlPlaceholder") : "https://"}
          hasHelperText={wizard}
          helperText={wizard ? td("resources.urlHint") : undefined}
          id="inline-resource-url"
          value={localUrl}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setLocalUrl(e.target.value);
            localUrlRef.current = e.target.value;
            setUrlError(null);
          }}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddUrl();
            }
          }}
          hasError={!hasSelection && (!!urlError || hasError)}
          hasFeedback={!!urlError}
          feedbackState="danger"
          feedbackText={urlError ?? ""}
        />
        <div className={wizard ? "w-fit [&_button]:mt-0" : "mt-12 w-fit [&_button]:mt-0"}>
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
        {wizard && added === "url" && !urlError && (
          <StatusCard variant="success" showIcon description={td("resources.linkAdded")} />
        )}
      </div>

      <div className="flex items-center gap-4" aria-hidden="true">
        <div className="flex-1 border-t border-neutral-300" />
        {!wizard && (
          <>
            <span className="px-3 text-sm text-neutral-500">{t("fileUpload.or")}</span>
            <div className="flex-1 border-t border-neutral-300" />
          </>
        )}
      </div>

      <div
        className={`${wizard ? "[&_.drag-and-drop-area_.agora-btn]:w-full" : "[&_.drag-and-drop-area_.agora-btn]:w-fit"} [&_.instructions]:items-center [&_.instructions]:text-center`}
      >
        <DragAndDropUploader
          key={uploaderKey}
          multiple
          label={wizard ? td("resources.uploadFiles") : t("fileUpload.files.label")}
          dragAndDropLabel={t("fileUpload.files.dragAndDrop")}
          inputLabel={wizard ? td("resources.selectFiles") : t("fileUpload.files.selectOrDrag")}
          extensionsInstructions={wizard ? td("resources.fileHint") : undefined}
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
            if (uniqueNew.length > 0) {
              onFilesChange([...uploadedFiles, ...uniqueNew]);
              setAdded("file");
            }
            setUploaderKey((k) => k + 1);
          }}
          onSecurityError={(rejections) => {
            setAdded(null);
            setSecurityErrors(rejections.map(() => POISONED_FILE_WARNING));
          }}
        />
        {wizard && added === "file" && !securityErrors.length && !extensionErrors.length && (
          <StatusCard variant="success" showIcon description={td("resources.filesAdded")} />
        )}
      </div>
    </div>
  );
}
