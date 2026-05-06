"use client";

import React, { useRef, useState } from "react";
import {
  Button,
  DropdownOption,
  DropdownSection,
  Icon,
  InputText,
  InputTextArea,
  StatusCard,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import FileUploadPopupContent from "@/components/admin/FileUploadPopupContent";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import { ResourceType } from "@/types/api";

export interface PendingResourceMeta {
  title: string;
  resourceType: string;
  description: string;
}

interface FileUploadModalProps {
  uploadedFiles: File[];
  resourceUrls: string[];
  onFilesChange: (files: File[]) => void;
  onUrlAdd: (url: string) => void;
  onUrlRemove: (url: string) => void;
  hasError?: boolean;
  resourceTypes: ResourceType[];
  resourceMetadata: Record<string, PendingResourceMeta>;
  onEditMeta: (key: string, meta: PendingResourceMeta, newUrl?: string) => void;
  onFileReplace: (index: number, file: File) => void;
  allowedExtensions?: string[] | null;
}

function DeleteConfirmContent({ name, onConfirm }: { name: string; onConfirm: () => void }) {
  const { hide } = usePopupContext();
  return (
    <div className="flex flex-col p-2">
      <StatusCard variant="informative" showIcon description="Esta ação é irreversível." />
      <p className="text-neutral-900 text-sm" style={{ marginTop: "24px" }}>
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
  initialMeta,
  resourceTypes,
  onSave,
  onReplaceFile,
}: {
  isUrl: boolean;
  name: string;
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

  const handleSave = () => {
    onSave(
      { title: title.trim() || name, resourceType: resourceTypeRef.current, description: description.trim() },
      isUrl ? url.trim() : undefined,
    );
    hide();
  };

  const handleReplaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onReplaceFile) return;
    onSave({ title: title.trim() || name, resourceType: resourceTypeRef.current, description: description.trim() });
    onReplaceFile(file);
    hide();
  };

  return (
    <div className="flex flex-col gap-[16px]" style={{ minHeight: "40vh" }}>
      <div className="flex-1 flex flex-col gap-[16px]">
        <div className="flex items-end gap-2">
          <div className="flex-1 min-w-0">
            <InputText
              label="Título *"
              placeholder="Título do recurso"
              id="pending-res-title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            />
          </div>
          {!isUrl && fileExt && (
            <span className="text-neutral-900 text-sm font-medium pb-[13px] shrink-0">{fileExt}</span>
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

        {isUrl && (
          <InputText
            label="URL"
            placeholder="https://"
            id="pending-res-url"
            value={url}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
          />
        )}
      </div>

      <div className="flex justify-between pt-[8px]">
        <Button appearance="outline" variant="primary" onClick={hide}>
          Cancelar
        </Button>
        <div className="flex gap-[8px]">
          {!isUrl && onReplaceFile && (
            <>
              <input ref={replaceFileInputRef} type="file" className="hidden" onChange={handleReplaceFile} />
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

function ResourceItem({
  name,
  size,
  isUrl,
  resourceTypes,
  currentMeta,
  onSaveMeta,
  onReplace,
  onRemove,
}: {
  name: string;
  size?: string;
  isUrl: boolean;
  resourceTypes: ResourceType[];
  currentMeta: PendingResourceMeta;
  onSaveMeta: (meta: PendingResourceMeta, newUrl?: string) => void;
  onReplace?: (file: File) => void;
  onRemove: () => void;
}) {
  const { show } = usePopupContext();
  const displayName = currentMeta.title || name;

  const handleEdit = () => {
    show(
      <ResourceEditPendingPopupContent
        isUrl={isUrl}
        name={name}
        initialMeta={currentMeta}
        resourceTypes={resourceTypes}
        onSave={onSaveMeta}
        onReplaceFile={onReplace}
      />,
      { title: displayName, closeAriaLabel: "Fechar", dimensions: "l" },
    );
  };

  const handleRemove = () => {
    show(<DeleteConfirmContent name={displayName} onConfirm={onRemove} />, {
      title: "Eliminar ficheiro",
      closeAriaLabel: "Fechar",
      dimensions: "s",
    });
  };

  return (
    <div className="file-item">
      <div className="file-info">
        <span className="name">{displayName}</span>
        {size && <span className="size">{size}</span>}
      </div>
      <div className="actions">
        <Button
          iconOnly
          appearance="outline"
          variant="primary"
          hasIcon
          leadingIcon="agora-line-edit"
          leadingIconHover="agora-solid-edit"
          onClick={handleEdit}
          aria-label={`Editar ${displayName}`}
        />
        <span className="delete-action error">
          <Button
            iconOnly
            appearance="outline"
            variant="danger"
            hasIcon
            leadingIcon="agora-line-trash"
            leadingIconHover="agora-solid-trash"
            onClick={handleRemove}
            aria-label={`Remover ${displayName}`}
          />
        </span>
      </div>
    </div>
  );
}

function ResourceList({
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
  const items: { key: string; name: string; size?: string; isUrl: boolean; index: number }[] = [];

  files.forEach((file, i) => {
    const sizeKB = (file.size / 1024).toFixed(1);
    const sizeLabel =
      file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${sizeKB} KB`;
    items.push({ key: `file-${file.name}`, name: file.name, size: sizeLabel, isUrl: false, index: i });
  });

  urls.forEach((url, i) => {
    items.push({ key: `url-${url}`, name: url, isUrl: true, index: i });
  });

  const getMeta = (key: string, name: string): PendingResourceMeta =>
    resourceMetadata[key] ?? { title: name, resourceType: "main", description: "" };

  return (
    <div className="agora-file-list">
      <div className="file">
        {items.map((item, i) => (
          <React.Fragment key={item.key}>
            {i > 0 && <div className="file-divider" />}
            <ResourceItem
              name={item.name}
              size={item.size}
              isUrl={item.isUrl}
              resourceTypes={resourceTypes}
              currentMeta={getMeta(item.key, item.name)}
              onSaveMeta={(meta, newUrl) => onEditMeta(item.key, meta, newUrl)}
              onReplace={!item.isUrl ? (file) => onFileReplace(item.index, file) : undefined}
              onRemove={
                !item.isUrl ? () => onFileRemove(item.index) : () => onUrlRemove(item.name)
              }
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default function FileUploadModal({
  uploadedFiles,
  resourceUrls,
  onFilesChange,
  onUrlAdd,
  onUrlRemove,
  hasError,
  resourceTypes,
  resourceMetadata,
  onEditMeta,
  onFileReplace,
  allowedExtensions = null,
}: FileUploadModalProps) {
  const { show } = usePopupContext();
  const hasSelection = uploadedFiles.length > 0 || resourceUrls.length > 0;

  const handleOpen = () => {
    show(
      <FileUploadPopupContent
        key={Date.now()}
        allowedExtensions={allowedExtensions}
        onConfirm={(newFiles, url) => {
          if (newFiles.length > 0) {
            const existingNames = new Set(uploadedFiles.map((f) => f.name));
            const uniqueNew = newFiles.filter((f) => !existingNames.has(f.name));
            onFilesChange([...uploadedFiles, ...uniqueNew]);
          }
          if (url.trim()) {
            onUrlAdd(url.trim());
          }
        }}
      />,
      { title: "Carregar ficheiros", closeAriaLabel: "Fechar", dimensions: "m" },
    );
  };

  return (
    <div className="flex flex-col gap-[8px]">
      <span className="text-primary-900 text-base font-medium leading-7">Ficheiros</span>

      <Button
        variant={hasError && !hasSelection ? "danger" : "primary"}
        appearance="outline"
        hasIcon
        leadingIcon="agora-line-plus-circle"
        leadingIconHover="agora-solid-plus-circle"
        onClick={handleOpen}
        style={{ width: "fit-content" }}
      >
        Adicionar ficheiros
      </Button>

      {hasError && !hasSelection && (
        <div className="feedback">
          <span className="feedback-icon-wrapper feedback-icon-wrapper-danger">
            <Icon name="agora-solid-alert-triangle" dimensions="s" aria-hidden={true} />
          </span>
          <p className="feedback-text feedback-text-light">Campo obrigatório</p>
        </div>
      )}

      {hasSelection && (
        <ResourceList
          files={uploadedFiles}
          urls={resourceUrls}
          onFileReplace={onFileReplace}
          onFileRemove={(index) => {
            onFilesChange(uploadedFiles.filter((_, i) => i !== index));
          }}
          onUrlRemove={onUrlRemove}
          resourceTypes={resourceTypes}
          resourceMetadata={resourceMetadata}
          onEditMeta={onEditMeta}
        />
      )}
    </div>
  );
}
