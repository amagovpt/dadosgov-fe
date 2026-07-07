import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@ama-pt/agora-design-system";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import type { Resource } from "@/service/types/dataset";
import TextLink from "@/components/Primitives/TextLink";

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
  const { t } = useTranslation("admin-datasets");

  const formatSize = (bytes?: number) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const typeLabel = resource.type === "main" ? t("edit.resourceMainType") : resource.type || "-";

  const location =
    resource.filetype === "remote"
      ? t("edit.resourceExternalLocation")
      : t("edit.resourceInternalLocation");

  return (
    <div className="flex flex-col gap-16" style={{ minHeight: "60vh" }}>
      {resource.description && <p className="text-sm text-neutral-700">{resource.description}</p>}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <tbody>
            <tr>
              <td className="whitespace-nowrap py-4 pr-16 align-top font-semibold">
                {t("edit.resourcesTable.type")}
              </td>
              <td className="py-4">{typeLabel}</td>
            </tr>
            <tr>
              <td className="whitespace-nowrap py-4 pr-16 align-top font-semibold">
                {t("edit.resourceLocation")}
              </td>
              <td className="py-4">{location}</td>
            </tr>
            <tr>
              <td className="whitespace-nowrap py-4 pr-16 align-top font-semibold">
                {t("edit.resourceUrlLabel")}
              </td>
              <td className="break-all py-4">
                <TextLink href={resource.url}>{resource.url}</TextLink>
              </td>
            </tr>
            {resource.filetype !== "remote" && (
              <>
                <tr>
                  <td className="whitespace-nowrap py-4 pr-16 align-top font-semibold">
                    {t("edit.resourcesTable.format")}
                  </td>
                  <td className="py-4">{resource.format || "-"}</td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap py-4 pr-16 align-top font-semibold">
                    {t("edit.resourceMimeField")}
                  </td>
                  <td className="py-4">{resource.mime || "-"}</td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap py-4 pr-16 align-top font-semibold">
                    {t("edit.resourceSizeLabel")}
                  </td>
                  <td className="py-4">{formatSize(resource.filesize)}</td>
                </tr>
              </>
            )}
            {resource.checksum && (
              <tr>
                <td className="whitespace-nowrap py-4 pr-16 align-top font-semibold">
                  {resource.checksum.type}
                </td>
                <td className="break-all py-4 font-mono text-xs">{resource.checksum.value}</td>
              </tr>
            )}
            <tr>
              <td className="whitespace-nowrap py-4 pr-16 align-top font-semibold">
                {t("edit.resourcesTable.createdAt")}
              </td>
              <td className="py-4">
                {format(new Date(resource.created_at), "d 'de' MMMM 'de' yyyy HH:mm", {
                  locale: pt,
                })}
              </td>
            </tr>
            <tr>
              <td className="whitespace-nowrap py-4 pr-16 align-top font-semibold">
                {t("edit.resourceModifiedAt")}
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
          {t("edit.cancel")}
        </Button>
        <div className="flex gap-8">
          <Button
            variant="danger"
            hasIcon
            leadingIcon="agora-line-trash"
            leadingIconHover="agora-solid-trash"
            onClick={onDelete}
          >
            {t("edit.confirmDelete")}
          </Button>
          <Button
            variant="primary"
            hasIcon
            leadingIcon="agora-line-edit"
            leadingIconHover="agora-solid-edit"
            onClick={onEdit}
          >
            {t("edit.resourceEditAction")}
          </Button>
        </div>
      </div>
    </div>
  );
}
