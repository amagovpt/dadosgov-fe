"use client";

import type React from "react";
import { useTranslation } from "react-i18next";
import { normalizeRemoteDatasets, type RemoteDatasetEntry } from "@/lib/reuse-remote-datasets";
import {
  fetchReuse,
  linkDatasetToReuse,
  linkDataserviceToReuse,
  updateReuse,
} from "@/service/api/reuses";
import type { Dataset } from "@/service/types/dataset";
import type { Reuse } from "@/service/types/reuse";
import {
  buildRemoteDatasetEntries,
  validateReuseDatasetSelection,
} from "@/components/admin/reuses/form-state/reuseFormModel";

interface UseReuseAssociationActionsParams {
  reuse: Reuse | null;
  reuseId: string;
  selectedDatasets: Dataset[];
  datasetLinks: RemoteDatasetEntry[];
  apiLinks: Array<{ url: string }>;
  previousRemoteEntriesRef: React.MutableRefObject<RemoteDatasetEntry[]>;
  setReuse: React.Dispatch<React.SetStateAction<Reuse | null>>;
  setDatasetLinks: React.Dispatch<React.SetStateAction<RemoteDatasetEntry[]>>;
  setDatasetLinkErrors: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  setSelectedDatasets: React.Dispatch<React.SetStateAction<Dataset[]>>;
  setApiLinks: React.Dispatch<React.SetStateAction<Array<{ url: string }>>>;
  setApiLinkErrors: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  setApiError: React.Dispatch<React.SetStateAction<string | null>>;
  showApiSuccess: (message: string, durationMs?: number) => void;
}

export function useReuseAssociationActions({
  reuse,
  reuseId,
  selectedDatasets,
  datasetLinks,
  apiLinks,
  previousRemoteEntriesRef,
  setReuse,
  setDatasetLinks,
  setDatasetLinkErrors,
  setSelectedDatasets,
  setApiLinks,
  setApiLinkErrors,
  setIsSubmitting,
  setApiError,
  showApiSuccess,
}: UseReuseAssociationActionsParams) {
  const { t } = useTranslation("admin-reuses");

  async function handleSaveDatasetAssociations() {
    if (!reuse) return;

    const remoteEntries = buildRemoteDatasetEntries(datasetLinks);
    const hasLocal = selectedDatasets.length > 0;
    const hasRemote = remoteEntries.length > 0;
    const previousRemoteEntries = previousRemoteEntriesRef.current;
    const previousHadRemote = previousRemoteEntries.length > 0;
    const remoteListChanged =
      JSON.stringify(remoteEntries) !== JSON.stringify(previousRemoteEntries);

    const selectionError = validateReuseDatasetSelection(
      selectedDatasets.length,
      remoteEntries,
      t("form.validationErrors.datasetSelection"),
    );
    if (selectionError) {
      setApiError(selectionError);
      return;
    }

    if (!hasLocal && !remoteListChanged) return;

    setDatasetLinkErrors({});
    setIsSubmitting(true);
    setApiError(null);

    try {
      for (const dataset of selectedDatasets) {
        await linkDatasetToReuse(reuse.id, dataset.id);
      }

      if (remoteListChanged || (previousHadRemote && !hasRemote)) {
        await updateReuse(reuse.id, {
          extras: {
            ...(reuse.extras || {}),
            remote_datasets: remoteEntries,
          },
        });
      }

      const updated = await fetchReuse(reuseId);
      setReuse(updated);
      const refreshedEntries = normalizeRemoteDatasets(updated.extras);
      previousRemoteEntriesRef.current = refreshedEntries;
      setDatasetLinks(refreshedEntries.length > 0 ? refreshedEntries : [{ url: "" }]);
      setSelectedDatasets([]);
      showApiSuccess(t("edit.datasetAssociationsSaved"));
    } catch (error: unknown) {
      const err = error as { data?: Record<string, unknown> };
      if (err.data && typeof err.data === "object") {
        const messages = Object.entries(err.data)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ");
        setApiError(messages);
      } else {
        setApiError(t("edit.datasetAssociationsError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveApiAssociations() {
    if (!reuse) return;

    const errors: Record<number, string> = {};
    apiLinks.forEach((link, index) => {
      if (!link.url.trim() && apiLinks.length > 1) {
        errors[index] = t("form.fieldRequired");
      }
    });

    if (Object.keys(errors).length > 0) {
      setApiLinkErrors(errors);
      return;
    }

    setApiLinkErrors({});
    setIsSubmitting(true);
    setApiError(null);

    try {
      for (const link of apiLinks) {
        if (link.url.trim()) {
          await linkDataserviceToReuse(reuse.id, link.url.trim());
        }
      }

      const updated = await fetchReuse(reuseId);
      setReuse(updated);
      setApiLinks([{ url: "" }]);
      showApiSuccess(t("edit.apiAssociationsSaved"));
    } catch {
      setApiError(t("edit.apiAssociationsError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    handleSaveApiAssociations,
    handleSaveDatasetAssociations,
  };
}
