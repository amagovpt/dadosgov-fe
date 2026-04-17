"use client";

import React, { useRef } from "react";
import { Button, usePopupContext } from "@ama-pt/agora-design-system";
import FileUploadPopupContent from "@/components/admin/FileUploadPopupContent";

interface FileUploadModalProps {
  uploadedFiles: File[];
  resourceUrls: string[];
  onFilesChange: (files: File[]) => void;
  onUrlAdd: (url: string) => void;
  onUrlRemove: (url: string) => void;
  hasError?: boolean;
}

function ResourceItem({
  name,
  size,
  onReplace,
  onRemove,
}: {
  name: string;
  size?: string;
  onReplace?: (file: File) => void;
  onRemove: () => void;
}) {
  const replaceRef = useRef<HTMLInputElement>(null);

  return (
    <div className="file-item">
      <div className="file-info">
        <span className="name">{name}</span>
        {size && <span className="size">{size}</span>}
      </div>
      <div className="actions">
        {onReplace && (
          <span className="replace-action">
            <Button
              iconOnly
              appearance="link"
              variant="neutral"
              hasIcon
              leadingIcon="agora-line-refresh-ccw"
              onClick={() => replaceRef.current?.click()}
              aria-label={`Substituir ${name}`}
            />
            <input
              ref={replaceRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onReplace(file);
              }}
              style={{ display: "none" }}
            />
          </span>
        )}
        <span className="delete-action">
          <Button
            iconOnly
            appearance="link"
            variant="neutral"
            hasIcon
            leadingIcon="agora-line-trash"
            onClick={onRemove}
            aria-label={`Remover ${name}`}
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
}: {
  files: File[];
  urls: string[];
  onFileReplace: (index: number, file: File) => void;
  onFileRemove: (index: number) => void;
  onUrlRemove: (url: string) => void;
}) {
  const items: { key: string; name: string; size?: string; type: "file" | "url"; index: number }[] =
    [];

  files.forEach((file, i) => {
    const sizeKB = (file.size / 1024).toFixed(1);
    const sizeLabel = file.size >= 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${sizeKB} KB`;
    items.push({ key: `file-${file.name}`, name: file.name, size: sizeLabel, type: "file", index: i });
  });

  urls.forEach((url, i) => {
    items.push({ key: `url-${url}`, name: url, type: "url", index: i });
  });

  return (
    <div className="agora-file-list">
      <div className="file">
        {items.map((item, i) => (
          <React.Fragment key={item.key}>
            {i > 0 && <div className="file-divider" />}
            <ResourceItem
              name={item.name}
              size={item.size}
              onReplace={
                item.type === "file"
                  ? (file) => onFileReplace(item.index, file)
                  : undefined
              }
              onRemove={
                item.type === "file"
                  ? () => onFileRemove(item.index)
                  : () => onUrlRemove(urls[item.index])
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
}: FileUploadModalProps) {
  const { show } = usePopupContext();
  const hasSelection = uploadedFiles.length > 0 || resourceUrls.length > 0;

  const handleOpen = () => {
    show(
      <FileUploadPopupContent
        key={Date.now()}
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
      {
        title: "Carregar ficheiros",
        closeAriaLabel: "Fechar",
        dimensions: "m",
      },
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
        <span className="text-danger-500 text-sm">Campo obrigatório</span>
      )}

      {hasSelection && (
        <ResourceList
          files={uploadedFiles}
          urls={resourceUrls}
          onFileReplace={(index, file) => {
            const updated = [...uploadedFiles];
            updated[index] = file;
            onFilesChange(updated);
          }}
          onFileRemove={(index) => {
            onFilesChange(uploadedFiles.filter((_, i) => i !== index));
          }}
          onUrlRemove={onUrlRemove}
        />
      )}
    </div>
  );
}
