"use client";

import { useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  DropdownOption,
  DropdownSection,
  InputText,
  InputTextArea,
  Pill,
  StatusCard,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import DragAndDropUploader from "@/components/Primitives/DragAndDropUploader/DragAndDropUploader";
import { guardFiles } from "@/lib/security/uploadGuard";
import { validateFileExtensions } from "@/lib/files/validateFileExtensions";
import type { ResourceType } from "@/service/types/catalog";
import { formatFileSize, getFileExtension } from "./utils";
import type { PendingResourceMeta } from "./types";

export interface ResourceEditPendingPopupContentProps {
  sessionKey?: number;
  isUrl: boolean;
  name: string;
  file?: File;
  initialMeta: PendingResourceMeta;
  resourceTypes: ResourceType[];
  allowedExtensions?: string[] | null;
  onSave: (meta: PendingResourceMeta, newUrl?: string, replacementFile?: File) => void;
  onReplaceFile?: (file: File) => void;
  onClose?: () => void;
  onSaved?: () => void;
}

// The resource API accepts MIME strings; these are common choices, not a restriction.
const MIME_TYPES = [
  "text/csv",
  "text/plain",
  "text/tab-separated-values",
  "text/xml",
  "application/json",
  "application/geo+json",
  "application/ld+json",
  "application/xml",
  "application/pdf",
  "application/zip",
  "application/gzip",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
  "image/jpeg",
  "image/png",
  "image/tiff",
];

export function ResourceEditPendingPopupContent(props: ResourceEditPendingPopupContentProps) {
  // Agora retains dialog content between openings, so reset the form for each editor session.
  return <PendingResourceForm key={props.sessionKey ?? props.name} {...props} />;
}

function PendingResourceForm({
  isUrl,
  name,
  file,
  initialMeta,
  resourceTypes,
  allowedExtensions,
  onSave,
  onReplaceFile,
  onClose,
  onSaved,
}: ResourceEditPendingPopupContentProps) {
  const { t } = useTranslation("admin-common");
  const { t: td } = useTranslation("admin-datasets");
  const { hide } = usePopupContext();
  const close = onClose ?? hide;
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const processingFile = useRef(false);
  const [selectedFile, setSelectedFile] = useState(file);
  const fileExt = getFileExtension(name, isUrl);
  const [title, setTitle] = useState(() => {
    const current = initialMeta.title || name;
    return !isUrl && fileExt && current === name ? name.slice(0, -fileExt.length) : current;
  });
  const defaultType = initialMeta.resourceType || "main";
  const resourceTypeRef = useRef(defaultType);
  const [description, setDescription] = useState(initialMeta.description || "");
  const [url, setUrl] = useState(isUrl ? name : "");
  const [filesize, setFilesize] = useState(initialMeta.filesize ?? "");
  const [format, setFormat] = useState(initialMeta.format ?? fileExt.slice(1).toLowerCase());
  const mimeRef = useRef(initialMeta.mime || "");
  const [mime, setMime] = useState(initialMeta.mime || "");
  const [customMime, setCustomMime] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [checkingFile, setCheckingFile] = useState(false);
  const [uploaderKey, setUploaderKey] = useState(0);
  const fileFormat = selectedFile ? getFileExtension(selectedFile.name, false).slice(1) : "";
  const field = (key: string) => `${id}-${key}`;
  const label = (key: string) => td(`resourceEditor.${key}`);
  const clearError = (key: string) => setErrors((previous) => ({ ...previous, [key]: "" }));

  async function selectFile(nextFile?: File) {
    if (!nextFile || processingFile.current) return;
    processingFile.current = true;
    setCheckingFile(true);
    setFileError(null);
    try {
      const { accepted, rejected } = await guardFiles([nextFile]);
      if (rejected.length || !accepted.length) {
        setFileError(t("fileUpload.files.securityError"));
        return;
      }
      const { valid, invalid } = validateFileExtensions(accepted, allowedExtensions);
      if (invalid.length) {
        setFileError(t("fileUpload.files.invalidSingle", { name: nextFile.name }));
        return;
      }
      setSelectedFile(valid[0]);
      clearError("file");
      setUploaderKey((previous) => previous + 1);
    } finally {
      processingFile.current = false;
      setCheckingFile(false);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
    }
  }

  function save() {
    const nextErrors: Record<string, string> = {};
    const required = td("form.fieldRequired");
    if (!title.trim()) nextErrors.title = required;
    if (!resourceTypeRef.current) nextErrors.type = required;
    if (!isUrl && !selectedFile) nextErrors.file = required;
    if (isUrl) {
      try {
        if (new URL(url.trim()).protocol !== "https:") throw new Error();
      } catch {
        nextErrors.url = t("fileUpload.url.invalid");
      }
      if (
        filesize.trim() &&
        (!/^\d+$/.test(filesize.trim()) || !Number.isSafeInteger(Number(filesize)))
      )
        nextErrors.size = label("invalidSize");
    }
    setErrors(nextErrors);
    setSaveError(null);
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      );
      return;
    }
    const meta: PendingResourceMeta = {
      title: title.trim(),
      resourceType: resourceTypeRef.current,
      description: description.trim(),
      format: isUrl
        ? format.trim().toLowerCase() || undefined
        : fileFormat.toLowerCase() || undefined,
      mime: isUrl ? mimeRef.current.trim() || undefined : selectedFile?.type || undefined,
      filesize: isUrl ? filesize.trim() || undefined : String(selectedFile!.size),
    };
    try {
      const replacement = selectedFile !== file ? selectedFile : undefined;
      onSave(meta, isUrl ? url.trim() : undefined, replacement);
      if (replacement) onReplaceFile?.(replacement);
      (onSaved ?? close)();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : td("edit.resourceSaveError"));
    }
  }

  const facts = (items: [string, string][]) => (
    <dl className={`grid grid-cols-1 gap-32 ${items.length > 1 ? "md:grid-cols-2" : ""}`}>
      {items.map(([key, value]) => (
        <div key={key} className="flex min-w-0 flex-col gap-8 border-b border-neutral-700 pb-16">
          <dt className="py-8 text-m-medium text-primary-900">{label(key)}</dt>
          <dd className="text-m-regular break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
  const mimeOptions = [...new Set([...MIME_TYPES, initialMeta.mime].filter(Boolean))];

  return (
    <div className="flex min-w-0 flex-col gap-64 text-neutral-900">
      <h2 className="text-2xl-bold">{label("title")}</h2>
      <section className="flex flex-col gap-16" aria-labelledby={field("availability")}>
        <h3 id={field("availability")} className="text-xl-bold">
          {label("availability")}
        </h3>
        <StatusCard
          variant="informative"
          showIcon
          description={
            <div className="flex flex-col gap-8">
              <Pill variant="neutral" className="w-fit rounded-[999px]!">
                {td("resources.unknown")}
              </Pill>
              <p>{label("pendingAvailability")}</p>
            </div>
          }
        />
      </section>
      <form
        ref={formRef}
        noValidate
        className="flex min-w-0 flex-col gap-32"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <div className="flex flex-col gap-16">
          <h3 className="text-xl-bold">{label("metadata")}</h3>
          <p className="max-w-[592px] text-m-regular">{label("requiredFields")}</p>
        </div>
        {saveError && <StatusCard variant="danger" showIcon description={saveError} />}
        <div className="grid grid-cols-1 items-start gap-32 md:grid-cols-2 [&>*]:min-w-0">
          <InputText
            id={field("title")}
            label={label("titleField")}
            value={title}
            required
            hasError={!!errors.title}
            hasFeedback={!!errors.title}
            feedbackState="danger"
            feedbackText={errors.title}
            onChange={(event) => {
              setTitle(event.target.value);
              clearError("title");
            }}
          />
          <IsolatedSelect
            id={field("type")}
            label={label("type")}
            placeholder={t("fileUpload.resourceEdit.typePlaceholder")}
            defaultValue={defaultType}
            onChangeRef={resourceTypeRef}
            required
            hasError={!!errors.type}
            errorFeedbackText={errors.type}
            onChangeCallback={() => clearError("type")}
            hideSectionNames
          >
            <DropdownSection name="resource-types">
              {(resourceTypes.length
                ? resourceTypes
                : [{ id: "main", label: label("mainFile") }]
              ).map((type) => (
                <DropdownOption key={type.id} value={type.id}>
                  {type.label}
                </DropdownOption>
              ))}
            </DropdownSection>
          </IsolatedSelect>
        </div>
        <div className="w-full max-w-[592px] [&_.agora-input-textarea-wrapper_textarea.agora-input-textarea]:min-h-[284px]!">
          <InputTextArea
            id={field("description")}
            label={t("fileUpload.resourceEdit.descriptionLabel")}
            required={false}
            rows={9}
            maxLength={3000}
            showCharCounter
            hasHelperText
            helperText={label("optional")}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <StatusCard variant="informative" showIcon description={label("descriptionHelp")} />
        {isUrl ? (
          <>
            <div className="grid grid-cols-1 items-start gap-32 md:grid-cols-2 [&>*]:min-w-0">
              <InputText
                id={field("format")}
                label={label("format")}
                value={format}
                onChange={(event) => setFormat(event.target.value)}
              />
              <div className="flex min-w-0 flex-col gap-8">
                {customMime ? (
                  <InputText
                    id={field("mime")}
                    label={label("mime")}
                    defaultValue={mime}
                    onChange={(event) => {
                      mimeRef.current = event.target.value;
                      setMime(event.target.value);
                    }}
                  />
                ) : (
                  <IsolatedSelect
                    id={field("mime")}
                    label={label("mime")}
                    placeholder={label("selectMime")}
                    defaultValue={initialMeta.mime || ""}
                    onChangeRef={mimeRef}
                    onChangeCallback={setMime}
                    searchable
                    hideSectionNames
                  >
                    <DropdownSection name="mime-types">
                      {mimeOptions.map((value) => (
                        <DropdownOption key={value} value={value!}>
                          {value}
                        </DropdownOption>
                      ))}
                    </DropdownSection>
                  </IsolatedSelect>
                )}
                {!customMime && (
                  <Button
                    type="button"
                    appearance="link"
                    variant="primary"
                    onClick={() => setCustomMime(true)}
                  >
                    {label("otherMime")}
                  </Button>
                )}
              </div>
            </div>
            <div className="w-full md:w-[calc((100%-32px)/2)]">
              <InputText
                id={field("size")}
                label={label("size")}
                inputMode="numeric"
                value={filesize}
                hasHelperText
                helperText={label("sizeHint")}
                hasError={!!errors.size}
                hasFeedback={!!errors.size}
                feedbackState="danger"
                feedbackText={errors.size}
                onChange={(event) => {
                  setFilesize(event.target.value);
                  clearError("size");
                }}
              />
            </div>
            <InputText
              id={field("url")}
              label={label("url")}
              value={url}
              required
              hasError={!!errors.url}
              hasFeedback={!!errors.url}
              feedbackState="danger"
              feedbackText={errors.url}
              onChange={(event) => {
                setUrl(event.target.value);
                clearError("url");
              }}
            />
            {facts([["origin", label("external")]])}
          </>
        ) : (
          <>
            <div className="flex min-w-0 flex-col gap-16 [&_.drag-and-drop-area_.agora-btn]:w-full [&_.instructions]:items-center [&_.instructions]:text-center">
              <DragAndDropUploader
                key={uploaderKey}
                id={field("file")}
                disabled={!!selectedFile || checkingFile}
                label={label("file")}
                dragAndDropLabel={t("fileUpload.files.dragAndDrop")}
                inputLabel={td("resources.selectFiles")}
                removeFileButtonLabel={t("fileUpload.files.removeFile")}
                replaceFileButtonLabel={t("fileUpload.files.replaceFile")}
                extensionsInstructions={
                  allowedExtensions?.length
                    ? td("resources.allowedFiles", { extensions: allowedExtensions.join(", ") })
                    : undefined
                }
                hasError={!!fileError || !!errors.file}
                hasFeedback={!!fileError || !!errors.file}
                feedbackState="danger"
                feedbackText={fileError || errors.file}
                onChange={(event) => {
                  void selectFile(event.target.files?.[0]);
                }}
                onSecurityError={() => setFileError(t("fileUpload.files.securityError"))}
              />
              {selectedFile && (
                <div className="mx-16 flex min-w-0 items-center gap-8 border-b border-neutral-700 pb-16">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="text-m-regular break-words">{selectedFile.name}</p>
                    <p className="text-s-regular text-neutral-700">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    appearance="link"
                    variant="primary"
                    hasIcon
                    iconOnly
                    leadingIcon="agora-line-refresh-ccw"
                    leadingIconHover="agora-solid-refresh-ccw"
                    aria-label={t("fileUpload.actions.replaceFile")}
                    disabled={checkingFile}
                    onClick={() => replaceFileInputRef.current?.click()}
                  />
                  <Button
                    type="button"
                    appearance="link"
                    variant="neutral"
                    hasIcon
                    iconOnly
                    leadingIcon="agora-line-trash"
                    leadingIconHover="agora-solid-trash"
                    aria-label={t("fileUpload.files.removeFile")}
                    disabled={checkingFile}
                    onClick={() => {
                      setSelectedFile(undefined);
                      setFileError(null);
                      setUploaderKey((value) => value + 1);
                    }}
                  />
                </div>
              )}
              <input
                ref={replaceFileInputRef}
                type="file"
                className="hidden"
                aria-label={t("fileUpload.actions.replaceFile")}
                onChange={(event) => {
                  void selectFile(event.target.files?.[0]);
                }}
              />
            </div>
            {facts([
              ["format", fileFormat.toUpperCase() || "—"],
              ["mime", selectedFile?.type || "—"],
            ])}
            {facts([
              ["size", selectedFile ? formatFileSize(selectedFile.size) : "—"],
              ["origin", label("internal")],
            ])}
          </>
        )}
        {facts([
          ["created", label("afterSave")],
          ["updated", label("afterSave")],
        ])}
        <div className="flex flex-wrap items-center justify-end gap-16">
          <Button type="button" appearance="link" variant="neutral" onClick={close}>
            {t("actions.cancel")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            hasIcon
            leadingIcon="agora-line-check-circle"
            leadingIconHover="agora-solid-check-circle"
            disabled={checkingFile}
          >
            {label("save")}
          </Button>
        </div>
      </form>
    </div>
  );
}
