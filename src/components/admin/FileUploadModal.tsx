"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  DropdownOption,
  DropdownSection,
  Icon,
  InputText,
  InputTextArea,
  StatusCard,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import DragAndDropUploader from "@/components/Primitives/DragAndDropUploader/DragAndDropUploader";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import { POISONED_FILE_WARNING } from "@/lib/security/translateUploadError";
import { ResourceType } from "@/types/api";
import TextLink from "@/components/Primitives/TextLink";

export interface PendingResourceMeta {
  title: string;
  resourceType: string;
  description: string;
  filesize?: string;
  format?: string;
  mime?: string;
}

interface FileUploadModalProps {
  uploadedFiles: File[];
  resourceUrls: string[];
  onFilesChange: (files: File[]) => void;
  onUrlAdd: (url: string) => void;
  hasError?: boolean;
  allowedExtensions?: string[] | null;
}

function DeleteConfirmContent({ name, onConfirm }: { name: string; onConfirm: () => void }) {
  const { hide } = usePopupContext();
  return (
    <div className="flex flex-col p-2">
      <StatusCard variant="informative" showIcon description="Esta ação é irreversível." />
      <p className="text-sm text-neutral-900" style={{ marginTop: "24px" }}>
        Tem a certeza que pretende eliminar <span className="font-bold">{name}</span>?
      </p>
      <div className="flex justify-end gap-[18px]" style={{ marginTop: "32px" }}>
        <Button variant="primary" appearance="outline" onClick={hide}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          appearance="solid"
          hasIcon
          leadingIcon="agora-line-trash"
          leadingIconHover="agora-solid-trash"
          onClick={() => {
            onConfirm();
            hide();
          }}
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
}

function ResourceEditPendingPopupContent({
  isUrl,
  name,
  file,
  initialMeta,
  resourceTypes,
  onSave,
  onReplaceFile,
}: {
  isUrl: boolean;
  name: string;
  file?: File;
  initialMeta: PendingResourceMeta;
  resourceTypes: ResourceType[];
  onSave: (meta: PendingResourceMeta, newUrl?: string) => void;
  onReplaceFile?: (file: File) => void;
}) {
  const { hide } = usePopupContext();
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const defaultType = initialMeta.resourceType || (resourceTypes[0]?.id ?? "main");
  const extMatch = !isUrl ? name.match(/(\.[^.]+)$/) : null;
  const fileExt = extMatch ? extMatch[1] : "";
  const baseName = fileExt ? name.slice(0, -fileExt.length) : name;
  const [title, setTitle] = useState(() => {
    const t = initialMeta.title || name;
    return !isUrl && fileExt && t === name ? baseName : t;
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

  // LEDG-1747 follow-up: the `key={`pending-${name}`}` at the show() site is
  // expected to force a remount per resource, but in practice the agora
  // PopupProvider keeps the previous content element mounted (its hide()
  // only flips dialog visibility — it does NOT clear the content state),
  // and reconciliation has been observed to reuse the same component
  // instance even with a different key when the parent stays alive across
  // show() calls. Resync all field state from the current resource's props
  // so opening the 2nd resource's edit popup never shows the 1st's data.
  // The set-state-in-effect lint rule warns about cascading renders, but
  // the alternative (waiting for a remount that never happens) is the bug
  // we are fixing — this prop-sync is the smaller of the two evils.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => {
    const t = initialMeta.title || name;
    setTitle(!isUrl && fileExt && t === name ? baseName : t);
    setDescription(initialMeta.description || "");
    setUrl(isUrl ? name : "");
    setFilesize(initialMeta.filesize ?? (file ? String(file.size) : ""));
    setFormat(initialMeta.format ?? (fileExt ? fileExt.slice(1).toLowerCase() : ""));
    setMime(initialMeta.mime ?? (file?.type || ""));
    setUrlError(null);
    resourceTypeRef.current = defaultType;
  }, [name, isUrl, initialMeta, file]);

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
          /^[a-z0-9-]+$/i.test(label)
      );
      const tld = labels[labels.length - 1] || "";
      const hasValidTld = /^([a-z]{2,}|xn--[a-z0-9-]{2,})$/i.test(tld);
      return isIpv4 || (hasValidDomainShape && hasValidLabels && hasValidTld);
    } catch {
      return false;
    }
  };

  const handleSave = () => {
    if (isUrl) {
      const trimmedUrl = url.trim();
      try {
        const parsed = new URL(trimmedUrl);
        if (!trimmedUrl || parsed.protocol !== "https:") {
          setUrlError("Insira um URL válido, começando com https://");
          return;
        }
      } catch {
        setUrlError("Insira um URL válido, começando com https://");
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
    const f = e.target.files?.[0];
    if (!f || !onReplaceFile) return;
    onSave({
      title: title.trim() || name,
      resourceType: resourceTypeRef.current,
      description: description.trim(),
      filesize: filesize.trim() || undefined,
      format: format.trim() || undefined,
      mime: mime.trim() || undefined,
    });
    onReplaceFile(f);
    hide();
  };

  return (
    <div className="flex flex-col gap-16" style={{ minHeight: "60vh" }}>
      <div className="flex flex-1 flex-col gap-16 overflow-y-auto">
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <InputText
              label="Título *"
              placeholder="Título do recurso"
              id="pending-res-title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            />
          </div>
          {!isUrl && fileExt && (
            <span className="text-sm shrink-0 pb-[13px] font-medium text-neutral-900">
              {fileExt.toUpperCase()}
            </span>
          )}
        </div>

        <IsolatedSelect
          label="Tipo *"
          placeholder="Selecione um tipo..."
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
          label="Descrição"
          placeholder="Descrição do recurso"
          id="pending-res-description"
          rows={4}
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
        />

        <InputText
          label="URL *"
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
                label="Tamanho"
                placeholder="Tamanho em bytes"
                id="pending-res-filesize"
                value={filesize}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilesize(e.target.value)}
                disabled
              />
              <InputText
                label="Formato"
                placeholder="csv, json, xlsx..."
                id="pending-res-format"
                value={format}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormat(e.target.value)}
                disabled
              />
            </div>

            <InputText
              label="Mime Type"
              placeholder="application/json, text/csv..."
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
          Cancelar
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
                Substituir o ficheiro
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
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}

