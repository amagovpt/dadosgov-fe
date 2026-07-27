"use client";

import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";
import { INTL_LOCALES } from "@/utils/formatDate";

export interface ResultsCountI {
  count: number;
  isLoading: boolean;
  className?: string;
}

export default function ResultsCount({ count, isLoading, className }: ResultsCountI) {
  const { i18n, t } = useTranslation("admin-common");
  const language = i18n.language?.split("-")[0] as keyof typeof INTL_LOCALES | undefined;
  const intlLocale = language && language in INTL_LOCALES ? INTL_LOCALES[language] : INTL_LOCALES.pt;
  const formattedCount = count.toLocaleString(intlLocale);

  return (
    <p className={twMerge("text-sm mb-16 text-neutral-700", className)}>
      {isLoading ? t("loading") : t("results", { count, formattedCount })}
    </p>
  );
}
