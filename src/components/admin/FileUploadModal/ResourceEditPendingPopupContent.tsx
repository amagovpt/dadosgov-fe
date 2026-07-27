"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  DropdownOption,
  DropdownSection,
  InputText,
  InputTextArea,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import { ResourceType } from "@/service/types/catalog";
import { getFileExtension } from "./utils";
import { PendingResourceMeta } from "./types";

interface ResourceEditPendingPopupContentProps {
  isUrl: boolean;
  name: string;
  file?: File;
  initialMeta: PendingResourceMeta;
  resourceTypes: ResourceType[];
  onSave: (meta: PendingResourceMeta, newUrl?: string) => void;
  onReplaceFile?: (file: File) => void;
}

export function ResourceEditPendingPopupContent({
  isUrl,
  name,
  file,
  initialMeta,
  resourceTypes,
  onSave,
  onReplaceFile,
}: ResourceEditPendingPopupContentProps) {
  const { t } = useTranslation("admin-common");
  const { hide } = usePopupContext();
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const defaultType = initialMeta.resourceType || (resourceTypes[0]?.id ?? "main");
  const fileExt = getFileExtension(name, isUrl);
  const baseName = fileExt ? name.slice(0, -fileExt.length) : name;
  const [title, setTitle] = useState(() => {
    const currentTitle = initialMeta.title || name;
    return !isUrl && fileExt && currentTitle === name ? baseName : currentTitle;
  });
  const resourceTypeRef = useRef(defaultType);
  const [description, setDescription] = useState(initialMeta.description || "");
  const [url, setUrl] = useState(isUrl ? name : "");
  const [filesize, setFilesize] = useState(initialMeta.filesize ?? (file ? String(file.size) : ""));
  const [format, setFormat] = useState(
    initialMeta.format ?? (fileExt ? fileExt.slice(1).toLowerCase() : "")
  );
  const [mime, setMime] = useState(initialMeta.mime ?? (file?.type || ""));
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    const currentTitle = initialMeta.title || name;
    const frameId = requestAnimationFrame(() => {
      setTitle(!isUrl && fileExt && currentTitle === name ? baseName : currentTitle);
      setDescription(initialMeta.description || "");
      setUrl(isUrl ? name : "");
      setFilesize(initialMeta.filesize ?? (file ? String(file.size) : ""));
      setFormat(initialMeta.format ?? (fileExt ? fileExt.slice(1).toLowerCase() : ""));
      setMime(initialMeta.mime ?? (file?.type || ""));
      setUrlError(null);
      resourceTypeRef.current = defaultType;
    });

    return () => cancelAnimationFrame(frameId);
  }, [name, isUrl, initialMeta, file, fileExt, baseName, defaultType]);

  const invalidUrlMessage = t("fileUpload.url.invalid");

  const handleSave = () => {
    if (isUrl) {
      const trimmedUrl = url.trim();
      try {
        const parsed = new URL(trimmedUrl);
        if (!trimmedUrl || parsed.protocol !== "https:") {
          setUrlError(invalidUrlMessage);
          return;
        }
      } catch {
        setUrlError(invalidUrlMessage);
        return;
      }
    }
    onSave(
      {
        title: title.trim() || name,
        resourceType: resourceTypeRef.current,
        description: description.trim(),
        filesize: filesize.trim() || undefined,
        format: format.trim() || undefined,
        mime: mime.trim() || undefined,
      },
      isUrl ? url.trim() : undefined
    );
    hide();
  };

  const handleReplaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !onReplaceFile) return;
    onSave({
      title: title.trim() || name,
      resourceType: resourceTypeRef.current,
      description: description.trim(),
      filesize: filesize.trim() || undefined,
      format: format.trim() || undefined,
      mime: mime.trim() || undefined,
    });
    onReplaceFile(selectedFile);
    hide();
  };

  return (
    <div className="flex flex-col gap-16" style={{ minHeight: "60vh" }}>
      <div className="flex flex-1 flex-col gap-16 overflow-y-auto">
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <InputText
              label={t("fileUpload.resourceEdit.titleLabel")}
              placeholder={t("fileUpload.resourceEdit.titlePlaceholder")}
              id="pending-res-title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            />
          </div>
          {!isUrl && fileExt && (
            <span className="shrink-0 pb-[13px] text-sm font-medium text-neutral-900">
              {fileExt.toUpperCase()}
            </span>
          )}
        </div>

        <IsolatedSelect
          label={t("fileUpload.resourceEdit.typeLabel")}
          placeholder={t("fileUpload.resourceEdit.typePlaceholder")}
          id="pending-res-type"
          defaultValue={defaultType}
          onChangeRef={resourceTypeRef}
        >
          <DropdownSection name="pending-resource-types">
            {resourceTypes.map((rt) => (
              <DropdownOption key={rt.id} value={rt.id} selected={rt.id === defaultType}>
                {rt.label}
              </DropdownOption>
            ))}
          </DropdownSection>
        </IsolatedSelect>

        <InputTextArea
          label={t("fileUpload.resourceEdit.descriptionLabel")}
          placeholder={t("fileUpload.resourceEdit.descriptionPlaceholder")}
          id="pending-res-description"
          rows={4}
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
        />

        <InputText
          label={t("fileUpload.resourceEdit.urlLabel")}
          placeholder="https://"
          id="pending-res-url"
          value={url}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setUrl(e.target.value);
            if (urlError) setUrlError(null);
          }}
          hasError={!!urlError}
          hasFeedback={!!urlError}
          feedbackText={urlError ?? ""}
          disabled={!isUrl}
        />

        {!isUrl && (
          <>
            <div className="grid grid-cols-2 gap-16">
              <InputText
                label={t("fileUpload.resourceEdit.sizeLabel")}
                placeholder={t("fileUpload.resourceEdit.sizePlaceholder")}
                id="pending-res-filesize"
                value={filesize}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilesize(e.target.value)}
                disabled
              />
              <InputText
                label={t("fileUpload.resourceEdit.formatLabel")}
                placeholder={t("fileUpload.resourceEdit.formatPlaceholder")}
                id="pending-res-format"
                value={format}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormat(e.target.value)}
                disabled
              />
            </div>

            <InputText
              label={t("fileUpload.resourceEdit.mimeTypeLabel")}
              placeholder={t("fileUpload.resourceEdit.mimeTypePlaceholder")}
              id="pending-res-mime"
              value={mime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMime(e.target.value)}
              disabled
            />
          </>
        )}
      </div>

      <div className="flex justify-between pt-8">
        <Button appearance="outline" variant="primary" onClick={hide}>
          {t("actions.cancel")}
        </Button>
        <div className="flex gap-8">
          {!isUrl && onReplaceFile && (
            <>
              <input
                ref={replaceFileInputRef}
                type="file"
                className="hidden"
                onChange={handleReplaceFile}
              />
              <Button
                appearance="outline"
                variant="primary"
                onClick={() => replaceFileInputRef.current?.click()}
              >
                {t("fileUpload.actions.replaceFile")}
              </Button>
            </>
          )}
          <Button
            variant="primary"
            hasIcon
            trailingIcon="agora-line-check-circle"
            trailingIconHover="agora-solid-check-circle"
            onClick={handleSave}
          >
            {t("actions.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
