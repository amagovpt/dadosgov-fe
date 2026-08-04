"use client";

import type React from "react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { usePopupContext } from "@ama-pt/agora-design-system";
import { fetchDataset, uploadResource } from "@/service/api/datasets";
import type { ResourceType } from "@/service/types/catalog";
import type { Dataset, Resource } from "@/service/types/dataset";
import { translateUploadError } from "@/lib/security/translateUploadError";
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
  setFileUploadError: React.Dispatch<React.SetStateAction<string | null>>;
  setUploaderKey: React.Dispatch<React.SetStateAction<number>>;
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
  setFileUploadError,
  setUploaderKey,
  showApiSuccess,
  isUploadingRef,
}: UseDatasetResourceActionsParams) {
  const { t } = useTranslation("admin-datasets");
  // Force a fresh edit popup instance on each open so local state is re-seeded
  // from the current resource instead of reusing stale values from a prior open.
  const editPopupSeqRef = useRef(0);

  async function refreshDataset() {
    const updated = await fetchDataset(slug);
    setDataset(updated);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !dataset) return;
    if (isUploadingRef.current) return;

    isUploadingRef.current = true;
    setIsSubmitting(true);
    setApiError(null);
    setFileUploadError(null);

    try {
      try {
        for (const file of Array.from(files)) {
          await uploadResource(dataset.id, file);
        }
      } catch (error) {
        const err = error as { status?: number; data?: Record<string, unknown>; message?: string };
        console.error("Error uploading resource:", err.status, err.data ?? err.message ?? error);

        if (err.data && typeof err.data === "object" && Object.keys(err.data).length > 0) {
          const flattenValue = (value: unknown): string => {
            if (Array.isArray(value)) return value.map(flattenValue).join("; ");
            if (value && typeof value === "object") {
              return Object.values(value as Record<string, unknown>)
                .map(flattenValue)
                .join("; ");
            }
            return String(value);
          };

          const message =
            (err.data.message as string) ||
            Object.entries(err.data)
              .map(([key, value]) => `${key}: ${flattenValue(value)}`)
              .join(", ");

          setFileUploadError(`${t("edit.resourceUploadError")}: ${translateUploadError(message)}`);
        } else if (err.message) {
          setFileUploadError(`${t("edit.resourceUploadError")}: ${translateUploadError(err.message)}`);
        } else {
          const statusHint = err.status ? ` (HTTP ${err.status})` : "";
          setFileUploadError(`${t("edit.resourceUploadError")}${statusHint}. ${t("edit.resourceUploadRetry")}`);
        }
        return;
      }

      try {
        const updated = await fetchDataset(slug);
        setDataset(updated);
      } catch (refreshError) {
        console.error("Resource uploaded but dataset refresh failed:", refreshError);
      }
      setUploaderKey((currentKey) => currentKey + 1);
      showApiSuccess(t("edit.resourceUploadSuccess"));
    } finally {
      isUploadingRef.current = false;
      setIsSubmitting(false);
    }
  }

  function handleDeleteResource(resource: Resource) {
    if (!dataset) return;

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
              : previousDataset,
          );
          showApiSuccess(t("edit.resourceDeleted"));
        }}
      />,
      {
        title: t("edit.resourceDeleteModalTitle"),
        closeAriaLabel: t("edit.closeAriaLabel"),
        dimensions: "m",
      },
    );
  }

  function handleResourceEdit(resource: Resource) {
    if (!dataset) return;

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
      },
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
          },
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
        onEdit={openEdit}
        onDelete={openDelete}
        onClose={hide}
      />,
      {
        title: resource.title,
        closeAriaLabel: t("edit.closeAriaLabel"),
        dimensions: "l",
      },
    );
  }

  return {
    handleDeleteResource,
    handleFileUpload,
    handleResourceClick,
    handleResourceEdit,
  };
}
