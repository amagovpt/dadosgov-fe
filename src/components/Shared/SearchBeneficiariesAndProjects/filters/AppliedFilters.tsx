"use client";

import { useSearchBenProjStore } from "@/hooks/useSearchBenProj";
import { Button, Tag } from "@ama-pt/agora-design-system";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Typograph } from "../../Generics/Typograph";

export interface IAppliedFilters {
  locale: string;
}

export default function AppliedFilters({ locale }: IAppliedFilters) {
  const { t } = useTranslation();

  const showFilters = useSearchBenProjStore((state) => state.showFilters);
  const removeFilter = useSearchBenProjStore((state) => state.removeFilter);
  const reset = useSearchBenProjStore((state) => state.reset);
  const loading = useSearchBenProjStore((state) => state.loading);
  const data = useSearchBenProjStore((state) => state.data);

  const handleClick = useCallback(
    (name: string) => {
      removeFilter(name, t, locale);
    },
    [removeFilter, t, locale],
  );

  const handleReset = useCallback(() => {
    reset(t, locale);
  }, [reset, t, locale]);

  if (
    !showFilters ||
    showFilters.length === 0 ||
    (!loading && (!data || data.length === 0))
  ) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8 mb-32">
      <div className="flex flex-col gap-16">
        <Typograph tag="p" className="text-m-bold text-primary-900">{`${t(
          "searchBenProj.appliedFilters",
        )} (${showFilters.length})`}</Typograph>
        <div className="flex flex-wrap gap-16">
          {showFilters.map(([name, value]) => (
            <Tag key={`applied-${name}`} onClick={() => handleClick(name)}>
              {value}
            </Tag>
          ))}
        </div>
      </div>

      <Button
        variant="primary"
        appearance="link"
        onClick={handleReset}
        hasIcon
        leadingIcon="agora-line-trash"
        leadingIconHover="agora-line-trash"
        className="!w-fit"
      >
        {t("searchBenProj.reset")}
      </Button>
    </div>
  );
}
