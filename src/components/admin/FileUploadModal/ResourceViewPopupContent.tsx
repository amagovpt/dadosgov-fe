"use client";

import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("admin-common");
  const typeLabel =
    resourceTypes.find((rt) => rt.id === meta.resourceType)?.label ?? meta.resourceType;
  const rawExt = getFileExtension(name, isUrl);
  const fileExt = rawExt ? rawExt.slice(1).toUpperCase() : null;
  const location = isUrl
    ? t("fileUpload.resourceView.location.external")
    : t("fileUpload.resourceView.location.internal");
  const mimeType = meta.mime || file?.type || null;
  const format = meta.format || fileExt?.toLowerCase() || null;

  return (
    <div className="flex flex-col gap-16" style={{ minHeight: "40vh" }}>
      {meta.description && <p className="text-sm text-neutral-700">{meta.description}</p>}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <tbody>
            <tr>
              <td className="whitespace-nowrap py-4 pr-16 align-top font-semibold">
                {t("fileUpload.table.type")}
              </td>
              <td className="py-4">{typeLabel}</td>
            </tr>
            <tr>
              <td className="whitespace-nowrap py-4 pr-16 align-top font-semibold">
                {t("fileUpload.resourceView.locationLabel")}
              </td>
              <td className="py-4">{location}</td>
            </tr>
            {isUrl && (
              <tr>
                <td className="whitespace-nowrap py-4 pr-16 align-top font-semibold">
                  {t("fileUpload.resourceEdit.urlLabel")}
                </td>
                <td className="break-all py-4">
                  <TextLink href={name}>{name}</TextLink>
                </td>
              </tr>
            )}
            {format && (
              <tr>
                <td className="whitespace-nowrap py-4 pr-16 align-top font-semibold">
                  {t("fileUpload.table.format")}
                </td>
                <td className="py-4">{format}</td>
              </tr>
            )}
            {mimeType && (
              <tr>
                <td className="whitespace-nowrap py-4 pr-16 align-top font-semibold">
                  {t("fileUpload.resourceEdit.mimeTypeLabel")}
                </td>
                <td className="py-4">{mimeType}</td>
              </tr>
            )}
            {size && (
              <tr>
                <td className="whitespace-nowrap py-4 pr-16 align-top font-semibold">
                  {t("fileUpload.table.size")}
                </td>
                <td className="py-4">{size}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between pt-8">
        <Button appearance="outline" variant="primary" onClick={onClose}>
          {t("actions.cancel")}
        </Button>
        <div className="flex gap-8">
          <Button
            variant="danger"
            hasIcon
            leadingIcon="agora-line-trash"
            leadingIconHover="agora-solid-trash"
            onClick={onDelete}
          >
            {t("actions.delete")}
          </Button>
          <Button
            variant="primary"
            hasIcon
            leadingIcon="agora-line-edit"
            leadingIconHover="agora-solid-edit"
            onClick={onEdit}
          >
            {t("fileUpload.actions.edit")}
          </Button>
        </div>
      </div>
    </div>
  );
}
