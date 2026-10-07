"use client";

import { useTranslation } from "react-i18next";
import { useSearchBenProjStore } from "@/hooks/useSearchBenProj";
import {
  useState,
  useMemo,
  useCallback,
  ChangeEvent,
  KeyboardEvent,
} from "react";
import GroupTitle from "./GroupTitle";
import SpecificObjectiveFilter from "./SpecificObjectiveFilter";
import {
  InputSearch,
  InputText,
  RadioButton,
  RadioButtonGroup,
  Sidebar,
  SidebarItem,
} from "@ama-pt/agora-design-system";
import { MIN_NUMBER, MAX_NUMBER, RangedNumberFilter } from "./constants";
import { RadioButtonOption } from "../../RadioButtonGroup";
import { twMerge } from "tailwind-merge";
import useMobile from "@/hooks/useMobile";

const FiltersClassNames: Record<string, string> = {
  policyObjectives: "h-[222px]",
  programmes: "h-[300px]",
  thematicAreas: "h-[222px]",
  regions: "h-[222px]",
  municipalities: "h-[222px]",
};

export type AdvancedFilter = {
  name: string;
  label: string;
  options?: RadioButtonOption[];
  min?: number;
  max?: number;
};

export interface IAdvancedFilters {
  filters: AdvancedFilter[];
  locale: string;
  showSpecificObjective?: boolean;
}

