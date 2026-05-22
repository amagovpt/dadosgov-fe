import React, { useRef, useState } from "react";
import { Button, InputText, InputTextArea, StatusCard, usePopupContext } from "@ama-pt/agora-design-system";
import { Dropdown } from "@/components/Primitives/Dropdown";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import { checkUrlReachable, replaceResourceFile, updateResource } from "@/services/api";
import type { Resource, ResourceType } from "@/types/api";
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
      const isIpv4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(
        hostname,
      );
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
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!title.trim()) return;
    const trimmedUrl = resourceUrl.trim();
    if (trimmedUrl) {
      if (!isValidHttpsUrl(trimmedUrl)) {
        setUrlError("Insira um URL válido, começando com https://");
        return;
      }
      setIsCheckingUrl(true);
      const reachable = await checkUrlReachable(trimmedUrl);
      setIsCheckingUrl(false);
      if (!reachable) {
        setUrlError(
          "URL não acessível. Verifique se o endereço está correto e acessível publicamente.",
        );
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
      setError("Erro ao guardar as alterações.");
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
        : `Erro ao substituir o ficheiro (${apiErr.status || "desconhecido"}).`;
      setError(msg);
    } finally {
      setIsReplacing(false);
    }
  };

  return (
    <div className="flex flex-col gap-16" style={{ minHeight: "60vh" }}>
      {error && <StatusCard variant="danger" description={error} />}

      <div className="flex-1 overflow-y-auto flex flex-col gap-16">
        <InputText
          label="Título *"
          placeholder="Título do recurso"
          id="res-edit-title"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
        />

        <IsolatedSelect
          label="Tipo *"
          placeholder="Selecione um tipo..."
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
          label="Descrição"
          placeholder="Descrição do recurso"
          id="res-edit-description"
          rows={4}
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
        />

        <InputText
          label="URL *"
          placeholder="URL do recurso"
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
                label="Tamanho"
                placeholder="Tamanho em bytes"
                id="res-edit-filesize"
                value={filesize}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilesize(e.target.value)}
                disabled
              />
              <InputText
                label="Formato"
                placeholder="csv, json, xlsx..."
                id="res-edit-format"
                value={resourceFormat}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResourceFormat(e.target.value)}
                disabled
              />
            </div>

            <InputText
              label="Mime Type"
              placeholder="application/json, text/csv..."
              id="res-edit-mime"
              value={mime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMime(e.target.value)}
              disabled
            />
          </>
        )}

        {resource.checksum && (
          <div className="flex items-center gap-8">
            <span className="text-sm font-semibold">Soma de verificação</span>
            <span className="bg-neutral-100 rounded px-8 py-2 text-xs font-mono">
              {resource.checksum.type}
            </span>
            <span className="text-xs font-mono break-all">{resource.checksum.value}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-8">
        <Button appearance="outline" variant="primary" onClick={onCancel}>
          Cancelar
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
            appearance="outline"
            variant="primary"
            onClick={() => replaceFileInputRef.current?.click()}
            disabled={isReplacing}
          >
            {isReplacing ? "A substituir..." : "Substituir o ficheiro"}
          </Button>
          <Button
            variant="primary"
            hasIcon
            trailingIcon="agora-line-check-circle"
            trailingIconHover="agora-solid-check-circle"
            onClick={handleSave}
            disabled={isSaving || isCheckingUrl || !title.trim()}
          >
            {isCheckingUrl ? "A verificar URL..." : isSaving ? "A guardar..." : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
