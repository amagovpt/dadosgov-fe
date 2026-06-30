import type { Dataset } from "@/service/types/dataset";
import type { RemoteDatasetEntry } from "@/lib/reuse-remote-datasets";

export type IndexedErrors = Record<number, string>;
export type UrlItem = { url: string };

export function buildSelectedDatasetsFromIds(
  selectedIds: string[],
  pool: Dataset[],
): Dataset[] {
  const selectedIdsSet = new Set(selectedIds);
  const seen = new Set<string>();
  const next: Dataset[] = [];

  for (const dataset of pool) {
    if (selectedIdsSet.has(dataset.id) && !seen.has(dataset.id)) {
      seen.add(dataset.id);
      next.push(dataset);
    }
  }

  return next;
}

export function updateRemoteDatasetEntry(
  entries: RemoteDatasetEntry[],
  index: number,
  patch: Partial<RemoteDatasetEntry>,
): RemoteDatasetEntry[] {
  const next = [...entries];
  next[index] = { ...next[index], ...patch };
  return next;
}

export function clearIndexedErrorIfFilled(
  errors: IndexedErrors,
  index: number,
  value: string,
): IndexedErrors {
  if (!value.trim() || !errors[index]) {
    return errors;
  }

  const next = { ...errors };
  delete next[index];
  return next;
}

export function addRemoteDatasetEntry(
  entries: RemoteDatasetEntry[],
  errors: IndexedErrors,
  requiredMessage: string,
): { entries: RemoteDatasetEntry[]; errors: IndexedErrors } {
  const lastIndex = entries.length - 1;

  if (!entries[lastIndex].url.trim()) {
    return {
      entries,
      errors: { ...errors, [lastIndex]: requiredMessage },
    };
  }

  return {
    entries: [...entries, { url: "" }],
    errors,
  };
}

export function removeRemoteDatasetEntry(
  entries: RemoteDatasetEntry[],
  errors: IndexedErrors,
  index: number,
): { entries: RemoteDatasetEntry[]; errors: IndexedErrors } {
  const nextEntries = entries.filter((_, itemIndex) => itemIndex !== index);
  const nextErrors: IndexedErrors = {};

  Object.entries(errors).forEach(([key, value]) => {
    const numericKey = Number(key);
    if (numericKey < index) nextErrors[numericKey] = value;
    else if (numericKey > index) nextErrors[numericKey - 1] = value;
  });

  return {
    entries: nextEntries.length > 0 ? nextEntries : [{ url: "" }],
    errors: nextErrors,
  };
}

export function updateUrlItem<T extends UrlItem>(
  items: T[],
  index: number,
  patch: Partial<T>,
): T[] {
  const next = [...items];
  next[index] = { ...next[index], ...patch };
  return next;
}

export function addUrlItem<T extends UrlItem>(
  items: T[],
  errors: IndexedErrors,
  requiredMessage: string,
  createEmptyItem: () => T,
): { items: T[]; errors: IndexedErrors } {
  const lastIndex = items.length - 1;

  if (!items[lastIndex].url.trim()) {
    return {
      items,
      errors: { ...errors, [lastIndex]: requiredMessage },
    };
  }

  return {
    items: [...items, createEmptyItem()],
    errors,
  };
}

export function removeUrlItem<T>(
  items: T[],
  index: number,
  createEmptyItem: () => T,
): T[] {
  const nextItems = items.filter((_, itemIndex) => itemIndex !== index);
  return nextItems.length > 0 ? nextItems : [createEmptyItem()];
}
