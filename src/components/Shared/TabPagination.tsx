"use client";

import { SearchPagination } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";

interface TabPaginationProps {
  total: number;
  pageSize: number;
  currentPage: number;
  onChange: (page: number) => void;
}

export function TabPagination({ total, pageSize, currentPage, onChange }: TabPaginationProps) {
  const { t } = useTranslation("common");
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="mt-32 flex justify-center">
      <SearchPagination
        totalPages={totalPages}
        activePage={currentPage}
        onChange={onChange}
        label={t("pagination.pagination")}
        nextPageAriaLabel={t("pagination.next")}
        previousPageAriaLabel={t("pagination.previous")}
        boundaryCount={1}
        siblingCount={1}
      />
    </div>
  );
}
