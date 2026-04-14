"use client";

import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Sidebar, SidebarItem, Checkbox, InputSearch, Icon, Toggle, Pill, Button } from "@ama-pt/agora-design-system";
import {
  fetchDatasets,
  fetchOrganizations,
  fetchLicenses,
  fetchFrequencies,
  fetchGranularities,
  suggestFormats,
  suggestTags,
  suggestSpatialZones,
} from "@/services/api";
import { Organization, License, Frequency, Granularity } from "@/types/api";

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
  rotulo: {
    title: "Tipo de dados",
    options: [
      { id: "all", label: "Todos", description: undefined as string | undefined },
      { id: "high_value", label: "Conjuntos de dados de Elevado Valor", description: undefined as string | undefined },
    ],
  },
};

function formatCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return k % 1 === 0 ? `${k} mil` : `${k.toFixed(1).replace(".", ",")} mil`;
  }
  return n.toLocaleString("pt-PT");
}

type ToggleFilterKey = keyof typeof DATASET_TOGGLE_FILTERS;

const FORMAT_GROUP_MAP: Record<string, string[]> = {
  tabular: ["csv", "xls", "xlsx", "ods", "parquet", "tsv"],
  structured: ["json", "rdf", "xml", "sql", "ndjson", "jsonl"],
  geographic: ["geojson", "shp", "kml", "kmz", "gpx", "wfs", "wms"],
  documents: ["pdf", "doc", "docx", "md", "txt", "odt", "rtf"],
};

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
  const tags = params.getAll("tag");
  if (tags.includes("hvd")) return "high_value";
  return "all";
}

