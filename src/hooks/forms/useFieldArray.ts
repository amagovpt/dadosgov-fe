"use client";

import { useCallback, useState } from "react";

export type IndexedFieldErrors = Record<number, string>;

interface UseFieldArrayOptions<TItem> {
  createItem: () => TItem;
  initialItems?: TItem[];
}

export function useFieldArray<TItem>({
  createItem,
  initialItems,
}: UseFieldArrayOptions<TItem>) {
  const [items, setItems] = useState<TItem[]>(() => initialItems ?? [createItem()]);
  const [errors, setErrors] = useState<IndexedFieldErrors>({});

  const updateItem = useCallback((index: number, updater: TItem | ((item: TItem) => TItem)) => {
    setItems((prev) =>
      prev.map((item, currentIndex) => {
        if (currentIndex !== index) return item;
        return typeof updater === "function"
          ? (updater as (item: TItem) => TItem)(item)
          : updater;
      }),
    );
  }, []);

  const appendItem = useCallback((item?: TItem) => {
    setItems((prev) => [...prev, item ?? createItem()]);
  }, [createItem]);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
    setErrors((prev) => {
      const next: IndexedFieldErrors = {};
      Object.entries(prev).forEach(([key, value]) => {
        const currentIndex = Number(key);
        if (currentIndex < index) next[currentIndex] = value;
        if (currentIndex > index) next[currentIndex - 1] = value;
      });
      return next;
    });
  }, []);

  const setItemError = useCallback((index: number, message: string) => {
    setErrors((prev) => ({ ...prev, [index]: message }));
  }, []);

  const clearItemError = useCallback((index: number) => {
    setErrors((prev) => {
      if (!prev[index]) return prev;
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }, []);

  const resetErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    items,
    setItems,
    errors,
    setErrors,
    updateItem,
    appendItem,
    removeItem,
    setItemError,
    clearItemError,
    resetErrors,
  };
}
