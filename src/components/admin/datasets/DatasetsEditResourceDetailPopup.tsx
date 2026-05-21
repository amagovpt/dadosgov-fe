import React from "react";
import { Button } from "@ama-pt/agora-design-system";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import type { Resource } from '@/service/types/dataset';

type DatasetsEditResourceDetailPopupProps = {
  resource: Resource;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
};

export default function DatasetsEditResourceDetailPopup({
  resource,
  onEdit,
  onDelete,
  onClose,
}: DatasetsEditResourceDetailPopupProps) {
  const formatSize = (bytes?: number) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const typeLabel = resource.type === "main" ? "Main file" : resource.type || "-";

  const location =
    resource.filetype === "remote"
      ? "Este recurso é um link externo"
      : "Este recurso encontra-se nos nossos servidores";

  return (
    <div className="flex flex-col gap-16" style={{ minHeight: "60vh" }}>
      {resource.description && <p className="text-neutral-700 text-sm">{resource.description}</p>}
      <div className="flex-1 overflow-y-auto">
        <table className="text-sm w-full">
          <tbody>
            <tr>
              <td className="font-semibold pr-16 py-4 align-top whitespace-nowrap">Tipo</td>
              <td className="py-4">{typeLabel}</td>
            </tr>
            <tr>
              <td className="font-semibold pr-16 py-4 align-top whitespace-nowrap">Localização</td>
              <td className="py-4">{location}</td>
            </tr>
            <tr>
              <td className="font-semibold pr-16 py-4 align-top whitespace-nowrap">URL</td>
              <td className="py-4 break-all">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 underline"
                >
                  {resource.url}
                </a>
              </td>
            </tr>
            {resource.filetype !== "remote" && (
              <>
                <tr>
                  <td className="font-semibold pr-16 py-4 align-top whitespace-nowrap">Formato</td>
                  <td className="py-4">{resource.format || "-"}</td>
                </tr>
                <tr>
                  <td className="font-semibold pr-16 py-4 align-top whitespace-nowrap">
                    Mime Type
                  </td>
                  <td className="py-4">{resource.mime || "-"}</td>
                </tr>
                <tr>
                  <td className="font-semibold pr-16 py-4 align-top whitespace-nowrap">Tamanho</td>
                  <td className="py-4">{formatSize(resource.filesize)}</td>
                </tr>
              </>
            )}
            {resource.checksum && (
              <tr>
                <td className="font-semibold pr-16 py-4 align-top whitespace-nowrap">
                  {resource.checksum.type}
                </td>
                <td className="py-4 break-all font-mono text-xs">{resource.checksum.value}</td>
              </tr>
            )}
            <tr>
              <td className="font-semibold pr-16 py-4 align-top whitespace-nowrap">Criado em</td>
              <td className="py-4">
                {format(new Date(resource.created_at), "d 'de' MMMM 'de' yyyy HH:mm", {
                  locale: pt,
                })}
              </td>
            </tr>
            <tr>
              <td className="font-semibold pr-16 py-4 align-top whitespace-nowrap">
                Modificado em
              </td>
              <td className="py-4">
                {format(new Date(resource.last_modified || resource.created_at), "d 'de' MMMM 'de' yyyy HH:mm", {
                  locale: pt,
                })}
              </td>
            </tr>
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
