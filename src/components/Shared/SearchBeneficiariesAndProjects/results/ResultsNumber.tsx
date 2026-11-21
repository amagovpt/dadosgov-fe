"use client";

import { useSearchBenProjStore } from "@/hooks/useSearchBenProj";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

export interface IResultsNumber {
  className?: string;
}

export default function ResultsNumber({ className }: IResultsNumber) {
  const { t } = useTranslation();

  const totalFiltered = useSearchBenProjStore((state) => state.totalFiltered);
  const total = useSearchBenProjStore((state) => state.total);
  const showFilters = useSearchBenProjStore((state) => state.showFilters);

  const isFiltered = (showFilters && showFilters.length > 0) || totalFiltered !== total;

  return isFiltered ? (
    <div
      className={twMerge(
        "text-m-regular text-neutral-700 text-right",
        className,
      )}
    >
      {`${totalFiltered} ${t("results")}`}
    </div>
  ) : null;
}
