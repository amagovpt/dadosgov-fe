"use client";

import { SortParam } from "@/service/types/datastories/datastory";
import { Typograph } from "../../Generics/Typograph";
import {
  DropdownOption,
  DropdownOptionProps,
  DropdownSection,
  InputSelect,
} from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import { useSearchBenProjStore } from "@/hooks/useSearchBenProj";
import { useCallback } from "react";

export interface ISortBy {
  options: SortParam[];
}

export default function SortBy({ options }: ISortBy) {
  const { t } = useTranslation();

  const sortBy = useSearchBenProjStore((state) => state.sortBy);
  const setSortBy = useSearchBenProjStore((state) => state.setSortBy);
  const loading = useSearchBenProjStore((state) => state.loading);
  const data = useSearchBenProjStore((state) => state.data);

  const handleChange = useCallback(
    (selected: DropdownOptionProps[]) => {
      if (selected.length > 0) {
        setSortBy(selected[0].value as string);
      } else {
        setSortBy(sortBy);
      }
    },
    [sortBy, setSortBy],
  );

  if (!loading && (!data || data.length === 0)) {
    return null;
  }

  return (
    <div className="flex flex-row justify-end xl:mb-64">
      <div className="w-full xl:w-auto flex flex-col xl:flex-row gap-16 items-end xl:items-center search-sortby">
        <Typograph tag="p" className="text-m-regular text-primary-900">
          {t("sortBy")}
        </Typograph>
        <InputSelect
          label={t("sortBy")}
          hideLabel
          hideSectionNames
          searchable={false}
          name="sortBy"
          type="text"
          visibleCount={4}
          value={sortBy}
          onChange={handleChange}
        >
          <DropdownSection name="sortBy">
            {options.map((option, index) => (
              <DropdownOption
                value={option.name}
                key={`sortBy-${index}`}
                selected={sortBy === option.name}
              >
                {option.label}
              </DropdownOption>
            ))}
          </DropdownSection>
        </InputSelect>
      </div>
    </div>
  );
}
