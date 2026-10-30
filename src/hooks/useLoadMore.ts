"use client";

import { useCallback, useState } from "react";
import { useLoader } from "@/hooks/useLoader";

export type LoadMoreHandler<T> = (nextPage: number) => Promise<{ data: T[] } | T[]>;

interface UseLoadMoreOptions<T> {
  initialItems: T[];
  onLoadMore?: LoadMoreHandler<T>;
  /** when unset, the "see more" stays available while onLoadMore is provided. */
  totalItems?: number;
}

/**
 * accumulates server-paginated items: each call asks `onLoadMore`
 * for the next page and appends the result
 */
export function useLoadMore<T>({ initialItems, onLoadMore, totalItems }: UseLoadMoreOptions<T>) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { showLoader, hideLoader } = useLoader();

  const loadMore = useCallback(async () => {
    if (isLoading || !onLoadMore) return;
    setIsLoading(true);
    showLoader();

    const nextPage = page + 1;
    try {
      const result = await onLoadMore(nextPage);
      const newData = Array.isArray(result) ? result : result?.data || [];
      setItems((prev) => [...prev, ...newData]);
      setPage(nextPage);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
      hideLoader();
    }
  }, [isLoading, onLoadMore, page, showLoader, hideLoader]);

  const hasMore = !!onLoadMore && (typeof totalItems === "number" ? totalItems > items.length : true);

  return { items, isLoading, hasMore, loadMore };
}
