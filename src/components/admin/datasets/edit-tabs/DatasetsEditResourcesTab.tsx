import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  CardNoResults,
  Icon,
  LoaderDialog,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@ama-pt/agora-design-system";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import DragAndDropUploader, {
  type SecurityRejection,
} from "@/components/Primitives/DragAndDropUploader/DragAndDropUploader";
import StatusDot from "@/components/admin/StatusDot";
import type { Dataset, Resource } from "@/service/types/dataset";
import AppIcon from "@/components/Primitives/AppIcon";

type DatasetsEditResourcesTabProps = {
  dataset: Dataset;
  uploaderKey: number;
  fileUploadError: string | null;
  isSubmitting: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  onSecurityError: (rejections: SecurityRejection[]) => void;
  onResourceClick: (resource: Resource) => void;
  onResourceEdit: (resource: Resource) => void;
  onDeleteResource: (resource: Resource) => void;
};

export default function DatasetsEditResourcesTab({
  dataset,
  uploaderKey,
  fileUploadError,
  isSubmitting,
  onFileUpload,
  onSecurityError,
  onResourceClick,
  onResourceEdit,
  onDeleteResource,
}: DatasetsEditResourcesTabProps) {
  const { t } = useTranslation("admin-datasets");

  return (
    <div className="mt-24">
      <div className="mb-16 flex items-end gap-16 [&_.drag-and-drop-area_.agora-btn]:w-fit [&_.instructions]:items-center [&_.instructions]:text-center">
        <DragAndDropUploader
          key={uploaderKey}
          label={t("edit.resourcesLabel")}
          dragAndDropLabel={t("edit.resourcesDropLabel")}
          inputLabel={t("edit.resourcesInputLabel")}
          selectedFilesLabel={t("edit.resourcesSelectedFiles")}
          removeFileButtonLabel={t("edit.resourcesRemoveFile")}
          replaceFileButtonLabel={t("edit.resourcesReplaceFile")}
          maxSizeExceededErrorLabel={t("edit.resourcesMaxSizeError")}
          forbiddenExtensionErrorLabel={t("edit.resourcesForbiddenExtensionError")}
          hasError={!!fileUploadError}
          hasFeedback={!!fileUploadError}
          feedbackState="danger"
          feedbackText={fileUploadError ?? undefined}
          multiple
          onChange={onFileUpload}
          onSecurityError={onSecurityError}
        />
        <Button appearance="outline" variant="primary" className="mb-32">
          {t("edit.resourcesReorder")}
        </Button>
      </div>

      {isSubmitting && (
        <div className="mb-16 flex items-center justify-center">
          <LoaderDialog title="A carregar ficheiro(s)..." />
        </div>
      )}

      <h2 className="mb-16 text-base font-medium text-neutral-900">
        {dataset.resources.length}{" "}
        {dataset.resources.length === 1 ? t("edit.resourceSingle") : t("edit.resourcePlural")}
      </h2>

      {dataset.resources.length === 0 && (
        <CardNoResults
          position="center"
          icon={<Icon name="agora-line-document" className="icon-xl h-12 w-12 text-primary-500" />}
          title={t("edit.resourcesEmptyTitle")}
          description={t("edit.resourcesEmptyDescription")}
          hasAnchor={false}
        />
      )}

      {dataset.resources.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{t("edit.resourcesTable.name")}</TableHeaderCell>
              <TableHeaderCell>{t("edit.resourcesTable.status")}</TableHeaderCell>
              <TableHeaderCell>{t("edit.resourcesTable.type")}</TableHeaderCell>
              <TableHeaderCell>{t("edit.resourcesTable.format")}</TableHeaderCell>
              <TableHeaderCell>{t("edit.resourcesTable.createdAt")}</TableHeaderCell>
              <TableHeaderCell>{t("edit.resourcesTable.updatedAt")}</TableHeaderCell>
              <TableHeaderCell>{t("edit.resourcesTable.action")}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataset.resources.map((resource) => (
              <TableRow key={resource.id}>
                <TableCell headerLabel={t("edit.resourcesTable.name")}>
                  <button
                    className="cursor-pointer text-left text-primary-600 underline"
                    onClick={() => onResourceClick(resource)}
                  >
                    {resource.title}
                  </button>
                </TableCell>
                <TableCell headerLabel={t("edit.resourcesTable.status")}>
                  <StatusDot variant="success">{t("edit.resourceStatusAvailable")}</StatusDot>
                </TableCell>
                <TableCell headerLabel={t("edit.resourcesTable.type")}>
                  {resource.type === "main" ? t("edit.resourceMainType") : resource.type || "-"}
                </TableCell>
                <TableCell headerLabel={t("edit.resourcesTable.format")}>
                  {resource.format ? resource.format.toUpperCase() : "-"}
                </TableCell>
                <TableCell headerLabel={t("edit.resourcesTable.createdAt")}>
                  {format(new Date(resource.created_at), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                </TableCell>
                <TableCell headerLabel={t("edit.resourcesTable.updatedAt")}>
                  {format(new Date(resource.last_modified || resource.created_at), "d 'de' MMMM 'de' yyyy", {
                    locale: pt,
                  })}
                </TableCell>
                <TableCell headerLabel={t("edit.resourcesTable.action")}>
                  <div className="flex items-center gap-8">
                    <button
                      className="text-primary-500 hover:text-primary-700"
                      title={t("edit.resourceViewDetails")}
                      onClick={() => onResourceClick(resource)}
                    >
                      <AppIcon name="agora-line-eye" />
                    </button>
                    <button
                      className="text-primary-500 hover:text-primary-700"
                      title={t("edit.resourceEdit")}
                      onClick={() => onResourceEdit(resource)}
                    >
                      <AppIcon name="agora-line-edit" />
                    </button>
                    <button
                      className="text-danger-500 hover:text-danger-700"
                      title={t("edit.resourceDelete")}
                      onClick={() => onDeleteResource(resource)}
                      disabled={isSubmitting}
                    >
                      <AppIcon name="agora-line-trash" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
