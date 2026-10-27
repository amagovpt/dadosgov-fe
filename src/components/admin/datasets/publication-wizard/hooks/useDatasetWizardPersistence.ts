"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchDataset, fetchSpatialZonesByIds } from "@/service/api/datasets";
import {
  activateWizardSession,
  clearWizardSession,
  readWizardFiles,
  readWizardState,
  saveWizardFiles,
  saveWizardState,
} from "../datasetWizardStorage";
import type { DatasetWizardForm } from "./useDatasetWizardForm";

interface UseDatasetWizardPersistenceParams {
  form: DatasetWizardForm;
  storageScope: string | null;
  creationId?: string;
  datasetId?: string | null;
  licenseDefaultValue: string;
  currentStep: number;
  redesigned: boolean;
}

export function useDatasetWizardPersistence({
  form,
  storageScope,
  creationId,
  datasetId,
  licenseDefaultValue,
  currentStep,
  redesigned,
}: UseDatasetWizardPersistenceParams) {
  const { t } = useTranslation(["admin-common", "admin-datasets"]);
  const {
    restoreForm,
    localState: formState,
    uploadedFiles,
    createdDataset,
    setCreatedDataset,
    setApiError,
  } = form;
  const storageKey = storageScope && creationId ? `${storageScope}:${creationId}` : null;
  const [restoredKey, setRestoredKey] = useState<string | null>(null);
  const [localSaveError, setLocalSaveError] = useState(false);
  const sessionClosed = useRef(false);
  const hadStoredFiles = useRef(false);
  // Restore this attempt before mounting inputs, then let the API supply saved resources.
  useEffect(() => {
    if (storageKey && restoredKey === storageKey) return;
    let cancelled = false;
    async function restore() {
      try {
        if (storageScope && storageKey) activateWizardSession(storageScope, storageKey);
        const stored = storageKey ? readWizardState(storageKey) : null;
        const local =
          stored && (!datasetId || !stored.datasetId || stored.datasetId === datasetId)
            ? stored
            : null;
        const id = datasetId || local?.datasetId;
        const dataset = id ? await fetchDataset(id) : null;
        const storedFiles =
          storageKey && local?.fileNames.length ? await readWizardFiles(storageKey) : [];
        const files = (local?.fileNames ?? [])
          .map((name) => storedFiles.find((file) => file.name === name))
          .filter((file): file is File => !!file);
        if (cancelled) return;
        if (local?.fileNames.length && files.length !== local.fileNames.length) {
          throw new Error("Pending files could not be recovered");
        }
        const coverage = local?.spatialCoverage ?? dataset?.spatial?.zones?.join(",") ?? "";
        const zones =
          local?.spatialZones ??
          (coverage ? await fetchSpatialZonesByIds(coverage.split(",")) : []);
        if (cancelled) return;
        restoreForm({ dataset, local, files, zones });
        hadStoredFiles.current = files.length > 0;
        setRestoredKey(storageKey ?? "server");
      } catch (error) {
        if (!cancelled) {
          console.error("Error restoring dataset creation:", error);
          setApiError(t("admin-datasets:form.restoreError"));
        }
      }
    }
    void restore();
    return () => {
      cancelled = true;
    };
  }, [storageKey, storageScope, restoredKey, datasetId, restoreForm, setApiError, t]);

  const localState = useMemo(
    () => ({
      ...formState,
      datasetId: formState.datasetId ?? datasetId ?? null,
      license: licenseDefaultValue,
    }),
    [formState, datasetId, licenseDefaultValue]
  );

  useEffect(() => {
    if (!storageKey || restoredKey !== storageKey || sessionClosed.current) return;
    try {
      saveWizardState(storageKey, localState);
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Report an actual browser storage failure.
      setLocalSaveError(true);
    }
  }, [storageKey, restoredKey, localState]);

  useEffect(() => {
    if (!storageKey || restoredKey !== storageKey || sessionClosed.current) return;
    if (!uploadedFiles.length && !hadStoredFiles.current) return;
    hadStoredFiles.current = uploadedFiles.length > 0;
    void saveWizardFiles(storageKey, uploadedFiles).catch(() => setLocalSaveError(true));
  }, [storageKey, restoredKey, uploadedFiles]);

  const reviewDatasetId = createdDataset?.id;
  useEffect(() => {
    if (!redesigned || currentStep !== 4 || !reviewDatasetId) return;
    let cancelled = false;
    // Resource uploads can change the quality score after the draft was first created.
    fetchDataset(reviewDatasetId)
      .then((dataset) => {
        if (!cancelled) setCreatedDataset(dataset);
      })
      .catch(() => {
        if (!cancelled) setApiError(t("admin-datasets:review.refreshError"));
      });
    return () => {
      cancelled = true;
    };
  }, [currentStep, redesigned, reviewDatasetId, setCreatedDataset, setApiError, t]);

  const clearSession = useCallback(() => {
    sessionClosed.current = true;
    if (storageScope && storageKey)
      void clearWizardSession(storageScope, storageKey).catch(() => {});
  }, [storageScope, storageKey]);

  return {
    isRestored: !storageKey || restoredKey === storageKey,
    localSaveError,
    uploadProgressKey: storageKey ? `${storageKey}:uploads` : undefined,
    clearSession,
  };
}
