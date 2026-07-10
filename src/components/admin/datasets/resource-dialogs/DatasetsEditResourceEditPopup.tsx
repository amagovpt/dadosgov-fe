import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  InputText,
  InputTextArea,
  LoaderDialog,
  StatusCard,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import { Dropdown } from "@/components/Primitives/Dropdown";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import { replaceResourceFile, updateResource } from "@/service/api/datasets";
import { checkUrlReachable } from "@/service/api/system";
import type { ResourceType } from "@/service/types/catalog";
import type { Resource } from "@/service/types/dataset";
import { translateUploadError } from "@/lib/security/translateUploadError";

type DatasetsEditResourceEditPopupProps = {
  resource: Resource;
  datasetId: string;
  resourceTypes: ResourceType[];
  onSaved: () => void;
  onCancel: () => void;
};

export default function DatasetsEditResourceEditPopup({
  resource,
  datasetId,
  resourceTypes,
  onSaved,
  onCancel,
}: DatasetsEditResourceEditPopupProps) {
  const { t } = useTranslation("admin-datasets");
  const { hide } = usePopupContext();
  const [title, setTitle] = useState(resource.title);
  const [description, setDescription] = useState(resource.description || "");
  const [resourceUrl, setResourceUrl] = useState(resource.url || "");
  const [resourceFormat, setResourceFormat] = useState(resource.format || "");
  const [mime, setMime] = useState(resource.mime || "");
  const [filesize, setFilesize] = useState(resource.filesize ? String(resource.filesize) : "");
  const resourceTypeRef = useRef(resource.type || "main");
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [isCheckingUrl, setIsCheckingUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  const isValidHttpsUrl = (value: string): boolean => {
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== "https:") return false;
      if (!parsed.hostname) return false;
      const hostname = parsed.hostname.toLowerCase();
      const isIpv4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(hostname);
      const labels = hostname.split(".");
      const hasValidDomainShape = labels.length >= 2;
      const hasValidLabels = labels.every(
        (label) =>
          label.length > 0 &&
          !label.startsWith("-") &&
          !label.endsWith("-") &&
          /^[a-z0-9-]+$/i.test(label),
      );
      const tld = labels[labels.length - 1] || "";
      const hasValidTld = /^([a-z]{2,}|xn--[a-z0-9-]{2,})$/i.test(tld);
      return isIpv4 || (hasValidDomainShape && hasValidLabels && hasValidTld);
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (isSaving || isCheckingUrl) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!title.trim()) return;
    const trimmedUrl = resourceUrl.trim();
    if (trimmedUrl) {
      if (!isValidHttpsUrl(trimmedUrl)) {
        setUrlError(t("edit.resourceInvalidUrl"));
        return;
      }
      setIsCheckingUrl(true);
      const reachable = await checkUrlReachable(trimmedUrl);
      setIsCheckingUrl(false);
      if (!reachable) {
        setUrlError(t("edit.resourceUnreachableUrl"));
        return;
      }
    }
    setUrlError(null);
    setIsSaving(true);
    setError(null);
    try {
      await updateResource(datasetId, resource.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        url: resourceUrl.trim() || undefined,
        format: resourceFormat.trim() || undefined,
        mime: mime.trim() || undefined,
        filesize: filesize ? Number(filesize) : undefined,
        type: resourceTypeRef.current,
      });
      hide();
      onSaved();
    } catch (err) {
      console.error("Error updating resource:", err);
      setError(t("edit.resourceSaveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = (e.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;
    setIsReplacing(true);
    setError(null);
    try {
      await replaceResourceFile(datasetId, resource.id, files[0]);
      hide();
      onSaved();
    } catch (err: unknown) {
      const apiErr = err as { status?: number; data?: Record<string, unknown> };
      console.error("Error replacing file:", apiErr.status, apiErr.data);
      const msg = apiErr.data?.message
        ? translateUploadError(String(apiErr.data.message))
        : t("edit.resourceReplaceError", { status: apiErr.status || "desconhecido" });
      setError(msg);
    } finally {
      setIsReplacing(false);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
    }
  };

  return (
    <form
      className="relative flex flex-col gap-16"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void handleSave();
      }}
      style={{ minHeight: "60vh" }}
    >
      {error && <StatusCard variant="danger" description={error} />}

      {isReplacing && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
          <LoaderDialog title={t("edit.resourceReplacing")} />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-16 overflow-y-auto">
        <InputText
          label={t("edit.resourceTitleField")}
          placeholder={t("edit.resourceTitlePlaceholder")}
          id="res-edit-title"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
        />

        <IsolatedSelect
          label={t("edit.resourceTypeField")}
          placeholder={t("edit.resourceTypePlaceholder")}
          id="res-edit-type"
          defaultValue={resource.type || "main"}
          onChangeRef={resourceTypeRef}
        >
          <Dropdown.Section name="resource-types">
            {resourceTypes.map((rt) => (
              <Dropdown.Option
                key={rt.id}
                value={rt.id}
                selected={rt.id === (resource.type || "main")}
              >
                {rt.label}
              </Dropdown.Option>
            ))}
          </Dropdown.Section>
        </IsolatedSelect>

        <InputTextArea
          label={t("edit.resourceDescriptionField")}
          placeholder={t("edit.resourceDescriptionPlaceholder")}
          id="res-edit-description"
          rows={4}
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
        />

        <InputText
          label={t("edit.resourceUrlField")}
          placeholder={t("edit.resourceUrlPlaceholder")}
          id="res-edit-url"
          value={resourceUrl}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setResourceUrl(e.target.value);
            if (urlError) setUrlError(null);
          }}
          hasError={!!urlError}
          hasFeedback={!!urlError}
          feedbackText={urlError ?? ""}
        />

        {resource.filetype !== "remote" && (
          <>
            <div className="grid grid-cols-2 gap-16">
              <InputText
                label={t("edit.resourceSizeField")}
                placeholder={t("edit.resourceSizePlaceholder")}
                id="res-edit-filesize"
                value={filesize}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilesize(e.target.value)}
                disabled
              />
              <InputText
                label={t("edit.resourceFormatField")}
                placeholder={t("edit.resourceFormatPlaceholder")}
                id="res-edit-format"
                value={resourceFormat}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResourceFormat(e.target.value)}
                disabled
              />
            </div>

            <InputText
              label={t("edit.resourceMimeField")}
              placeholder={t("edit.resourceMimePlaceholder")}
              id="res-edit-mime"
              value={mime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMime(e.target.value)}
              disabled
            />
          </>
        )}

        {resource.checksum && (
          <div className="flex items-center gap-8">
            <span className="text-sm font-semibold">{t("edit.resourceChecksum")}</span>
            <span className="rounded bg-neutral-100 px-8 py-2 text-xs font-mono">
              {resource.checksum.type}
            </span>
            <span className="break-all text-xs font-mono">{resource.checksum.value}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-8">
        <Button type="button" appearance="outline" variant="primary" onClick={onCancel}>
          {t("edit.cancel")}
        </Button>
        <div className="flex gap-8">
          <input
            ref={replaceFileInputRef}
            type="file"
            className="hidden"
            onChange={handleReplaceFile}
            disabled={isReplacing}
          />
          <Button
            type="button"
            appearance="outline"
            variant="primary"
            onClick={() => replaceFileInputRef.current?.click()}
            disabled={isReplacing}
          >
            {isReplacing ? t("edit.resourceReplacing") : t("edit.resourceReplaceAction")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            hasIcon
            trailingIcon="agora-line-check-circle"
            trailingIconHover="agora-solid-check-circle"
            disabled={isSaving || isCheckingUrl || !title.trim()}
          >
            {isCheckingUrl ? t("edit.resourceCheckingUrl") : isSaving ? t("edit.saving") : t("edit.save")}
          </Button>
        </div>
      </div>
    </form>
  );
}
