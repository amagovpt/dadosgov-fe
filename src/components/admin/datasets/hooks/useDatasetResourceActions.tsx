"use client";

import type React from "react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { usePopupContext } from "@ama-pt/agora-design-system";
import { fetchDataset, uploadResource, createResource } from "@/service/api/datasets";
import type { ResourceType } from "@/service/types/catalog";
import type { Dataset, Resource } from "@/service/types/dataset";
import { translateUploadError } from "@/lib/security/translateUploadError";
import { can } from "@/utils/permissions";
import DeleteResourcePopup from "@/components/admin/datasets/resource-dialogs/DeleteResourcePopup";
import DatasetsEditResourceDetailPopup from "@/components/admin/datasets/resource-dialogs/DatasetsEditResourceDetailPopup";
import DatasetsEditResourceEditPopup from "@/components/admin/datasets/resource-dialogs/DatasetsEditResourceEditPopup";

interface UseDatasetResourceActionsParams {
  dataset: Dataset | null;
  slug: string;
  resourceTypes: ResourceType[];
  show: ReturnType<typeof usePopupContext>["show"];
  hide: () => void;
  setDataset: React.Dispatch<React.SetStateAction<Dataset | null>>;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  setApiError: React.Dispatch<React.SetStateAction<string | null>>;
  showApiSuccess: (message: string, durationMs?: number) => void;
  isUploadingRef: React.MutableRefObject<boolean>;
}

export function useDatasetResourceActions({
  dataset,
  slug,
  resourceTypes,
  show,
  hide,
  setDataset,
  setIsSubmitting,
  setApiError,
  showApiSuccess,
  isUploadingRef,
}: UseDatasetResourceActionsParams) {
  const { t } = useTranslation("admin-datasets");
  // Force a fresh edit popup instance on each open so local state is re-seeded
  // from the current resource instead of reusing stale values from a prior open.
  const editPopupSeqRef = useRef(0);

  async function refreshDataset() {
    try {
      const updated = await fetchDataset(slug);
      setDataset(updated);
    } catch {
      setApiError(t("resources.refreshError"));
    }
  }

  function requireResourcePermission() {
    if (!dataset || !can(dataset, "edit_resources") || dataset.deleted)
      throw new Error(t("resourceEditing.notAllowed"));
    return dataset;
  }

  function recordResource(resource: Resource) {
    setDataset((previous) =>
      previous
        ? {
            ...previous,
            resources: [...previous.resources.filter((item) => item.id !== resource.id), resource],
          }
        : previous
    );
  }

  async function handleFilesUpload(files: File[]) {
    const currentDataset = requireResourcePermission();
    if (!files.length) return;
    if (isUploadingRef.current) throw new Error(t("resourceEditing.uploadBusy"));
    isUploadingRef.current = true;
    setIsSubmitting(true);
    setApiError(null);
    let currentFile: File | undefined;
    try {
      for (const file of files) {
        currentFile = file;
        const resource = await uploadResource(currentDataset.id, file);
        recordResource(resource);
      }
    } catch (error) {
      const err = error as { data?: { message?: string }; message?: string };
      const detail = translateUploadError(
        err.data?.message || err.message || t("edit.resourceUploadRetry")
      );
      throw new Error(
        t("resourceEditing.fileSaveError", { name: currentFile?.name || "", message: detail })
      );
    } finally {
      isUploadingRef.current = false;
      setIsSubmitting(false);
    }
  }

  async function handleUrlAdd(url: string) {
    const currentDataset = requireResourcePermission();
    if (isUploadingRef.current) throw new Error(t("resourceEditing.uploadBusy"));
    if (currentDataset.resources.some((resource) => resource.url === url))
      throw new Error(t("resourceEditing.duplicateUrl"));
    isUploadingRef.current = true;
    setIsSubmitting(true);
    setApiError(null);
    try {
      recordResource(
        await createResource(currentDataset.id, {
          title: url,
          url,
          type: "main",
          filetype: "remote",
        })
      );
    } catch (error) {
      const err = error as { data?: { message?: string }; message?: string };
      throw new Error(
        translateUploadError(err.data?.message || err.message || t("resources.linkSaveError"))
      );
    } finally {
      isUploadingRef.current = false;
      setIsSubmitting(false);
    }
  }

  function handleDeleteResource(resource: Resource) {
    if (!dataset || !can(dataset, "edit_resources") || dataset.deleted) return;

    show(
      <DeleteResourcePopup
        datasetId={dataset.id}
        resource={resource}
        onDeleted={() => {
          setDataset((previousDataset) =>
            previousDataset
              ? {
                  ...previousDataset,
                  resources: previousDataset.resources.filter((item) => item.id !== resource.id),
                }
              : previousDataset
          );
          showApiSuccess(t("edit.resourceDeleted"));
        }}
      />,
      {
        title: t("edit.resourceDeleteModalTitle"),
        closeAriaLabel: t("edit.closeAriaLabel"),
        dimensions: "m",
      }
    );
  }

  function handleResourceEdit(resource: Resource) {
    if (!dataset || !can(dataset, "edit_resources") || dataset.deleted) return;

    show(
      <DatasetsEditResourceEditPopup
        key={`resource-edit-${resource.id}-${++editPopupSeqRef.current}`}
        resource={resource}
        datasetId={dataset.id}
        resourceTypes={resourceTypes}
        onSaved={async () => {
          await refreshDataset();
          showApiSuccess(t("edit.resourceUpdated"));
        }}
        onCancel={hide}
      />,
      {
        title: resource.title,
        closeAriaLabel: t("edit.closeAriaLabel"),
        dimensions: "l",
      }
    );
  }

  function handleResourceClick(resource: Resource) {
    if (!dataset) return;

    const openEdit = () => {
      hide();
      setTimeout(() => {
        show(
          <DatasetsEditResourceEditPopup
            key={`resource-edit-${resource.id}-${++editPopupSeqRef.current}`}
            resource={resource}
            datasetId={dataset.id}
            resourceTypes={resourceTypes}
            onSaved={async () => {
              await refreshDataset();
              showApiSuccess(t("edit.resourceUpdated"));
            }}
            onCancel={hide}
          />,
          {
            title: resource.title,
            closeAriaLabel: t("edit.closeAriaLabel"),
            dimensions: "l",
          }
        );
      }, 100);
    };

    const openDelete = () => {
      hide();
      setTimeout(() => {
        handleDeleteResource(resource);
      }, 100);
    };

    show(
      <DatasetsEditResourceDetailPopup
        resource={resource}
        onEdit={can(dataset, "edit_resources") && !dataset.deleted ? openEdit : undefined}
        onDelete={can(dataset, "edit_resources") && !dataset.deleted ? openDelete : undefined}
        onClose={hide}
      />,
      {
        title: resource.title,
        closeAriaLabel: t("edit.closeAriaLabel"),
        dimensions: "l",
      }
    );
  }

  return {
    handleDeleteResource,
    handleFilesUpload,
    handleUrlAdd,
    handleResourceClick,
    handleResourceEdit,
  };
}
