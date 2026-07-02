"use client";

import { Button } from "@ama-pt/agora-design-system";
import TextLink from "@/components/Primitives/TextLink";
import { ResourceType } from "@/service/types/catalog";
import { getFileExtension } from "./utils";
import { PendingResourceMeta } from "./types";

interface ResourceViewPopupContentProps {
  name: string;
  size?: string;
  file?: File;
  isUrl: boolean;
  resourceTypes: ResourceType[];
  meta: PendingResourceMeta;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ResourceViewPopupContent({
  name,
  size,
  file,
  isUrl,
  resourceTypes,
  meta,
  onEdit,
  onDelete,
  onClose,
}: ResourceViewPopupContentProps) {
  const typeLabel =
    resourceTypes.find((rt) => rt.id === meta.resourceType)?.label ?? meta.resourceType;
  const rawExt = getFileExtension(name, isUrl);
  const fileExt = rawExt ? rawExt.slice(1).toUpperCase() : null;
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
