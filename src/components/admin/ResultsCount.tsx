"use client";

import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

export interface ResultsCountI {
  count: number;
  isLoading: boolean;
  className?: string;
}

export default function ResultsCount({ count, isLoading, className }: ResultsCountI) {
  const { t } = useTranslation("admin-common");

  return (
    <p className={twMerge("text-sm mb-16 text-neutral-700", className)}>
      {isLoading ? t("loading") : t("results", { count })}
    </p>
  );
}
