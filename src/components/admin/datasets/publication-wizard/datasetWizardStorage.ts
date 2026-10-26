import type { PendingResourceMeta } from "@/components/admin/FileUploadModal/types";
import type { SpatialZone } from "@/service/types/catalog";

export interface DatasetWizardLocalState {
  datasetId: string | null;
  title: string;
  acronym: string;
  description: string;
  producer: string;
  keywords: string;
  license: string;
  frequency: string;
  temporalStart: string;
  temporalEnd: string;
  spatialCoverage: string;
  spatialGranularity: string;
  contactPointIds: string[];
  spatialZones: SpatialZone[];
  resourceUrls: string[];
  fileNames: string[];
  resourceMetadata: Record<string, PendingResourceMeta>;
}

const STORE = "files";
let database: Promise<IDBDatabase> | undefined;

function openDatabase(): Promise<IDBDatabase> {
  database ??= new Promise((resolve, reject) => {
    const request = indexedDB.open("dadosgov-dataset-creation", 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return database;
}

export async function readWizardFiles(key: string): Promise<File[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get(key);
    request.onsuccess = () => resolve(request.result ?? []);
    request.onerror = () => reject(request.error);
  });
}

export async function saveWizardFiles(key: string, files: File[]): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    const store = transaction.objectStore(STORE);
    if (files.length) store.put(files, key);
    else store.delete(key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export function readWizardState(key: string): DatasetWizardLocalState | null {
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as DatasetWizardLocalState;
    const fields = [
      "title",
      "acronym",
      "description",
      "producer",
      "keywords",
      "license",
      "frequency",
      "temporalStart",
      "temporalEnd",
      "spatialCoverage",
      "spatialGranularity",
    ] as const;
    if (
      !value ||
      !fields.every((field) => typeof value[field] === "string") ||
      !(value.datasetId === null || typeof value.datasetId === "string") ||
      !Array.isArray(value.contactPointIds) ||
      !value.contactPointIds.every((id) => typeof id === "string") ||
      !Array.isArray(value.resourceUrls) ||
      !value.resourceUrls.every((url) => typeof url === "string") ||
      !Array.isArray(value.fileNames) ||
      !value.fileNames.every((name) => typeof name === "string") ||
      !Array.isArray(value.spatialZones) ||
      !value.resourceMetadata ||
      typeof value.resourceMetadata !== "object"
    )
      return null;
    return value;
  } catch {
    return null;
  }
}

export function saveWizardState(key: string, value: DatasetWizardLocalState) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

export function activateWizardSession(scope: string, key: string) {
  const previousKey = sessionStorage.getItem(scope);
  if (previousKey && previousKey !== key) {
    sessionStorage.removeItem(previousKey);
    sessionStorage.removeItem(`${previousKey}:uploads`);
    void saveWizardFiles(previousKey, []).catch(() => {});
  }
  sessionStorage.setItem(scope, key);
}

export async function clearWizardSession(scope: string, key: string) {
  sessionStorage.removeItem(key);
  sessionStorage.removeItem(`${key}:uploads`);
  if (sessionStorage.getItem(scope) === key) sessionStorage.removeItem(scope);
  await saveWizardFiles(key, []);
}
