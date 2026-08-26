"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@ama-pt/agora-design-system";
import { suggestTags } from "@/service/api/search";
import { Organization } from "@/service/types/identity";
import {
  AdvancedFilterGroup,
  AdvancedFiltersSidebar,
} from "@/components/filters/AdvancedFiltersSidebar";
import {
  ToggleFilterSection,
  ToggleFilterSections,
} from "@/components/filters/ToggleFilterSections";
import {
  formatCompactCount,
  readQueryParamValues,
  toggleSelection,
  writeQueryParamValues,
} from "@/utils/filterUtils";
import { useTranslation } from "react-i18next";

const DATE_RANGE_MAP: Record<string, () => string> = {
  "30_days": () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  },
  "12_months": () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  },
  "3_years": () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 3);
    return d.toISOString().slice(0, 10);
  },
};

function detectAtualizacaoFromParams(params: URLSearchParams): string {
  const since = params.get("modified_since");
  if (!since) return "all";

  if (since === DATE_RANGE_MAP["30_days"]()) return "30_days";
  if (since === DATE_RANGE_MAP["12_months"]()) return "12_months";
  if (since === DATE_RANGE_MAP["3_years"]()) return "3_years";
  return "all";
}

type ReuseFilterKey = "atualizacao";

interface ReusesFiltersProps {
  filterCounts?: Record<string, number>;
  allOrganizations?: Organization[];
}

export function ReusesFilters({ filterCounts = {}, allOrganizations = [] }: ReusesFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const paramsRef = useRef(queryString);
  const { t } = useTranslation("common");

  const REUSE_TOGGLE_FILTERS = useMemo(
    () => ({
      atualizacao: {
        title: t("filters.update.label"),
        options: [
          { id: "all", label: t("filters.all") },
          { id: "30_days", label: t("filters.update.options.30_days") },
          { id: "12_months", label: t("filters.update.options.12_months") },
          { id: "3_years", label: t("filters.update.options.3_years") },
        ],
      },
    }),
    [t]
  );

  const [filterTagOptions, setFilterTagOptions] = useState<{ id: string; name: string }[]>([]);
  const [filterSearchQueries, setFilterSearchQueries] = useState<Record<string, string>>({});
  const selectedToggleFilters = useMemo<Record<ReuseFilterKey, string>>(
    () => ({
      atualizacao: detectAtualizacaoFromParams(
        new URLSearchParams(Array.from(searchParams.entries()))
      ),
    }),
    [searchParams]
  );

  const getWorkingParams = useCallback(() => new URLSearchParams(paramsRef.current), []);

  const navigateWithParams = useCallback(
    (params: URLSearchParams) => {
      params.delete("page");
      params.sort();
      const search = params.toString();
      paramsRef.current = search;
      router.replace(`${pathname}${search ? `?${search}` : ""}`, { scroll: false });
    },
    [pathname, router]
  );

  useEffect(() => {
    paramsRef.current = queryString;
  }, [queryString]);

  const handleTagSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setFilterTagOptions([]);
      return;
    }
    try {
      const results = (await suggestTags(query)) ?? [];
      setFilterTagOptions(results.map((tag) => ({ id: tag.text, name: tag.text })));
    } catch {
      setFilterTagOptions([]);
    }
  }, []);

  const handleToggleFilterChange = useCallback(
    (filterKey: string, optionId: string) => {
      const typedKey = filterKey as ReuseFilterKey;

      if (typedKey === "atualizacao") {
        const current = getWorkingParams();
        current.delete("modified_since");
        if (optionId !== "all" && DATE_RANGE_MAP[optionId]) {
          current.set("modified_since", DATE_RANGE_MAP[optionId]());
        }
        navigateWithParams(current);
      }
    },
    [getWorkingParams, navigateWithParams]
  );

  const handleAdvancedFilterChange = useCallback(
    (paramName: string, value: string) => {
      const current = getWorkingParams();
      const currentValues = readQueryParamValues(current, paramName);
      const nextValues = toggleSelection(currentValues, value);
      writeQueryParamValues(current, paramName, nextValues);
      navigateWithParams(current);
    },
    [getWorkingParams, navigateWithParams]
  );

  const handleClearAdvancedFilter = useCallback(
    (paramName: string) => {
      const current = getWorkingParams();
      writeQueryParamValues(current, paramName, []);
      navigateWithParams(current);
    },
    [getWorkingParams, navigateWithParams]
  );

  const handleFilterSearchChange = useCallback(
    (paramName: string, value: string) => {
      setFilterSearchQueries((prev) => ({ ...prev, [paramName]: value }));
      if (paramName === "tag") handleTagSearch(value);
    },
    [handleTagSearch, t]
  );

  const getActiveValues = useCallback(
    (paramName: string) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      return readQueryParamValues(current, paramName);
    },
    [searchParams]
  );

  const toggleSections = useMemo<ToggleFilterSection[]>(
    () => [
      {
        key: "atualizacao",
        title: REUSE_TOGGLE_FILTERS.atualizacao.title,
        options: REUSE_TOGGLE_FILTERS.atualizacao.options.map((option) => ({
          id: option.id,
          label: option.label,
          count:
            filterCounts[`atualizacao_${option.id}`] !== undefined
              ? formatCompactCount(filterCounts[`atualizacao_${option.id}`])
              : undefined,
        })),
      },
    ],
    [filterCounts, REUSE_TOGGLE_FILTERS]
  );

  const advancedFilterGroups = useMemo<AdvancedFilterGroup[]>(
    () => [
      {
        name: t("filters.advanced.organization"),
        param: "organization",
        data: allOrganizations.map((organization) => ({ id: organization.id, name: organization.name })),
        searchable: true,
        searchPlaceholder: t("search.label"),
        emptyMessage: t("filters.advanced.search.noResults"),
      },
      {
        name: t("filters.advanced.tag"),
        param: "tag",
        data: filterTagOptions,
        searchable: true,
        suggest: true,
        searchPlaceholder: t("filters.advanced.search.placeholder"),
        minCharsMessage: t("filters.advanced.search.minCharsMessage"),
        emptyMessage: t("filters.advanced.search.noResults"),
      },
    ],
    [allOrganizations, filterTagOptions, t]
  );

  return (
    <div className="col-span-4">
      <ToggleFilterSections
        sections={toggleSections}
        selectedValues={selectedToggleFilters}
        onChange={handleToggleFilterChange}
        idPrefix="reuse-filter"
      />

      <h2 className="font-bold text-xl text-neutral-900 mt-[36px] mb-32">
        {t("filters.advanced.label")}
      </h2>

      <AdvancedFiltersSidebar
        groups={advancedFilterGroups}
        searchQueries={filterSearchQueries}
        getActiveValues={getActiveValues}
        onToggleValue={handleAdvancedFilterChange}
        onSearchChange={handleFilterSearchChange}
        onClearGroup={handleClearAdvancedFilter}
        showClearActions={true}
        checkboxIdPrefix="reuse"
      />

      <div className="mt-32">
        <Button
          variant="primary"
          appearance="outline"
          onClick={() => {
            paramsRef.current = "";
            router.replace("/reuses", { scroll: false });
          }}
        >
          {t("filters.clear")}
        </Button>
      </div>
    </div>
  );
}
