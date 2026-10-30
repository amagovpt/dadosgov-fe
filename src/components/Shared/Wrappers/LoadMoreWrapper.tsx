"use client";
import React from "react";
import { twMerge } from "tailwind-merge";
import { useTranslation } from "react-i18next";
import { Button } from "@ama-pt/agora-design-system";
import { LoadMoreHandler, useLoadMore } from "@/hooks/useLoadMore";

interface LoadMoreWrapperProps<T> {
  initialItems: T[];

  onLoadMore: LoadMoreHandler<T>;

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
  const { items, isLoading, hasMore, loadMore } = useLoadMore({
    initialItems,
    onLoadMore,
    totalItems,
  });

  const { t } = useTranslation();

  return (
    <div className="w-full flex flex-col gap-32">
      <div
        className={twMerge(
          "grid xs:grid-cols-1 xl:grid-cols-2 gap-32 w-full",
          className,
        )}
        data-testid="load-more-wrapper"
      >
        {items.map((item, index) => renderItem(item, index))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            onClick={loadMore}
            disabled={isLoading}
            appearance="link"
            trailingIcon="agora-line-plus-circle"
            trailingIconHover="agora-solid-plus-circle"
            hasIcon
            variant="neutral"
          >
            {t("seeMore", { about: seeMoreText })}
          </Button>
        </div>
      )}
    </div>
  );
}
