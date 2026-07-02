"use client";

import { Icon, usePopupContext } from "@ama-pt/agora-design-system";
import { ResourceType } from "@/service/types/catalog";
import { DeleteConfirmContent } from "./DeleteConfirmContent";
import { ResourceEditPendingPopupContent } from "./ResourceEditPendingPopupContent";
import { ResourceViewPopupContent } from "./ResourceViewPopupContent";
import { getFileExtension } from "./utils";
import { PendingResourceMeta } from "./types";

interface ResourceItemProps {
  name: string;
  size?: string;
  file?: File;
  isUrl: boolean;
  resourceTypes: ResourceType[];
  currentMeta: PendingResourceMeta;
  onSaveMeta: (meta: PendingResourceMeta, newUrl?: string) => void;
  onReplace?: (f: File) => void;
  onRemove: () => void;
}

export function ResourceItem({
  name,
  size,
  file,
  isUrl,
  resourceTypes,
  currentMeta,
  onSaveMeta,
  onReplace,
  onRemove,
}: ResourceItemProps) {
  const { show, hide } = usePopupContext();
  const fileExt = getFileExtension(name, isUrl);
  const baseDisplayName = currentMeta.title || name;
  const displayName =
    !isUrl && fileExt && !baseDisplayName.toLowerCase().endsWith(fileExt.toLowerCase())
      ? baseDisplayName + fileExt
      : baseDisplayName;

  const handleEdit = () => {
    show(
      <ResourceEditPendingPopupContent
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