export default function AdvancedFilters({ filters, locale, showSpecificObjective = false }: IAdvancedFilters) {
  const { t } = useTranslation();

  const isMobile = useMobile();

  const filtersStore = useSearchBenProjStore((state) => state.filters);
  const addFilter = useSearchBenProjStore((state) => state.addFilter);
  const appliedFilters = useSearchBenProjStore((state) => state.appliedFilters);
  const applyFilter = useSearchBenProjStore((state) => state.applyFilter);
  const removeFilter = useSearchBenProjStore((state) => state.removeFilter);
  const indicator = useSearchBenProjStore((state) => state.indicator);
  const rangedFiltersDetails = useSearchBenProjStore(
    (state) => state.rangedFiltersDetails,
  );

  const [searchValues, setSearchValues] = useState<Record<string, string>>({});

  const advancedFilters = useMemo<AdvancedFilter[]>(() => {
    return filters.map((f) => {
      let aF: AdvancedFilter = { ...f };
      if (
        RangedNumberFilter.includes(
          f.name as (typeof RangedNumberFilter)[number],
        )
      ) {
        switch (f.name) {
          case "amounts": {
            const amountRange =
              indicator === "paid"
                ? {
                    min: rangedFiltersDetails.paidValueMin,
                    max: rangedFiltersDetails.paidValueMax,
                  }
                : indicator === "executed"
                  ? {
                      min: rangedFiltersDetails.executedValueMin,
                      max: rangedFiltersDetails.executedValueMax,
                    }
                  : {
                      min: rangedFiltersDetails.approvedValueMin,
                      max: rangedFiltersDetails.approvedValueMax,
                    };
            aF = {
              ...aF,
              min: amountRange.min,
              max: amountRange.max,
            };
            break;
          }
          case "projectsAmount":
            aF = {
              ...aF,
              min: rangedFiltersDetails.projectsAmountMin,
              max: rangedFiltersDetails.projectsAmountMax,
            };
            break;
          default:
            break;
        }
      }
      return aF;
    });
  }, [filters, indicator, rangedFiltersDetails]);

  const filteredOptions = useMemo(() => {
    return advancedFilters.reduce(
      (acc, f) => {
        const searchValue = searchValues[f.name] || "";
        const filtered =
          f.options?.filter((option) =>
            option.label.toLowerCase().includes(searchValue.toLowerCase()),
          ) || [];
        acc[f.name] = filtered;
        return acc;
      },
      {} as Record<string, RadioButtonOption[]>,
    );
  }, [advancedFilters, searchValues]);

  const handleSearchChange = (filterName: string, value: string) => {
    setSearchValues((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const handleChange = useCallback(
    (name: string, value: string) => {
      if (appliedFilters[name] && appliedFilters[name] === value) {
        removeFilter(name, t, locale);
      } else {
        addFilter(name, value, t, locale, isMobile);
      }
    },
    [appliedFilters, addFilter, removeFilter, t, locale, isMobile],
  );

  const handleChangeRange = useCallback(
    (event: ChangeEvent<HTMLInputElement>, name: string) => {
      const value = event.target.value;
      // add filter, if it is a number
      const stringValue = String(value);
      const isValidNumber = /^\d+$/.test(stringValue);
      if (isValidNumber || value === "") {
        addFilter(name, value, t, locale, isMobile);
      }
    },
    [addFilter, t, locale, isMobile],
  );

  const handleClickEnter = useCallback(
    (event: KeyboardEvent<HTMLInputElement>, filter: string) => {
      if (!isMobile && event.key === "Enter") {
        applyFilter(filter, t, locale);
      }
    },
    [applyFilter, t, locale, isMobile],
  );

  const handleRangedInputBlur = useCallback(
    (filter: string, inputValue: string, appliedFilterValue: string) => {
      if (!isMobile && inputValue !== appliedFilterValue) {
        applyFilter(filter, t, locale);
      }
    },
    [applyFilter, t, locale, isMobile],
  );

  const validateRange = (
    value: string | number | undefined,
    min: number = MIN_NUMBER,
    max: number = MAX_NUMBER,
  ): boolean => {
    const stringValue = String(value);
    // allow empty string
    if (stringValue.length === 0 || value === undefined) {
      return true;
    }
    // check if it's a valid number
    const isValidNumber = /^\d+$/.test(stringValue);
    if (!isValidNumber) {
      return false;
    }
    // check if it is between min and max (inclusive)
    const numValue = Number(stringValue);
    return numValue >= min && numValue <= max;
  };

  const validateMinMaxComparison = (
    minValue: string | number | undefined = MIN_NUMBER,
    maxValue: string | number | undefined = MAX_NUMBER,
  ): boolean => {
    // if value is empty/undefined, it is valid
    if (
      minValue === undefined ||
      minValue === "" ||
      maxValue === undefined ||
      maxValue === ""
    ) {
      return true;
    }
    const min = Number(minValue);
    const max = Number(maxValue);
    return min <= max;
  };

  const renderSidebarItem = (f: AdvancedFilter, i: number) => {
    const hasSearchBar: boolean = (f.options ?? []).length > 5;
    return (
      <SidebarItem
        key={`advancedFilter${i}-${f.name}`}
        aria-label={f.label}
              item={{
                children: f.label,
                hasIcon: true,
                collapsedIconTrailing: "agora-line-minus-circle",
                collapsedIconHoverTrailing: "agora-solid-minus-circle",
                expandedIconTrailing: "agora-line-plus-circle",
                expandedIconHoverTrailing: "agora-solid-plus-circle",
              }}
            >
              <div className="flex flex-col gap-8 pt-8 pb-32">
                {(() => {
                  const isRangedNumberFilter = RangedNumberFilter.includes(
                    f.name as (typeof RangedNumberFilter)[number],
                  );
                  if (isRangedNumberFilter) {
                    const minValue = filtersStore[`${f.name}Min`] ?? "";
                    const maxValue = filtersStore[`${f.name}Max`] ?? "";
                    const minValueApplied =
                      appliedFilters[`${f.name}Min`] ?? "";
                    const maxValueApplied =
                      appliedFilters[`${f.name}Max`] ?? "";

                    let hasErrorMin = !validateRange(
                      filtersStore[`${f.name}Min`] as
                        | string
                        | number
                        | undefined,
                      f.min,
                      f.max,
                    );
                    let errorMinText = "";
                    if (hasErrorMin) {
                      errorMinText = t("invalidRangeNumber", {
                        min: f.min ?? MIN_NUMBER,
                        max: f.max ?? MAX_NUMBER,
                      });
                    } else if (
                      !validateMinMaxComparison(
                        minValue as string | number | undefined,
                        maxValue as string | number | undefined,
                      )
                    ) {
                      hasErrorMin = true;
                      errorMinText = t("errorRangeNumber");
                    }

                    const hasErrorMax = !validateRange(
                      filtersStore[`${f.name}Max`] as
                        | string
                        | number
                        | undefined,
                      f.min,
                      f.max,
                    );
                    const errorMaxText = t("invalidRangeNumber", {
                      min: f.min ?? MIN_NUMBER,
                      max: f.max ?? MAX_NUMBER,
                    });

                    return (
                      <div className="flex flex-col gap-32">
                        <div className="flex flex-col xl:flex-row gap-32 pt-32">
                          <div className="w-full xl:w-1/2">
                            <InputText
                              type="number"
                              label={t("minimum")}
                              hasFeedback
                              feedbackText={
                                "min" in f && f.min
                                  ? Math.ceil(f.min).toLocaleString("fr-FR")
                                  : MIN_NUMBER.toLocaleString("fr-FR")
                              }
                              value={minValue as string | number}
                              onChange={(e) =>
                                handleChangeRange(e, `${f.name}Min`)
                              }
                              onKeyDown={(e) =>
                                handleClickEnter(e, `${f.name}Min`)
                              }
                              onBlur={() =>
                                handleRangedInputBlur(
                                  `${f.name}Min`,
                                  String(minValue),
                                  String(minValueApplied),
                                )
                              }
                              hasError={hasErrorMin}
                              errorFeedbackText={errorMinText}
                              className="text-center"
                            />
                          </div>
                          <div className="w-full xl:w-1/2 feedback-right">
                            <InputText
                              type="number"
                              label={t("maximum")}
                              hasFeedback
                              feedbackText={
                                "max" in f && f.max
                                  ? Math.ceil(f.max).toLocaleString("fr-FR")
                                  : MAX_NUMBER.toLocaleString("fr-FR")
                              }
                              value={maxValue as string | number}
                              onChange={(e) =>
                                handleChangeRange(e, `${f.name}Max`)
                              }
                              onKeyDown={(e) =>
                                handleClickEnter(e, `${f.name}Max`)
                              }
                              onBlur={() =>
                                handleRangedInputBlur(
                                  `${f.name}Max`,
                                  String(maxValue),
                                  String(maxValueApplied),
                                )
                              }
                              hasError={hasErrorMax}
                              errorFeedbackText={errorMaxText}
                              className="text-center"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <>
                      {hasSearchBar && (
                        <InputSearch
                          placeholder={`${t("pesquisar")} ${f.label}`}
                          value={searchValues[f.name] || ""}
                          onChange={(e) =>
                            handleSearchChange(f.name, e.target.value)
                          }
                        />
                      )}
                      <RadioButtonGroup
                        name={f.name}
                        className={twMerge(
                          "flex flex-col gap-0 overflow-y-auto",
                          FiltersClassNames[f.name],
                        )}
                      >
                        {filteredOptions[f.name]?.map((option) => (
                          <RadioButton
                            key={option.key}
                            label={option.label}
                            value={option.value}
                            checked={filtersStore[f.name] === option.value}
                            onClick={() =>
                              handleChange(f.name, option.value as string)
                            }
                          />
                        ))}
                      </RadioButtonGroup>
                    </>
                  );
                })()}
              </div>
      </SidebarItem>
    );
  };

  const policyObjectivesIndex = advancedFilters.findIndex(
    (f) => f.name === "policyObjectives",
  );
  const splitIndex =
    showSpecificObjective && policyObjectivesIndex !== -1
      ? policyObjectivesIndex + 1
      : advancedFilters.length;

  const filtersFirstGroup = advancedFilters.slice(0, splitIndex);
  const filtersSecondGroup = advancedFilters.slice(splitIndex);

  return (
    <div className="flex flex-col gap-16">
      <GroupTitle title={t("searchBenProj.filterSearch")} />
      <div className="flex flex-col">
        <Sidebar aria-label={t("searchBenProj.filterSearch")} variant="filter">
          {filtersFirstGroup.map((f, i) => renderSidebarItem(f, i))}
        </Sidebar>

        {showSpecificObjective && (
          <SpecificObjectiveFilter locale={locale} />
        )}

        {filtersSecondGroup.length > 0 && (
          <Sidebar variant="filter">
            {filtersSecondGroup.map((f, i) =>
              renderSidebarItem(f, splitIndex + i),
            )}
          </Sidebar>
        )}
      </div>
    </div>
  );
}
