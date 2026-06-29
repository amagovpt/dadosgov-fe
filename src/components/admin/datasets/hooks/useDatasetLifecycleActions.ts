"use client";

import type React from "react";
import { deleteDataset, updateDataset } from "@/service/api/datasets";
import type { Dataset } from "@/service/types/dataset";

interface UseDatasetLifecycleActionsParams {
  dataset: Dataset | null;
  hide: () => void;
  push: (href: string) => void;
  keywordsRef: React.MutableRefObject<string>;
  setDataset: React.Dispatch<React.SetStateAction<Dataset | null>>;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  setApiError: React.Dispatch<React.SetStateAction<string | null>>;
  showApiSuccess: (message: string, durationMs?: number) => void;
}

export function useDatasetLifecycleActions({
  dataset,
  hide,
  push,
  keywordsRef,
  setDataset,
  setIsSubmitting,
  setApiError,
  showApiSuccess,
}: UseDatasetLifecycleActionsParams) {
  async function handlePublishDataset() {
    if (!dataset) return;

    try {
      const tagsValue = keywordsRef.current;
      const tags = tagsValue
        ? tagsValue
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : dataset.tags || [];

      const updated = await updateDataset(dataset.id, {
        private: false,
        title: dataset.title,
        description: dataset.description,
        description_short: dataset.description_short || undefined,
        acronym: dataset.acronym || undefined,
        tags,
        license: dataset.license || undefined,
        frequency: dataset.frequency || undefined,
        temporal_coverage: dataset.temporal_coverage || undefined,
        spatial: dataset.spatial || undefined,
        organization: dataset.organization?.id,
      });

      setDataset(updated);
      showApiSuccess("Conjunto de dados publicado com sucesso.");
    } catch {
      setApiError("Erro ao publicar o conjunto de dados.");
    }
  }

  async function handleArchiveDataset() {
    if (!dataset) return;

    setIsSubmitting(true);
    try {
      await updateDataset(dataset.id, { archived: new Date().toISOString() });
      push("/admin/me/datasets?status=archived");
    } catch (error) {
      console.error("Error archiving dataset:", error);
      setApiError("Erro ao arquivar o conjunto de dados.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUnarchiveDataset() {
    if (!dataset) return;

    setIsSubmitting(true);
    try {
      const updated = await updateDataset(dataset.id, { archived: null });
      setDataset(updated);
    } catch (error) {
      console.error("Error unarchiving dataset:", error);
      setApiError("Erro ao desarquivar o conjunto de dados.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteDataset() {
    if (!dataset) return;

    setIsSubmitting(true);
    try {
      await deleteDataset(dataset.id);
      hide();
      push("/admin/me/datasets");
    } catch (error) {
      console.error("Error deleting dataset:", error);
      setApiError("Erro ao eliminar o conjunto de dados.");
      hide();
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    handleArchiveDataset,
    handleDeleteDataset,
    handlePublishDataset,
    handleUnarchiveDataset,
  };
}
