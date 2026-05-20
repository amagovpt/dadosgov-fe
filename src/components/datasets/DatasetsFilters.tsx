"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@ama-pt/agora-design-system";
import {
  suggestFormats,
} from "@/api/datasets/route";
import { suggestSpatialZones, suggestTags } from "@/api/search/route";
import { Frequency, Granularity, License, Organization } from "@/types/api";
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
  uniqueStrings,
  writeQueryParamValues,
} from "@/utils/filterUtils";

interface FilterOption {
  id: string;
  name: string;
}

const DATASET_TOGGLE_FILTERS = {
  formato: {
    title: "Formato dos recursos",
    options: [
      { id: "all", label: "Todos", description: undefined as string | undefined },
      { id: "tabular", label: "Tabular", description: "csv, xls, xlsx, ods, parquet..." },
      { id: "structured", label: "Estruturado", description: "JSON, RDF, XML, SQL..." },
      { id: "geographic", label: "Geográfico", description: "geojson, shp, kml..." },
      { id: "documents", label: "Documentos", description: "pdf, doc, docx, md, txt, ..." },
      { id: "other", label: "Outro", description: undefined as string | undefined },
    ],
  },
  atualizacao: {
    title: "Data da atualização",
    options: [
      { id: "all", label: "Todos", description: undefined as string | undefined },
      { id: "30_days", label: "Os últimos 30 dias", description: undefined as string | undefined },
      { id: "12_months", label: "Os últimos 12 meses", description: undefined as string | undefined },
      { id: "3_years", label: "Os últimos 3 anos", description: undefined as string | undefined },
    ],
  },
  rotulo: {
    title: "Tipo de dados",
    options: [
      { id: "all", label: "Todos", description: undefined as string | undefined },
      { id: "high_value", label: "Conjuntos de dados de Elevado Valor", description: undefined as string | undefined },
    ],
  },
};

type ToggleFilterKey = keyof typeof DATASET_TOGGLE_FILTERS;

const FORMAT_GROUP_MAP: Record<string, string[]> = {
  tabular: ["csv", "xls", "xlsx", "ods", "parquet", "tsv"],
  structured: ["json", "rdf", "xml", "sql", "ndjson", "jsonl"],
  geographic: ["geojson", "shp", "kml", "kmz", "gpx", "wfs", "wms"],
  documents: ["pdf", "doc", "docx", "md", "txt", "odt", "rtf"],
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
  if (since === DATE_RANGE_MAP["30_days"]()) return "30_days";
  if (since === DATE_RANGE_MAP["12_months"]()) return "12_months";
  if (since === DATE_RANGE_MAP["3_years"]()) return "3_years";
  return "all";
}

function detectFormatoFromParams(params: URLSearchParams): string {
  const formats = params.getAll("format");
  if (formats.length === 0) return "all";
  for (const [groupId, groupFormats] of Object.entries(FORMAT_GROUP_MAP)) {
    if (formats.length > 0 && formats.every((f) => groupFormats.includes(f.toLowerCase()))) {
      return groupId;
    }
  }
  return "other";
}

function detectRotuloFromParams(params: URLSearchParams): string {
  const tags = readQueryParamValues(params, "tag", { splitComma: true });
  if (tags.includes("hvd")) return "high_value";
  return "all";
}

interface DatasetsFiltersProps {
  filterCounts?: Record<string, number>;
  allOrganizations?: Organization[];
  allLicenses?: License[];
  allFrequencies?: Frequency[];
  allGranularities?: Granularity[];
}

