"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@ama-pt/agora-design-system";
import { fetchOrganizations } from "@/service/api/organizations";
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
  readQueryParamValues,
  toggleSelection,
  uniqueStrings,
  writeQueryParamValues,
} from "@/utils/filterUtils";

interface FilterOption {
  id: string;
  name: string;
}

const DATASERVICE_TOGGLE_FILTERS = {
  metodo: {
    title: "Métodos de acesso",
    param: "access_type",
    options: [
      { id: "all", label: "Todos" },
      { id: "free_download", label: "Download gratuito" },
      { id: "open_conditions", label: "Aberto sob certas condições" },
      { id: "auth_access", label: "Acesso mediante autorização" },
    ],
  },
  atualizacao: {
    title: "Data da atualização",
    param: "modified_since",
    options: [
      { id: "all", label: "Todos" },
      { id: "30_days", label: "Os últimos 30 dias" },
      { id: "12_months", label: "Os últimos 12 meses" },
      { id: "3_years", label: "Os últimos 3 anos" },
    ],
  },
  organizacao: {
    title: "Tipo de organização",
    param: "producer_type",
    options: [
      { id: "all", label: "Todos" },
      { id: "public_service", label: "Serviço público" },
      { id: "local_authority", label: "Autoridade local" },
      { id: "business", label: "Negócios" },
      { id: "association", label: "Associação" },
      { id: "user", label: "Utilizador" },
    ],
  },
};

type ToggleFilterKey = keyof typeof DATASERVICE_TOGGLE_FILTERS;

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

export const DataservicesFilters = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const paramsRef = useRef(queryString);

  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [tagOptions, setTagOptions] = useState<FilterOption[]>([]);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

  useEffect(() => {
    paramsRef.current = queryString;
  }, [queryString]);

  useEffect(() => {
    let active = true;
    fetchOrganizations(1, 100, { sort: "-datasets" })
      .then((res) => {
        if (active) setAllOrganizations(res.data);
      })
      .catch(() => {
        if (active) setAllOrganizations([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedToggleFilters = useMemo<Record<ToggleFilterKey, string>>(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    return {
      metodo: params.get("access_type") || "all",
      atualizacao: detectAtualizacaoFromParams(params),
      organizacao: params.get("producer_type") || "all",
    };
  }, [searchParams]);

  const getWorkingParams = useCallback(() => new URLSearchParams(paramsRef.current), []);

  const navigateWithParams = useCallback(
    (params: URLSearchParams) => {
      params.set("page", "1");
      const search = params.toString();
      paramsRef.current = search;
      router.replace(`${pathname}${search ? `?${search}` : ""}`, { scroll: false });
    },
    [pathname, router]
  );

  const handleToggleFilterChange = useCallback(
    (filterKey: ToggleFilterKey, optionId: string) => {
      const current = getWorkingParams();
      const section = DATASERVICE_TOGGLE_FILTERS[filterKey];

      if (filterKey === "atualizacao") {
        current.delete("modified_since");
        if (optionId !== "all" && DATE_RANGE_MAP[optionId]) {
          current.set("modified_since", DATE_RANGE_MAP[optionId]());
        }
      } else {
        current.delete(section.param);
        if (optionId !== "all") {
          current.set(section.param, optionId);
        }
      }

      navigateWithParams(current);
    },
    [getWorkingParams, navigateWithParams]
  );

  const handleTagSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setTagOptions([]);
      return;
    }
    try {
      const results = await suggestTags(query);
      setTagOptions(results.map((tag) => ({ id: tag.text, name: tag.text })));
    } catch {
      setTagOptions([]);
    }
  }, []);

  const handleFilterChange = useCallback(
    (paramName: string, value: string) => {
      const current = getWorkingParams();
      const currentValues = readQueryParamValues(current, paramName, {
        splitComma: paramName === "tag",
      });
      const nextValues = uniqueStrings(toggleSelection(currentValues, value));
      writeQueryParamValues(current, paramName, nextValues);
      navigateWithParams(current);
    },
    [getWorkingParams, navigateWithParams]
  );

  const handleSearchChange = useCallback(
    (groupName: string, value: string) => {
      setSearchQueries((prev) => ({ ...prev, [groupName]: value }));
      if (groupName === "Palavras-chave") handleTagSearch(value);
    },
    [handleTagSearch]
  );

  const getActiveValues = useCallback(
    (paramName: string) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      return readQueryParamValues(current, paramName, { splitComma: paramName === "tag" });
    },
    [searchParams]
  );

  const toggleSections = useMemo<ToggleFilterSection[]>(
    () =>
      (Object.keys(DATASERVICE_TOGGLE_FILTERS) as ToggleFilterKey[]).map((filterKey) => ({
        key: filterKey,
        title: DATASERVICE_TOGGLE_FILTERS[filterKey].title,
        options: DATASERVICE_TOGGLE_FILTERS[filterKey].options.map((option) => ({
          id: option.id,
          label: option.label,
        })),
      })),
    []
  );

  const advancedFilterGroups = useMemo<AdvancedFilterGroup[]>(
    () => [
      {
        name: "Organizações",
        param: "organization",
        data: allOrganizations.map((organization) => ({
          id: organization.id,
          name: organization.name,
        })),
        searchable: true,
      },
      {
        name: "Palavras-chave",
        param: "tag",
        data: tagOptions,
        searchable: true,
        suggest: true,
        searchPlaceholder: "Escreva para pesquisar...",
        minCharsMessage: "Escreva pelo menos 2 caracteres...",
        emptyMessage: "Nenhum resultado encontrado.",
      },
    ],
    [allOrganizations, tagOptions]
  );

  return (
    <div className="h-full">
      <ToggleFilterSections
        sections={toggleSections}
        selectedValues={selectedToggleFilters}
        onChange={(sectionKey, optionId) =>
          handleToggleFilterChange(sectionKey as ToggleFilterKey, optionId)
        }
        idPrefix="dsvc-filter"
      />

      <h2 className="font-bold text-xl text-neutral-900 mt-[36px] mb-32">Filtros avançados</h2>

      <AdvancedFiltersSidebar
        groups={advancedFilterGroups}
        searchQueries={searchQueries}
        getActiveValues={getActiveValues}
        onToggleValue={handleFilterChange}
        onSearchChange={handleSearchChange}
        checkboxIdPrefix="dataservice"
      />

      <div className="mt-32">
        <Button
          variant="primary"
          appearance="outline"
          onClick={() => {
            paramsRef.current = "";
            router.replace("/pages/dataservices", { scroll: false });
          }}
        >
          Limpar filtros
        </Button>
      </div>
    </div>
  );
};
