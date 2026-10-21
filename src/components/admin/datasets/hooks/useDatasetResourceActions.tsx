"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePopupContext } from "@ama-pt/agora-design-system";
import {
  fetchDataset,
  fetchAllowedExtensions,
  uploadResource,
  createResource,
  updateResource,
  replaceResourceFile,
} from "@/service/api/datasets";
import type { ResourceType } from "@/service/types/catalog";
import type { Dataset, Resource } from "@/service/types/dataset";
import { translateUploadError } from "@/lib/security/translateUploadError";
import { can } from "@/utils/permissions";
import DeleteResourcePopup from "@/components/admin/datasets/resource-dialogs/DeleteResourcePopup";
import DatasetsEditResourceDetailPopup from "@/components/admin/datasets/resource-dialogs/DatasetsEditResourceDetailPopup";
import { usePendingResourceEditor } from "@/components/admin/FileUploadModal/usePendingResourceEditor";
import type { PendingResourceMeta } from "@/components/admin/FileUploadModal/types";

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
  const { openEditors, editor } = usePendingResourceEditor();
  const queuedFiles = useRef(new WeakSet<File>());
  const queuedUrls = useRef(new Set<string>());
  const [allowedExtensions, setAllowedExtensions] = useState<string[] | null>(null);
  const latestDataset = useRef(dataset);
  useEffect(() => {
    latestDataset.current = dataset;
  }, [dataset]);
  useEffect(() => {
    let cancelled = false;
    fetchAllowedExtensions()
      .then((extensions) => {
        if (!cancelled) setAllowedExtensions(extensions);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshDataset() {
    try {
      const updated = await fetchDataset(slug);
      setDataset(updated);
    } catch {
      setApiError(t("resources.refreshError"));
    }
  }

  function requireResourcePermission() {
    const current = latestDataset.current;
    if (!current || !can(current, "edit_resources") || current.deleted)
      throw new Error(t("resourceEditing.notAllowed"));
    return current;
  }

  function recordResource(resource: Resource) {
    setDataset((previous) =>
      previous
        ? {
            ...previous,
            resources: previous.resources.some((item) => item.id === resource.id)
              ? previous.resources.map((item) => (item.id === resource.id ? resource : item))
              : [...previous.resources, resource],
          }
        : previous
    );
  }

  function openResourceEditor(item: File | string | Resource) {
    const saved = typeof item === "object" && !(item instanceof File) ? item : undefined;
    const file = item instanceof File ? item : undefined;
    const isUrl = typeof item === "string" || saved?.filetype === "remote";
    let name = typeof item === "string" ? item : file?.name || saved!.title;
    if (saved) {
      if (isUrl) name = saved.url;
      else {
        try {
          name = decodeURIComponent(new URL(saved.url).pathname.split("/").pop() || saved.title);
        } catch {
          name = saved.title;
        }
      }
    }
    // Reuse a completed upload if saving its metadata fails and the user retries.
    let stored = saved;
    let storedFile = file;
    openEditors([
      {
        name,
        isUrl,
        file,
        resource: saved,
        resourceTypes,
        allowedExtensions,
        initialMeta: {
          title: saved?.title || name,
          resourceType: saved?.type || "main",
          description: saved?.description || "",
          format: saved?.format,
          mime: saved?.mime,
          filesize: saved?.filesize === undefined ? undefined : String(saved.filesize),
        },
        // New selections have not been persisted, so closing discards only this editor session.
        onDiscard: saved
          ? undefined
          : () => {
              if (isUrl) queuedUrls.current.delete(name);
            },
        onSave: async (meta: PendingResourceMeta, newUrl?: string, replacement?: File) => {
          const currentDataset = requireResourcePermission();
          if (isUploadingRef.current) throw new Error(t("resourceEditing.uploadBusy"));
          if (
            isUrl &&
            (currentDataset.resources.some(
              (resource) => resource.id !== stored?.id && resource.url === newUrl
            ) ||
              (newUrl !== name && !!newUrl && queuedUrls.current.has(newUrl)))
          )
            throw new Error(t("resourceEditing.duplicateUrl"));
          isUploadingRef.current = true;
          setIsSubmitting(true);
          setApiError(null);
          try {
            const payload = {
              title: meta.title,
              description: meta.description,
              type: meta.resourceType,
              format: meta.format ?? "",
              mime: meta.mime ?? "",
              filesize: meta.filesize === undefined ? undefined : Number(meta.filesize),
            };
            if (!stored && isUrl) {
              stored = await createResource(currentDataset.id, {
                ...payload,
                url: newUrl!,
                filetype: "remote",
              });
              recordResource(stored);
            } else {
              const nextFile = replacement || file;
              if (!stored && nextFile) {
                stored = await uploadResource(currentDataset.id, nextFile);
                storedFile = nextFile;
                recordResource(stored);
              } else if (stored && replacement && replacement !== storedFile) {
                const replaced = await replaceResourceFile(
                  currentDataset.id,
                  stored.id,
                  replacement
                );
                stored = { ...stored, ...replaced };
                storedFile = replacement;
                recordResource(stored);
              }
              if (!stored) throw new Error(t("edit.resourceSaveError"));
              stored = await updateResource(currentDataset.id, stored.id, {
                ...payload,
                ...(isUrl ? { url: newUrl } : {}),
              });
              recordResource(stored);
            }
            await refreshDataset();
            if (isUrl) queuedUrls.current.delete(name);
            showApiSuccess(
              t(
                saved
                  ? "edit.resourceUpdated"
                  : isUrl
                    ? "resources.linkSaved"
                    : "resources.filesSaved"
              )
            );
          } catch (error) {
            const err = error as { data?: { message?: string }; message?: string };
            throw new Error(
              translateUploadError(err.data?.message || err.message || t("edit.resourceSaveError"))
            );
          } finally {
            isUploadingRef.current = false;
            setIsSubmitting(false);
          }
        },
      },
    ]);
  }

  async function handleFilesUpload(files: File[]) {
    requireResourcePermission();
    for (const file of files) {
      if (queuedFiles.current.has(file)) continue;
      queuedFiles.current.add(file);
      openResourceEditor(file);
    }
  }

  async function handleUrlAdd(url: string) {
    const currentDataset = requireResourcePermission();
    if (
      queuedUrls.current.has(url) ||
      currentDataset.resources.some((resource) => resource.url === url)
    )
      throw new Error(t("resourceEditing.duplicateUrl"));
    queuedUrls.current.add(url);
    openResourceEditor(url);
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
    openResourceEditor(resource);
  }

  function handleResourceClick(resource: Resource) {
    if (!dataset) return;
    if (can(dataset, "edit_resources") && !dataset.deleted) {
      handleResourceEdit(resource);
      return;
    }
    show(<DatasetsEditResourceDetailPopup resource={resource} onClose={hide} />, {
      title: resource.title,
      closeAriaLabel: t("edit.closeAriaLabel"),
      dimensions: "l",
    });
  }

  return {
    editor,
    allowedExtensions,
    handleDeleteResource,
    handleFilesUpload,
    handleUrlAdd,
    handleResourceClick,
    handleResourceEdit,
  };
}
