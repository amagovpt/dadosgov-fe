"use client";

import useMobile from "@/hooks/useMobile";
import { useSearchBenProjStore } from "@/hooks/useSearchBenProj";
import { SearchPagination } from "@ama-pt/agora-design-system";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export default function Pagination() {
  const { t } = useTranslation();
  const isMobile = useMobile();

  const setPage = useSearchBenProjStore((state) => state.setPage);
  const nPages = useSearchBenProjStore((state) => state.nPages);
  const page = useSearchBenProjStore((state) => state.page);
  const sortBy = useSearchBenProjStore((state) => state.sortBy);
  const indicator = useSearchBenProjStore((state) => state.indicator);
  const data = useSearchBenProjStore((state) => state.data);

  const handlePageChange = useCallback(
    (pageIndex: number) => {
      const nextPage = pageIndex + 1;
      if (nextPage !== page) {
        setPage(nextPage);
      }
    },
    [page, setPage],
  );

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-row justify-center xl:mt-64">
      <div className="max-w-full w-fit">
        <SearchPagination
          key={`${sortBy}-${indicator}`}
          totalPages={nPages}
          boundaryCount={1}
          siblingCount={isMobile ? 1 : 4}
          label={t("pagination")}
          previousPageAriaLabel={t("previous")}
          nextPageAriaLabel={t("next")}
          onChange={handlePageChange}
        />
      </div>
    </div>
  );
}