function ResourceViewPopupContent({
  name,
  size,
  file,
  isUrl,
  resourceTypes,
  meta,
  onEdit,
  onDelete,
  onClose,
}: {
  name: string;
  size?: string;
  file?: File;
  isUrl: boolean;
  resourceTypes: ResourceType[];
  meta: PendingResourceMeta;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const typeLabel =
    resourceTypes.find((rt) => rt.id === meta.resourceType)?.label ?? meta.resourceType;
  const extMatch = !isUrl ? name.match(/(\.[^.]+)$/) : null;
  const fileExt = extMatch ? extMatch[1].slice(1).toUpperCase() : null;
  const location = isUrl
    ? "Este recurso é um link externo"
    : "Este recurso encontra-se nos nossos servidores";
  const mimeType = meta.mime || file?.type || null;
  const format = meta.format || fileExt?.toLowerCase() || null;

  return (
    <div className="flex flex-col gap-16" style={{ minHeight: "40vh" }}>
      {meta.description && <p className="text-sm text-neutral-700">{meta.description}</p>}
      <div className="flex-1 overflow-y-auto">
        <table className="text-sm w-full">
          <tbody>
            <tr>
              <td className="whitespace-nowrap py-4 pr-16 align-top font-semibold">Tipo</td>
              <td className="py-4">{typeLabel}</td>
            </tr>
            <tr>
              <td className="whitespace-nowrap py-4 pr-16 align-top font-semibold">Localização</td>
              <td className="py-4">{location}</td>
            </tr>
            {isUrl && (
              <tr>
                <td className="whitespace-nowrap py-4 pr-16 align-top font-semibold">URL</td>
                <td className="break-all py-4">
                  <TextLink href={name}>{name}</TextLink>
                </td>
              </tr>
            )}
            {format && (
              <tr>
                <td className="whitespace-nowrap py-4 pr-16 align-top font-semibold">Formato</td>
                <td className="py-4">{format}</td>
              </tr>
            )}
            {mimeType && (
              <tr>
                <td className="whitespace-nowrap py-4 pr-16 align-top font-semibold">Mime Type</td>
                <td className="py-4">{mimeType}</td>
              </tr>
            )}
            {size && (
              <tr>
                <td className="whitespace-nowrap py-4 pr-16 align-top font-semibold">Tamanho</td>
                <td className="py-4">{size}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between pt-8">
        <Button appearance="outline" variant="primary" onClick={onClose}>
          Cancelar
        </Button>
        <div className="flex gap-8">
          <Button
            variant="danger"
            hasIcon
            leadingIcon="agora-line-trash"
            leadingIconHover="agora-solid-trash"
            onClick={onDelete}
          >
            Eliminar
          </Button>
          <Button
            variant="primary"
            hasIcon
            leadingIcon="agora-line-edit"
            leadingIconHover="agora-solid-edit"
            onClick={onEdit}
          >
            Editar
          </Button>
        </div>
      </div>
    </div>
  );
}

function ResourceItem({
  name,
  size,
  file,
  isUrl,
  resourceTypes,
  currentMeta,
  onSaveMeta,
  onReplace,
  onRemove,
}: {
  name: string;
  size?: string;
  file?: File;
  isUrl: boolean;
  resourceTypes: ResourceType[];
  currentMeta: PendingResourceMeta;
  onSaveMeta: (meta: PendingResourceMeta, newUrl?: string) => void;
  onReplace?: (f: File) => void;
  onRemove: () => void;
}) {
  const { show, hide } = usePopupContext();
  const extMatch = !isUrl ? name.match(/(\.[^.]+)$/) : null;
  const fileExt = extMatch ? extMatch[1] : "";
  const baseDisplayName = currentMeta.title || name;
  const displayName =
    !isUrl && fileExt && !baseDisplayName.toLowerCase().endsWith(fileExt.toLowerCase())
      ? baseDisplayName + fileExt
      : baseDisplayName;

  const handleEdit = () => {
    show(
      <ResourceEditPendingPopupContent
        // LEDG-1747: key tied to the resource identity so React mounts a
        // fresh component per resource. Without it, useState(initialMeta.x)
        // only runs on the FIRST open and the popup keeps the state of the
        // previously-edited resource (the form of the 2nd resource shows
        // the 1st resource's data).
        key={`pending-${name}`}
        isUrl={isUrl}
        name={name}
        file={file}
        initialMeta={currentMeta}
        resourceTypes={resourceTypes}
        onSave={onSaveMeta}
        onReplaceFile={onReplace}
      />,
      { title: displayName, closeAriaLabel: "Fechar", dimensions: "l" }
    );
  };

  const handleRemove = () => {
    show(<DeleteConfirmContent name={displayName} onConfirm={onRemove} />, {
      title: "Eliminar ficheiro",
      closeAriaLabel: "Fechar",
      dimensions: "s",
    });
  };

  const handleView = () => {
    show(
      <ResourceViewPopupContent
        // LEDG-1747: same rationale as handleEdit — force a fresh
        // component instance per resource so the view popup does not
        // inherit state from the previously-viewed resource.
        key={`view-${name}`}
        name={name}
        size={size}
        file={file}
        isUrl={isUrl}
        resourceTypes={resourceTypes}
        meta={currentMeta}
        onEdit={() => {
          hide();
          setTimeout(handleEdit, 50);
        }}
        onDelete={() => {
          hide();
          handleRemove();
        }}
        onClose={hide}
      />,
      { title: displayName, closeAriaLabel: "Fechar", dimensions: "l" }
    );
  };

  return (
    <>
      <button
        className="text-primary-500 hover:text-primary-700"
        title="Ver detalhes"
        onClick={handleView}
        aria-label={`Ver ${displayName}`}
      >
        <Icon name="agora-line-eye" className="h-[20px] w-[20px]" />
      </button>
      <button
        className="text-primary-500 hover:text-primary-700"
        title="Editar"
        onClick={handleEdit}
        aria-label={`Editar ${displayName}`}
      >
        <Icon name="agora-line-edit" className="h-[20px] w-[20px]" />
      </button>
      <button
        className="text-danger-500 hover:text-danger-700"
        title="Eliminar"
        onClick={handleRemove}
        aria-label={`Eliminar ${displayName}`}
      >
        <Icon name="agora-line-trash" className="h-[20px] w-[20px]" />
      </button>
    </>
  );
}

export function PendingResourceTable({
  files,
  urls,
  onFileReplace,
  onFileRemove,
  onUrlRemove,
  resourceTypes,
  resourceMetadata,
  onEditMeta,
}: {
  files: File[];
  urls: string[];
  onFileReplace: (index: number, file: File) => void;
  onFileRemove: (index: number) => void;
  onUrlRemove: (url: string) => void;
  resourceTypes: ResourceType[];
  resourceMetadata: Record<string, PendingResourceMeta>;
  onEditMeta: (key: string, meta: PendingResourceMeta, newUrl?: string) => void;
}) {
  const items: {
    key: string;
    name: string;
    size?: string;
    isUrl: boolean;
    index: number;
    file?: File;
  }[] = [];

  files.forEach((file, i) => {
    const sizeKB = (file.size / 1024).toFixed(1);
    const sizeLabel =
      file.size >= 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${sizeKB} KB`;
    items.push({
      key: `file-${file.name}`,
      name: file.name,
      size: sizeLabel,
      isUrl: false,
      index: i,
      file,
    });
  });

  urls.forEach((url, i) => {
    items.push({ key: `url-${url}`, name: url, isUrl: true, index: i });
  });

  const getMeta = (key: string, name: string): PendingResourceMeta =>
    resourceMetadata[key] ?? { title: name, resourceType: "main", description: "" };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHeaderCell>Nome do ficheiro</TableHeaderCell>
          <TableHeaderCell>Tipo</TableHeaderCell>
          <TableHeaderCell>Formato</TableHeaderCell>
          <TableHeaderCell>Tamanho</TableHeaderCell>
          <TableHeaderCell>Ação</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const meta = getMeta(item.key, item.name);
          const typeLabel =
            resourceTypes.find((rt) => rt.id === meta.resourceType)?.label ?? meta.resourceType;
          const extMatch = !item.isUrl ? item.name.match(/(\.[^.]+)$/) : null;
          const fileExt = extMatch ? extMatch[1] : "";
          const formatLabel =
            (meta.format || (fileExt ? fileExt.slice(1) : "")).toUpperCase() || "-";
          const baseName = fileExt ? item.name.slice(0, -fileExt.length) : item.name;
          const displayName =
            meta.title && meta.title !== item.name
              ? meta.title +
                (fileExt && !meta.title.toLowerCase().endsWith(fileExt.toLowerCase())
                  ? fileExt
                  : "")
              : item.isUrl
                ? item.name
                : baseName + fileExt;

          return (
            <TableRow key={item.key}>
              <TableCell headerLabel="Nome do ficheiro">
                <span className="break-all">{displayName}</span>
              </TableCell>
              <TableCell headerLabel="Tipo">{typeLabel}</TableCell>
              <TableCell headerLabel="Formato">{formatLabel}</TableCell>
              <TableCell headerLabel="Tamanho">{item.size ?? "-"}</TableCell>
              <TableCell headerLabel="Ação">
                <div className="flex items-center gap-8">
                  <ResourceItem
                    name={item.name}
                    size={item.size}
                    file={item.file}
                    isUrl={item.isUrl}
                    resourceTypes={resourceTypes}
                    currentMeta={meta}
                    onSaveMeta={(m, newUrl) => onEditMeta(item.key, m, newUrl)}
                    onReplace={!item.isUrl ? (f) => onFileReplace(item.index, f) : undefined}
                    onRemove={
                      !item.isUrl ? () => onFileRemove(item.index) : () => onUrlRemove(item.name)
                    }
                  />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default function FileUploadModal({
  uploadedFiles,
  resourceUrls,
  onFilesChange,
  onUrlAdd,
  hasError,
  allowedExtensions = null,
}: FileUploadModalProps) {
  const hasSelection = uploadedFiles.length > 0 || resourceUrls.length > 0;
  const [localUrl, setLocalUrl] = useState("");
  const localUrlRef = useRef("");
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (hasSelection) setUrlError(null);
  }, [hasSelection]);
  const [extensionErrors, setExtensionErrors] = useState<string[]>([]);
  const [securityErrors, setSecurityErrors] = useState<string[]>([]);
  const [uploaderKey, setUploaderKey] = useState(0);

  const handleAddUrl = () => {
    const trimmedUrl = (localUrl || localUrlRef.current).trim();
    if (!trimmedUrl) {
      setUrlError("Insira um URL válido, começando com https://");
      return;
    }
    try {
      const parsed = new URL(trimmedUrl);
      if (parsed.protocol !== "https:") {
        setUrlError("Insira um URL válido, começando com https://");
        return;
      }
    } catch {
      setUrlError("Insira um URL válido, começando com https://");
      return;
    }
    onUrlAdd(trimmedUrl);
    setLocalUrl("");
    localUrlRef.current = "";
    setUrlError(null);
  };

  const getExtension = (filename: string) =>
    filename.includes(".") ? filename.split(".").pop()!.toLowerCase() : "";

  const validateFiles = (files: File[]): { valid: File[]; invalid: string[] } => {
    if (!allowedExtensions || allowedExtensions.length === 0) return { valid: files, invalid: [] };
    const allowed = allowedExtensions.map((e) => e.toLowerCase());
    const valid: File[] = [];
    const invalid: string[] = [];
    for (const file of files) {
      const ext = getExtension(file.name);
      if (!ext || !allowed.includes(ext)) invalid.push(file.name);
      else valid.push(file);
    }
    return { valid, invalid };
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <InputText
          label="Link exato para o ficheiro"
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
            Adicionar
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 border-t border-neutral-300" />
        <span className="text-sm px-3 text-neutral-500">ou</span>
        <div className="flex-1 border-t border-neutral-300" />
      </div>

      <div className="[&_.drag-and-drop-area_.agora-btn]:w-fit [&_.instructions]:items-center [&_.instructions]:text-center">
        <DragAndDropUploader
          key={uploaderKey}
          multiple
          label="Ficheiros"
          dragAndDropLabel="Arraste e largue os ficheiros aqui"
          inputLabel="Selecione ou arraste os ficheiros"
          selectedFilesLabel="ficheiros selecionados"
          removeFileButtonLabel="Remover ficheiro"
          replaceFileButtonLabel="Substituir ficheiro"
          maxSizeExceededErrorLabel="O ficheiro excede o tamanho máximo permitido."
          forbiddenExtensionErrorLabel="Formato de ficheiro não permitido."
          hasError={
            securityErrors.length > 0 || extensionErrors.length > 0 || (hasError && !hasSelection)
          }
          hasFeedback={
            securityErrors.length > 0 || extensionErrors.length > 0 || (hasError && !hasSelection)
          }
          feedbackState="danger"
          feedbackText={
            securityErrors.length > 0
              ? "O ficheiro contém código malicioso ou scripts não autorizados que comprometem a segurança do sistema."
              : extensionErrors.length > 0
                ? extensionErrors.length === 1
                  ? `Tipo de ficheiro inválido. "${extensionErrors[0]}" não foi adicionado.`
                  : `Tipo de ficheiro inválido. Os seguintes ficheiros não foram adicionados: ${extensionErrors.join(", ")}`
                : hasError && !hasSelection
                  ? "Campo obrigatório"
                  : undefined
          }
          onChange={(e) => {
            const picked = Array.from((e.target as HTMLInputElement).files || []);
            if (picked.length === 0) return;
            const { valid, invalid } = validateFiles(picked);
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
