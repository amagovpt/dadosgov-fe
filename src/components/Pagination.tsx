"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { SearchPagination } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  baseUrl?: string; // kept for API compatibility, not used
  // When provided, navigation is handled in-memory via this callback instead
  // of pushing a `?page=` URL change (used for paginating embedded content
  // such as the resource preview, where the route must not change).
  onPageChange?: (page: number) => void;
}

function buildPageUrl(page: number): string {
  if (typeof window === "undefined") return `?page=${page}`;
  const params = new URLSearchParams(window.location.search);
  if (page === 1) {
    params.delete("page");
  } else {
    params.set("page", String(page));
  }
  const qs = params.toString();
  return `${window.location.pathname}${qs ? `?${qs}` : ""}`;
}

export const Pagination = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) => {
  const { t } = useTranslation("common");

  const router = useRouter();
  const totalPages = Math.ceil(totalItems / pageSize);

  const navigate = useCallback(
    (page: number) => {
      if (onPageChange) {
        onPageChange(page);
        return;
      }
      router.push(buildPageUrl(page));
    },
    [router, onPageChange]
  );

  if (totalPages <= 1) return null;

  return (
    <SearchPagination
      totalPages={totalPages}
      activePage={currentPage}
      onChange={navigate}
      label={t("pagination.pagination")}
      nextPageAriaLabel={t("pagination.next")}
      previousPageAriaLabel={t("pagination.previous")}
      boundaryCount={1}
      siblingCount={1}
    />
  );
};