export const DatasetsFilters = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedToggleFilters, setSelectedToggleFilters] = React.useState<Record<ToggleFilterKey, string>>(() => ({
    formato: detectFormatoFromParams(new URLSearchParams(Array.from(searchParams.entries()))),
    rotulo: detectRotuloFromParams(new URLSearchParams(Array.from(searchParams.entries()))),
  }));

  const handleToggleFilterChange = (filterKey: ToggleFilterKey, optionId: string) => {
    setSelectedToggleFilters((prev) => ({ ...prev, [filterKey]: optionId }));

    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (filterKey === "formato") {
      current.delete("format");
      if (optionId !== "all" && optionId !== "other") {
        const formats = FORMAT_GROUP_MAP[optionId];
        if (formats) {
          formats.forEach((f) => current.append("format", f));
        }
      }
    } else if (filterKey === "rotulo") {
      const tags = current.getAll("tag").filter((t) => t !== "hvd");
      current.delete("tag");
      tags.forEach((t) => current.append("tag", t));
      if (optionId === "high_value") {
        current.append("tag", "hvd");
      }
    }

    current.set("page", "1");
    const search = current.toString();
    router.replace(`${pathname}${search ? `?${search}` : ""}`, { scroll: false });
  };

  const [organizations, setOrganizations] = React.useState<Organization[]>([]);
  const [licenses, setLicenses] = React.useState<License[]>([]);
  const [frequencies, setFrequencies] = React.useState<Frequency[]>([]);
  const [granularities, setGranularities] = React.useState<Granularity[]>([]);
  const [tagOptions, setTagOptions] = React.useState<FilterOption[]>([]);
  const [formatOptions, setFormatOptions] = React.useState<FilterOption[]>([]);
  const [zoneOptions, setZoneOptions] = React.useState<FilterOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQueries, setSearchQueries] = React.useState<Record<string, string>>({});
  const [filterCounts, setFilterCounts] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    async function loadFilterData() {
      try {
        const [orgsRes, licensesRes, frequenciesRes, granularitiesRes] =
          await Promise.all([
            fetchOrganizations(1, 100, { sort: "-datasets" }),
            fetchLicenses(),
            fetchFrequencies(),
            fetchGranularities(),
          ]);
        setOrganizations(orgsRes.data);
        setLicenses(licensesRes);
        setFrequencies(frequenciesRes);
        setGranularities(granularitiesRes);
      } catch (error) {
        console.error("Failed to load filter data", error);
      } finally {
        setIsLoading(false);
      }
    }
    async function loadFilterCounts() {
      try {
        const [totalRes, tabularRes, structuredRes, geoRes, docsRes, hvdRes] =
          await Promise.all([
            fetchDatasets(1, 1),
            fetchDatasets(1, 1, { format: FORMAT_GROUP_MAP.tabular }),
            fetchDatasets(1, 1, { format: FORMAT_GROUP_MAP.structured }),
            fetchDatasets(1, 1, { format: FORMAT_GROUP_MAP.geographic }),
            fetchDatasets(1, 1, { format: FORMAT_GROUP_MAP.documents }),
            fetchDatasets(1, 1, { tag: "hvd" }),
          ]);
        setFilterCounts({
          all: totalRes.total,
          tabular: tabularRes.total,
          structured: structuredRes.total,
          geographic: geoRes.total,
          documents: docsRes.total,
          high_value: hvdRes.total,
        });
      } catch (error) {
        console.error("Failed to load filter counts", error);
      }
    }
    loadFilterData();
    loadFilterCounts();
  }, []);

  const handleTagSearch = React.useCallback(async (query: string) => {
    if (query.length < 2) {
      setTagOptions([]);
      return;
    }
    try {
      const results = await suggestTags(query);
      setTagOptions(results.map((t) => ({ id: t.text, name: t.text })));
    } catch {
      setTagOptions([]);
    }
  }, []);

  const handleFormatSearch = React.useCallback(async (query: string) => {
    if (query.length < 2) {
      setFormatOptions([]);
      return;
    }
    try {
      const results = await suggestFormats(query);
      setFormatOptions(results.map((f) => ({ id: f.text, name: f.text })));
    } catch {
      setFormatOptions([]);
    }
  }, []);

  const handleZoneSearch = React.useCallback(async (query: string) => {
    if (query.length < 2) {
      setZoneOptions([]);
      return;
    }
    try {
      const results = await suggestSpatialZones(query);
      setZoneOptions(results.map((z) => ({ id: z.id, name: z.name })));
    } catch {
      setZoneOptions([]);
    }
  }, []);

  const handleFilterChange = (paramName: string, value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    const currentValues = current.getAll(paramName);

    if (currentValues.includes(value)) {
      current.delete(paramName);
      currentValues.filter((v) => v !== value).forEach((v) => current.append(paramName, v));
    } else {
      current.append(paramName, value);
    }

    current.set("page", "1");
    const search = current.toString();
    router.replace(`${pathname}${search ? `?${search}` : ""}`, { scroll: false });
  };

  const handleClearFilter = (paramName: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.delete(paramName);
    current.set("page", "1");
    const search = current.toString();
    router.replace(`${pathname}${search ? `?${search}` : ""}`, { scroll: false });
  };

  const handleSearchChange = (groupName: string, value: string) => {
    setSearchQueries((prev) => ({ ...prev, [groupName]: value }));

    if (groupName === "Etiquetas") handleTagSearch(value);
    if (groupName === "Formatos") handleFormatSearch(value);
    if (groupName === "Cobertura Espacial") handleZoneSearch(value);
  };

  const getActiveValues = (paramName: string) => searchParams.getAll(paramName);

  const filterGroups: {
    name: string;
    param: string;
    data: FilterOption[];
    searchable: boolean;
    suggest?: boolean;
  }[] = [
    {
      name: "Organizações",
      param: "organization",
      data: organizations.map((o) => ({ id: o.id, name: o.name })),
      searchable: true,
    },
    {
      name: "Palavras-chave",
      param: "tag",
      data: tagOptions,
      searchable: true,
      suggest: true,
    },
    {
      name: "Formatos",
      param: "format",
      data: formatOptions,
      searchable: true,
      suggest: true,
    },
    {
      name: "Licenças",
      param: "license",
      data: licenses.map((l) => ({ id: l.id, name: l.title })),
      searchable: true,
    },
    {
      name: "Frequência",
      param: "frequency",
      data: frequencies.map((f) => ({ id: f.id, name: f.label })),
      searchable: true,
    },
    {
      name: "Cobertura Espacial",
      param: "geozone",
      data: zoneOptions,
      searchable: true,
      suggest: true,
    },
    {
      name: "Granularidade Espacial",
      param: "granularity",
      data: granularities.map((g) => ({ id: g.id, name: g.name })),
      searchable: true,
    },
  ];

  return (
    <div className="h-full">
      <div className="flex flex-col gap-32 mt-[36px] mb-[36px]">
        <h2 className="font-bold text-xl text-neutral-900">Filtros</h2>
        {(Object.keys(DATASET_TOGGLE_FILTERS) as ToggleFilterKey[]).map((filterKey) => {
          const section = DATASET_TOGGLE_FILTERS[filterKey];
          return (
            <div key={filterKey} className="pr-32 max-w-[592px] flex flex-col gap-8">
              <h3 className="font-bold text-base text-neutral-900 mb-8">
                {section.title}
              </h3>
              {section.options.map((option) => {
                const isSelected = selectedToggleFilters[filterKey] === option.id;
                return (
                  <Toggle
                    key={option.id}
                    id={`ds-filter-${filterKey}-${option.id}`}
                    name={`ds-filter-${filterKey}`}
                    value={option.id}
                    appearance="icon"
                    variant="primary"
                    checked={isSelected}
                    onChange={() => handleToggleFilterChange(filterKey, option.id)}
                    iconOnly={false}
                    fullWidth={true}
                    className="w-full"
                  >
                    <div className="flex items-center gap-12 font-bold text-sm">
                      <span
                        className={
                          isSelected
                            ? "text-primary-600 font-bold"
                            : "text-neutral-900 font-bold"
                        }
                      >
                        {option.label}
                      </span>
                      {"description" in option && option.description && (
                        <span className="text-neutral-900 text-xs font-normal ml-8">
                          {option.description}
                        </span>
                      )}
                      {filterCounts[option.id] !== undefined && (
                        <Pill
                          variant="neutral"
                          appearance="outline"
                          circular={false}
                          className="text-xs font-medium text-neutral-500 ml-16"
                        >
                          {formatCount(filterCounts[option.id])}
                        </Pill>
                      )}
                    </div>
                  </Toggle>
                );
              })}
            </div>
          );
        })}
      </div>

      <h2 className="font-bold text-xl text-neutral-900 mt-[36px] mb-[32px]">Filtros avançados</h2>

      <Sidebar variant="filter" className="font-bold">
        {filterGroups.map((group, index) => {
          const searchQuery = searchQueries[group.name] || "";
          const activeValues = getActiveValues(group.param);
          const activeCount = activeValues.length;

          // For suggest filters, merge selected values (from URL) with search results
          const selectedItems: FilterOption[] = group.suggest
            ? activeValues
                .filter((v) => !group.data.some((d) => d.id === v))
                .map((v) => ({ id: v, name: v }))
            : [];

          const allData = [...selectedItems, ...group.data];

          const filteredData = group.suggest
            ? allData
            : allData.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

          const showSearch = group.searchable;
          const showScroll = filteredData.length > 5;

          return (
            <SidebarItem
              key={index}
              variant="filter"
              item={{
                children: <span className="font-bold">{group.name}</span>,
                hasIcon: true,
                collapsedIconTrailing: "agora-line-minus-circle",
                collapsedIconHoverTrailing: "agora-solid-minus-circle",
                expandedIconTrailing: "agora-line-plus-circle",
                expandedIconHoverTrailing: "agora-solid-plus-circle",
              }}
              hasPill={activeCount > 0}
              pillValue={activeCount}
            >
              <div>
{/* Limpar individual removido — usar "Limpar filtros" global */}
                {showSearch && (
                  <div className="mb-4 mt-8 relative">
                    <InputSearch
                      label="Pesquisar"
                      hideLabel
                      placeholder={group.suggest ? "Escreva para pesquisar..." : "Pesquisar"}
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(group.name, e.target.value)}
                    />
                    <Icon
                      name="agora-solid-search"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-primary-500 w-5 h-5 pointer-events-none"
                      aria-hidden="true"
                    />
                  </div>
                )}
                <div
                  className={`flex flex-col gap-2 ${showScroll ? "max-h-[225px] overflow-y-auto" : ""}`}
                >
                  {isLoading && !group.suggest && filteredData.length === 0 ? null : filteredData.length > 0 ? (
                    filteredData.map((item) => (
                      <Checkbox
                        key={item.id}
                        label={item.name}
                        className="font-bold"
                        value={item.id}
                        name={group.param}
                        checked={activeValues.includes(item.id)}
                        onChange={() => handleFilterChange(group.param, item.id)}
                      />
                    ))
                  ) : group.suggest && searchQuery.length < 2 ? (
                    activeCount > 0 ? null : (
                      <p className="text-sm text-neutral-900">Escreva pelo menos 2 caracteres...</p>
                    )
                  ) : (
                    <p className="text-sm text-neutral-900">Nenhum resultado encontrado.</p>
                  )}
                </div>
              </div>
            </SidebarItem>
          );
        })}
      </Sidebar>

      <div className="mt-32">
        <Button
          variant="primary"
          appearance="outline"
          onClick={() => {
            setSelectedToggleFilters({
              formato: "all",
              rotulo: "all",
            });
            router.replace("/pages/datasets", { scroll: false });
          }}
        >
          Limpar filtros
        </Button>
      </div>
    </div>
  );
};
