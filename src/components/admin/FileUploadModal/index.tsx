"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Icon, InputText, StatusCard } from "@ama-pt/agora-design-system";
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
  saveMode = "pending",
  inputId = "inline-resource-url",
  disabled = false,
  feedback,
  onClearFeedback,
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
  const addingUrl = useRef(false);
  const processingFiles = useRef(false);
  const [fileSaveError, setFileSaveError] = useState<string | null>(null);

  const invalidUrlMessage = t("fileUpload.url.invalid");
  const fileError =
    fileSaveError ||
    (securityErrors.length > 0
      ? t("fileUpload.files.securityError")
      : extensionErrors.length > 0
        ? extensionErrors.length === 1
          ? t("fileUpload.files.invalidSingle", { name: extensionErrors[0] })
          : t("fileUpload.files.invalidMultiple", { names: extensionErrors.join(", ") })
        : hasError && !hasSelection
          ? t("forms.requiredField")
          : undefined);
  const urlFeedback = urlError
    ? { variant: "danger" as const, message: `${td("resources.linkNotAdded")} ${urlError}` }
    : feedback?.source === "url"
      ? feedback
      : saveMode !== "editor" && added === "url"
        ? {
            variant: "success" as const,
            message: td(saveMode === "immediate" ? "resources.linkSaved" : "resources.linkAdded"),
          }
        : null;
  const fileFeedback = fileError
    ? { variant: "danger" as const, message: `${td("resources.fileNotUploaded")} ${fileError}` }
    : feedback?.source === "file"
      ? feedback
      : saveMode !== "editor" && added === "file"
        ? {
            variant: "success" as const,
            message: td(saveMode === "immediate" ? "resources.filesSaved" : "resources.filesAdded"),
          }
        : null;

  const handleAddUrl = async () => {
    if (addingUrl.current || disabled) return;
    onClearFeedback?.();
    setAdded(null);
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
    addingUrl.current = true;
    setAdded(null);
    try {
      await onUrlAdd(trimmedUrl);
    } catch (error) {
      setUrlError(error instanceof Error ? error.message : td("resources.linkSaveError"));
      return;
    } finally {
      addingUrl.current = false;
    }
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
          helperText={
            wizard ? (
              <span id={`${inputId}-hint`} className="flex items-start gap-8">
                <Icon
                  name="agora-solid-info-mark"
                  dimensions="s"
                  aria-hidden="true"
                  className="my-4 size-16 shrink-0 fill-informative-500!"
                />
                {td("resources.urlHint")}
              </span>
            ) : undefined
          }
          id={inputId}
          aria-describedby={wizard ? `${inputId}-hint` : undefined}
          disabled={disabled}
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
          hasError={!!urlError || (!hasSelection && hasError)}
          hasFeedback={!wizard && !!urlError}
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
            disabled={disabled}
          >
            {t("fileUpload.actions.add")}
          </Button>
        </div>
        {wizard && urlFeedback && (
          <div role={urlFeedback.variant === "danger" ? "alert" : "status"}>
            <StatusCard variant={urlFeedback.variant} showIcon description={urlFeedback.message} />
          </div>
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
        className={`${wizard ? "flex flex-col gap-32 [&_.drag-and-drop-area_.agora-btn]:w-full" : "[&_.drag-and-drop-area_.agora-btn]:w-fit"} [&_.instructions]:items-center [&_.instructions]:text-center`}
        onClickCapture={(event) => {
          if (!(event.target instanceof Element)) return;
          if (!event.target.closest("button, input[type='file']")) return;
          setAdded(null);
          setFileSaveError(null);
          setSecurityErrors([]);
          setExtensionErrors([]);
          onClearFeedback?.();
        }}
      >
        <DragAndDropUploader
          key={uploaderKey}
          multiple
          disabled={disabled}
          label={wizard ? td("resources.uploadFiles") : t("fileUpload.files.label")}
          dragAndDropLabel={t("fileUpload.files.dragAndDrop")}
          inputLabel={wizard ? td("resources.selectFiles") : t("fileUpload.files.selectOrDrag")}
          extensionsInstructions={
            wizard
              ? td(
                  saveMode === "editor"
                    ? "resources.editorFileHint"
                    : saveMode === "immediate"
                      ? "resources.immediateFileHint"
                      : "resources.fileHint"
                )
              : undefined
          }
          selectedFilesLabel={t("fileUpload.files.selectedFiles")}
          removeFileButtonLabel={t("fileUpload.files.removeFile")}
          replaceFileButtonLabel={t("fileUpload.files.replaceFile")}
          maxSizeExceededErrorLabel={t("fileUpload.files.maxSizeExceeded")}
          forbiddenExtensionErrorLabel={t("fileUpload.files.forbiddenExtension")}
          hasError={
            !!fileSaveError ||
            securityErrors.length > 0 ||
            extensionErrors.length > 0 ||
            (hasError && !hasSelection)
          }
          hasFeedback={!wizard && !!fileError}
          feedbackState="danger"
          feedbackText={fileError}
          onChange={async (e) => {
            if (disabled || processingFiles.current) return;
            const picked = Array.from((e.target as HTMLInputElement).files || []);
            if (picked.length === 0) return;
            processingFiles.current = true;
            const { valid, invalid } = validateFileExtensions(picked, allowedExtensions);
            setExtensionErrors(invalid);
            setSecurityErrors([]);
            setFileSaveError(null);
            setAdded(null);
            const existingNames = new Set(uploadedFiles.map((f) => f.name));
            const uniqueNew = valid.filter((f) => !existingNames.has(f.name));
            if (uniqueNew.length > 0) {
              try {
                await onFilesChange([...uploadedFiles, ...uniqueNew]);
                setAdded("file");
              } catch (error) {
                setAdded(null);
                setFileSaveError(
                  error instanceof Error ? error.message : td("edit.resourceUploadError")
                );
              }
            }
            processingFiles.current = false;
            setUploaderKey((k) => k + 1);
          }}
          onSecurityError={(rejections) => {
            setAdded(null);
            setFileSaveError(null);
            setSecurityErrors(rejections.map(() => POISONED_FILE_WARNING));
          }}
        />
        {wizard && fileFeedback && (
          <div role={fileFeedback.variant === "danger" ? "alert" : "status"}>
            <StatusCard
              variant={fileFeedback.variant}
              showIcon
              description={fileFeedback.message}
            />
          </div>
        )}
      </div>
    </div>
  );
}
