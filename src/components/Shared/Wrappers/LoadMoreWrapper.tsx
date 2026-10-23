"use client";
import React, { useMemo, useState } from "react";
import { useLoader } from "@/hooks/useLoader";
import { twMerge } from "tailwind-merge";
import { useTranslation } from "react-i18next";
import { Button } from "@ama-pt/agora-design-system";

interface LoadMoreWrapperProps<T> {
  initialItems: T[];

  onLoadMore: (nextPage: number) => Promise<{ data: T[] }>;

  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  seeMoreText?: string;

  totalItems?: number;
}

export function LoadMoreWrapper<T>({
  initialItems,
  onLoadMore,
  renderItem,
  className,
  seeMoreText,
  totalItems = undefined,
}: LoadMoreWrapperProps<T>) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { showLoader, hideLoader } = useLoader();

  const { t } = useTranslation();

  const handleAction = async () => {
    if (isLoading) return;
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
  };

  const showLoadMoreButton = useMemo<boolean>(() => {
    return typeof totalItems === "number" ? totalItems > items.length : true;
  }, [totalItems, items]);

  return (
    <div className="flex w-full flex-col gap-32">
      <div
        className={twMerge("grid w-full gap-32 xs:grid-cols-1 xl:grid-cols-2", className)}
        data-testid="load-more-wrapper"
      >
        {items.map((item, index) => renderItem(item, index))}
      </div>

      {showLoadMoreButton && (
        <div className="flex justify-center">
          <Button
            onClick={handleAction}
            disabled={isLoading}
            appearance="link"
            variant="neutral"
            trailingIcon="agora-line-plus-circle"
            trailingIconHover="agora-solid-plus-circle"
            hasIcon
          >
            {t("seeMore", { about: seeMoreText })}
          </Button>
        </div>
      )}
    </div>
  );
}
