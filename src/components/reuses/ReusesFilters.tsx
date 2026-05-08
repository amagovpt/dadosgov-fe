"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@ama-pt/agora-design-system";
import { suggestTags } from "@/services/api";
import { Organization } from "@/types/api";
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

const REUSE_TOGGLE_FILTERS = {
  atualizacao: {
    title: "Data da atualização",
    options: [
      { id: "all", label: "Todos" },
      { id: "30_days", label: "Os últimos 30 dias" },
      { id: "12_months", label: "Os últimos 12 meses" },
      { id: "3_years", label: "Os últimos 3 anos" },
    ],
  },
};

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
  const diffDays = Math.round((Date.now() - new Date(since).getTime()) / 86400000);
  if (diffDays <= 31) return "30_days";
  if (diffDays <= 366) return "12_months";
  if (diffDays <= 1096) return "3_years";
  return "all";
}

type ReuseFilterKey = keyof typeof REUSE_TOGGLE_FILTERS;

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
      const results = await suggestTags(query);
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
    (groupName: string, value: string) => {
      setFilterSearchQueries((prev) => ({ ...prev, [groupName]: value }));
      if (groupName === "Palavras-chave") handleTagSearch(value);
    },
    [handleTagSearch]
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
    [filterCounts]
  );

  const advancedFilterGroups = useMemo<AdvancedFilterGroup[]>(
    () => [
      {
        name: "Organizações",
        param: "organization",
        data: allOrganizations.map((organization) => ({ id: organization.id, name: organization.name })),
        searchable: true,
        searchPlaceholder: "Pesquisar",
        emptyMessage: "Sem resultados",
      },
      {
        name: "Palavras-chave",
        param: "tag",
        data: filterTagOptions,
        searchable: true,
        suggest: true,
        searchPlaceholder: "Escreva para pesquisar...",
        minCharsMessage: "Escreva pelo menos 2 caracteres...",
        emptyMessage: "Sem resultados",
      },
    ],
    [allOrganizations, filterTagOptions]
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
        Filtros avançados
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
            router.replace("/pages/reuses", { scroll: false });
          }}
        >
          Limpar filtros
        </Button>
      </div>
    </div>
  );
}