export const DatasetsFilters = ({
  filterCounts: serverCounts,
  allOrganizations = [],
  allLicenses = [],
  allFrequencies = [],
  allGranularities = [],
}: DatasetsFiltersProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const paramsRef = useRef(queryString);
  const filterCounts = useMemo(() => serverCounts ?? {}, [serverCounts]);

  const [tagOptions, setTagOptions] = useState<FilterOption[]>([]);
  const [formatOptions, setFormatOptions] = useState<FilterOption[]>([]);
  const [zoneOptions, setZoneOptions] = useState<FilterOption[]>([]);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const selectedToggleFilters = useMemo<Record<ToggleFilterKey, string>>(
    () => ({
      formato: detectFormatoFromParams(new URLSearchParams(Array.from(searchParams.entries()))),
      atualizacao: detectAtualizacaoFromParams(
        new URLSearchParams(Array.from(searchParams.entries()))
      ),
      rotulo: detectRotuloFromParams(new URLSearchParams(Array.from(searchParams.entries()))),
    }),
    [searchParams]
  );

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

  useEffect(() => {
    paramsRef.current = queryString;
  }, [queryString]);

  const handleToggleFilterChange = useCallback(
    (filterKey: ToggleFilterKey, optionId: string) => {
      const current = getWorkingParams();

      if (filterKey === "formato") {
        current.delete("format");
        if (optionId !== "all" && optionId !== "other") {
          const formats = FORMAT_GROUP_MAP[optionId];
          if (formats) formats.forEach((format) => current.append("format", format));
        }
      } else if (filterKey === "atualizacao") {
        current.delete("modified_since");
        if (optionId !== "all" && DATE_RANGE_MAP[optionId]) {
          current.set("modified_since", DATE_RANGE_MAP[optionId]());
        }
      } else if (filterKey === "rotulo") {
        const tags = readQueryParamValues(current, "tag", { splitComma: true }).filter(
          (tag) => tag !== "hvd"
        );
        if (optionId === "high_value") {
          tags.push("hvd");
        }
        writeQueryParamValues(current, "tag", uniqueStrings(tags));
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

  const handleFormatSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setFormatOptions([]);
      return;
    }
    try {
      const results = await suggestFormats(query);
      setFormatOptions(results.map((format) => ({ id: format.text, name: format.text })));
    } catch {
      setFormatOptions([]);
    }
  }, []);

  const handleZoneSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setZoneOptions([]);
      return;
    }
    try {
      const results = await suggestSpatialZones(query);
      setZoneOptions(results.map((zone) => ({ id: zone.id, name: zone.name })));
    } catch {
      setZoneOptions([]);
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
      if (groupName === "Formatos") handleFormatSearch(value);
      if (groupName === "Cobertura Espacial") handleZoneSearch(value);
    },
    [handleFormatSearch, handleTagSearch, handleZoneSearch]
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
      (Object.keys(DATASET_TOGGLE_FILTERS) as ToggleFilterKey[]).map((filterKey) => ({
        key: filterKey,
        title: DATASET_TOGGLE_FILTERS[filterKey].title,
        options: DATASET_TOGGLE_FILTERS[filterKey].options.map((option) => ({
          id: option.id,
          label: option.label,
          description: option.description,
          count:
            filterCounts[`${filterKey}_${option.id}`] !== undefined
              ? formatCompactCount(filterCounts[`${filterKey}_${option.id}`])
              : undefined,
        })),
      })),
    [filterCounts]
  );

  const advancedFilterGroups = useMemo<AdvancedFilterGroup[]>(
    () => [
      {
        name: "Organizações",
        param: "organization",
        data: allOrganizations.map((organization) => ({ id: organization.id, name: organization.name })),
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
      {
        name: "Formatos",
        param: "format",
        data: formatOptions,
        searchable: true,
        suggest: true,
        searchPlaceholder: "Escreva para pesquisar...",
        minCharsMessage: "Escreva pelo menos 2 caracteres...",
        emptyMessage: "Nenhum resultado encontrado.",
      },
      {
        name: "Licenças",
        param: "license",
        data: allLicenses.map((license) => ({ id: license.id, name: license.title })),
        searchable: true,
      },
      {
        name: "Frequência",
        param: "frequency",
        data: allFrequencies.map((frequency) => ({ id: frequency.id, name: frequency.label })),
        searchable: true,
      },
      {
        name: "Cobertura Espacial",
        param: "geozone",
        data: zoneOptions,
        searchable: true,
        suggest: true,
        searchPlaceholder: "Escreva para pesquisar...",
        minCharsMessage: "Escreva pelo menos 2 caracteres...",
        emptyMessage: "Nenhum resultado encontrado.",
      },
      {
        name: "Granularidade Espacial",
        param: "granularity",
        data: allGranularities.map((granularity) => ({ id: granularity.id, name: granularity.name })),
        searchable: true,
      },
    ],
    [
      allOrganizations,
      tagOptions,
      formatOptions,
      allLicenses,
      allFrequencies,
      zoneOptions,
      allGranularities,
    ]
  );

  return (
    <div className="h-full">
      <ToggleFilterSections
        sections={toggleSections}
        selectedValues={selectedToggleFilters}
        onChange={(sectionKey, optionId) =>
          handleToggleFilterChange(sectionKey as ToggleFilterKey, optionId)
        }
        idPrefix="ds-filter"
      />

      <h2 className="font-bold text-xl text-neutral-900 mt-[36px] mb-32">Filtros avançados</h2>

      <AdvancedFiltersSidebar
        groups={advancedFilterGroups}
        searchQueries={searchQueries}
        getActiveValues={getActiveValues}
        onToggleValue={handleFilterChange}
        onSearchChange={handleSearchChange}
        checkboxIdPrefix="dataset"
      />

      <div className="mt-32">
        <Button
          variant="primary"
          appearance="outline"
          onClick={() => {
            paramsRef.current = "";
            router.replace("/pages/datasets", { scroll: false });
          }}
        >
          Limpar filtros
        </Button>
      </div>
    </div>
  );
};
