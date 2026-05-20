"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Icon,
  Toggle,
  Pill,
  InputSearchBar,
  CardNoResults,
  Sidebar,
  SidebarItem,
  Checkbox,
  InputSearch,
} from "@ama-pt/agora-design-system";

import HeroGeneral from "@/components/HeroGeneral";
import { Pagination } from "@/components/Pagination";
import {
  fetchLicenses,
  fetchGranularities,
  suggestFormats,
} from "@/api/datasets";
import { fetchOrganizations } from "@/api/organizations";
import {
  searchDatasets,
  searchOrganizations,
  searchReuses,
  searchDataservices,
  suggestTags,
  suggestSpatialZones,
} from "@/api/search";
import {
  Dataset,
  Organization,
  Reuse,
  Dataservice,
  License,
  Granularity,
} from "@/types/api";

type SearchType = "datasets" | "dataservices" | "reuses" | "organizations";

const TYPES: {
  type: SearchType;
  label: string;
  icon: string | ((active: boolean) => string);
  iconHover: string;
}[] = [
  {
    type: "datasets",
    label: "Conjunto de dados",
    icon: "agora-line-layers-menu",
    iconHover: "agora-solid-layers-menu",
  },
  // {
  //   type: "dataservices",
  //   label: "APIs",
  //   icon: (active: boolean) =>
  //     active ? "/Icons/reduce_white.svg" : "/Icons/reduce.svg",
  //   iconHover: "/Icons/reduce_white.svg",
  // },
  {
    type: "reuses",
    label: "Reutilizações",
    icon: (active: boolean) =>
      active ? "/Icons/bar_char_white.svg" : "/Icons/bar_chart.svg",
    iconHover: "/Icons/bar_char_white.svg",
  },
  {
    type: "organizations",
    label: "Organizações",
    icon: "agora-line-buildings",
    iconHover: "agora-solid-buildings",
  },
];

const DATASET_FILTERS = {
  formato: {
    title: "Formato dos dados",
    options: [
      { id: "all", label: "Todos", count: "45 mil" },
      { id: "tabular", label: "Tabular", description: "csv, xls, xlsx, ods, parquet...", count: "14 mil" },
      { id: "structured", label: "Estruturado", description: "JSON, RDF, XML, SQL...", count: "9,3 mil" },
      { id: "geographic", label: "Geográfico", description: "geojson, shp, kml...", count: "4,6 mil" },
      { id: "documents", label: "Documentos", description: "pdf, doc, docx, md, txt, ...", count: "2,8 mil" },
      { id: "other", label: "Outro", count: "29 mil" },
    ],
  },
  metodo: {
    title: "Métodos de acesso",
    options: [
      { id: "all", label: "Todos", count: "45 mil" },
      { id: "free_download", label: "Download gratuito", count: "42 mil" },
      { id: "open_conditions", label: "Aberto sob certas condições", count: "0" },
      { id: "auth_access", label: "Acesso mediante autorização", count: "11" },
    ],
  },
  atualizacao: {
    title: "Data da atualização",
    options: [
      { id: "all", label: "Todos", count: "45 mil" },
      { id: "30_days", label: "Os últimos 30 dias", count: "6 mil" },
      { id: "12_months", label: "Os últimos 12 meses", count: "15 mil" },
      { id: "3_years", label: "Os últimos 3 anos", count: "26 mil" },
    ],
  },
  organizacao: {
    title: "Tipo de organização",
    options: [
      { id: "all", label: "Todos", count: "45 mil" },
      { id: "public_service", label: "Serviço público", count: "27 mil" },
      { id: "local_authority", label: "Autoridade local", count: "11 mil" },
      { id: "business", label: "Negócios", count: "1,6 mil" },
      { id: "association", label: "Associação", count: "434" },
      { id: "user", label: "Utilizador", count: "737" },
    ],
  },
  rotulo: {
    title: "Rótulo de dados",
    options: [
      { id: "all", label: "Todos", count: "45 mil" },
      { id: "high_value", label: "Conjuntos de dados de alto valor", count: "591" },
      { id: "inspire", label: "Inspirar", count: "16 mil" },
      { id: "public_reference", label: "Serviço público de dados de referência", count: "9" },
      { id: "statistics", label: "Séries estatísticas de interesse geral", count: "11" },
    ],
  },
};

type FilterKey = keyof typeof DATASET_FILTERS;

const PAGE_SIZE = 10;

export default function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const tabParam = searchParams.get("type") as SearchType | null;
  const pageParam = Number(searchParams.get("page")) || 1;

  const [activeTab, setActiveTab] = useState<SearchType>(
    tabParam || "datasets"
  );
  const [searchInput, setSearchInput] = useState(query);

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [reuses, setReuses] = useState<Reuse[]>([]);
  const [dataservices, setDataservices] = useState<Dataservice[]>([]);

  const [totals, setTotals] = useState({
    datasets: 0,
    dataservices: 0,
    organizations: 0,
    reuses: 0,
  });

  const [selectedFilters, setSelectedFilters] = useState<Record<FilterKey, string>>({
    formato: "all",
    metodo: "all",
    atualizacao: "all",
    organizacao: "all",
    rotulo: "all",
  });

  const handleFilterChange = (filterKey: FilterKey, optionId: string) => {
    setSelectedFilters((prev) => ({ ...prev, [filterKey]: optionId }));
  };

  // Advanced filters state
  const [filterOrgs, setFilterOrgs] = useState<Organization[]>([]);
  const [filterLicenses, setFilterLicenses] = useState<License[]>([]);
  const [filterGranularities, setFilterGranularities] = useState<Granularity[]>([]);
  const [filterTagOptions, setFilterTagOptions] = useState<{ id: string; name: string }[]>([]);
  const [filterFormatOptions, setFilterFormatOptions] = useState<{ id: string; name: string }[]>([]);
  const [filterZoneOptions, setFilterZoneOptions] = useState<{ id: string; name: string }[]>([]);
  const [filterSearchQueries, setFilterSearchQueries] = useState<Record<string, string>>({});
  const [isFiltersLoading, setIsFiltersLoading] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(pageParam);

  const activeTabValue = tabParam && TYPES.some((t) => t.type === tabParam) ? tabParam : activeTab;
  if (activeTabValue !== activeTab) setActiveTab(activeTabValue);
  if (pageParam !== currentPage) setCurrentPage(pageParam);
  if (query !== searchInput) setSearchInput(query);

  useEffect(() => {
    if (!query) return;
    async function fetchTotals() {
      const [dsRes, orgRes, reuseRes, dsvcRes] = await Promise.all([
        searchDatasets(query, 1, 1),
        searchOrganizations(query, 1, 1),
        searchReuses(query, 1, 1),
        searchDataservices(query, 1, 1),
      ]);
      setTotals({
        datasets: dsRes.total,
        dataservices: dsvcRes.total,
        organizations: orgRes.total,
        reuses: reuseRes.total,
      });
    }
    fetchTotals();
  }, [query]);

  useEffect(() => {
    if (!query) return;
    async function fetchResults() {
      setIsLoading(true);
      try {
        if (activeTab === "datasets") {
          const res = await searchDatasets(query, currentPage, PAGE_SIZE);
          setDatasets(res.data || []);
        } else if (activeTab === "dataservices") {
          const res = await searchDataservices(query, currentPage, PAGE_SIZE);
          setDataservices(res.data || []);
        } else if (activeTab === "organizations") {
          const res = await searchOrganizations(query, currentPage, PAGE_SIZE);
          setOrganizations(res.data || []);
        } else if (activeTab === "reuses") {
          const res = await searchReuses(query, currentPage, PAGE_SIZE);
          setReuses(res.data || []);
        }
      } catch (error) {
        console.error("Error searching:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchResults();
  }, [query, activeTab, currentPage]);

  // Load advanced filter data
  useEffect(() => {
    async function loadFilterData() {
      try {
        const [orgsRes, licensesRes, granularitiesRes] = await Promise.all([
          fetchOrganizations(1, 100, { sort: "-datasets" }),
          fetchLicenses(),
          fetchGranularities(),
        ]);
        setFilterOrgs(orgsRes.data);
        setFilterLicenses(licensesRes);
        setFilterGranularities(granularitiesRes);
      } catch (error) {
        console.error("Failed to load filter data", error);
      } finally {
        setIsFiltersLoading(false);
      }
    }
    loadFilterData();
  }, []);

  const handleTagSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setFilterTagOptions([]); return; }
    try {
      const results = await suggestTags(q);
      setFilterTagOptions(results.map((t) => ({ id: t.text, name: t.text })));
    } catch { setFilterTagOptions([]); }
  }, []);

  const handleFormatSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setFilterFormatOptions([]); return; }
    try {
      const results = await suggestFormats(q);
      setFilterFormatOptions(results.map((f) => ({ id: f.text, name: f.text })));
    } catch { setFilterFormatOptions([]); }
  }, []);

  const handleZoneSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setFilterZoneOptions([]); return; }
    try {
      const results = await suggestSpatialZones(q);
      setFilterZoneOptions(results.map((z) => ({ id: z.id, name: z.name })));
    } catch { setFilterZoneOptions([]); }
  }, []);

  const handleAdvancedFilterChange = (paramName: string, value: string) => {
    const current = new URLSearchParams(searchParams.toString());
    const currentValues = current.getAll(paramName);
    if (currentValues.includes(value)) {
      current.delete(paramName);
      currentValues.filter((v) => v !== value).forEach((v) => current.append(paramName, v));
    } else {
      current.append(paramName, value);
    }
    current.set("page", "1");
    router.push(`/pages/search?${current.toString()}`);
  };

  const handleClearAdvancedFilter = (paramName: string) => {
    const current = new URLSearchParams(searchParams.toString());
    current.delete(paramName);
    current.set("page", "1");
    router.push(`/pages/search?${current.toString()}`);
  };

  const handleFilterSearchChange = (groupName: string, value: string) => {
    setFilterSearchQueries((prev) => ({ ...prev, [groupName]: value }));
    if (groupName === "Palavras-chave") handleTagSearch(value);
    if (groupName === "Formatos") handleFormatSearch(value);
    if (groupName === "Cobertura espacial") handleZoneSearch(value);
  };

  const advancedFilterGroups: {
    name: string;
    param: string;
    data: { id: string; name: string }[];
    searchable: boolean;
    suggest?: boolean;
  }[] = [
    {
      name: "Organizações",
      param: "organization",
      data: filterOrgs.map((o) => ({ id: o.id, name: o.name })),
      searchable: true,
    },
    {
      name: "Palavras-chave",
      param: "tag",
      data: filterTagOptions,
      searchable: true,
      suggest: true,
    },
    {
      name: "Formatos",
      param: "format",
      data: filterFormatOptions,
      searchable: true,
      suggest: true,
    },
    {
      name: "Licenças",
      param: "license",
      data: filterLicenses.map((l) => ({ id: l.id, name: l.title })),
      searchable: true,
    },
    {
      name: "Cobertura espacial",
      param: "geozone",
      data: filterZoneOptions,
      searchable: true,
      suggest: true,
    },
    {
      name: "Granularidade espacial",
      param: "granularity",
      data: filterGranularities.map((g) => ({ id: g.id, name: g.name })),
      searchable: true,
    },
  ];

  const buildUrl = useCallback(
    (params: { type?: string; page?: number; q?: string }) => {
      const t = params.type || activeTab;
      const p = params.page || 1;
      const q = params.q ?? query;
      return `/pages/search?q=${encodeURIComponent(q)}&type=${t}&page=${p}`;
    },
    [query, activeTab]
  );

  const handleTabChange = (tab: SearchType) => {
    setActiveTab(tab);
    setCurrentPage(1);
    router.push(buildUrl({ type: tab, page: 1 }));
  };

  const handleSearch = () => {
    if (searchInput.trim()) {
      router.push(buildUrl({ q: searchInput.trim(), page: 1 }));
    }
  };

  const totalForActiveTab = totals[activeTab];

  const titleMap: Record<SearchType, string> = {
    datasets: "Conjuntos de dados",
    dataservices: "APIs",
    reuses: "Reutilizações",
    organizations: "Organizações",
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-neutral-900 bg-neutral-50 filters">
      <main className="flex-grow bg-primary-50">
        <HeroGeneral
          title={titleMap[activeTab]}
          backgroundImageUrl="/Banner/hero-bg.png"
          breadcrumbItems={[
            { label: "Home", url: "/" },
            { label: "Pesquisa", url: "/pages/search" },
          ]}
        >
          <InputSearchBar
            label="Pesquisa avançada"
            placeholder="Pesquisar conjunto de dados, organizações, reutilizações..."
            id="search-page-input"
            hasVoiceActionButton={false}
            voiceActionAltText="Pesquisar por voz"
            searchActionAltText="Pesquisar"
            darkMode={true}
            value={searchInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchInput(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter") handleSearch();
            }}
            onSearchActivate={() => handleSearch()}
          />
        </HeroGeneral>

        <div className="container mx-auto md:gap-32 xl:gap-64 bg-white">
          <div className="grid md:grid-cols-3 xl:grid-cols-12 grid-filters">
            {/* Sidebar */}
            <div className="xl:col-span-4 xl:block p-32 pl-0">
              <div className="mb-64 pr-32 max-w-[592px] flex flex-col gap-16 mt-32">
                <h2 className="font-bold text-xl text-neutral-900 mb-16">Tipo</h2>
                {TYPES.map((item) => {
                  const isActive = item.type === activeTab;
                  const icon =
                    typeof item.icon === "function"
                      ? item.icon(isActive)
                      : item.icon;
                  const className =
                    item.type === "reuses" || item.type === "dataservices"
                      ? "w-full agora-toggle agora-toggle-icon agora-toggle-icon-primary full-width has-icon"
                      : "w-full";
                  return (
                    <Toggle
                      key={item.type}
                      id={`search-type-${item.type}`}
                      name="search-type-toggle"
                      value={item.type}
                      appearance="icon"
                      variant="primary"
                      hasIcon
                      leadingIcon={icon}
                      leadingIconHover={item.iconHover}
                      checked={isActive}
                      onChange={() => handleTabChange(item.type)}
                      iconOnly={false}
                      fullWidth={true}
                      className={className}
                    >
                      <div className="flex items-center gap-12 font-bold text-sm">
                        <span
                          className={
                            isActive
                              ? "text-primary-600 font-bold"
                              : "text-neutral-900 font-bold"
                          }
                        >
                          {item.label}
                        </span>
                        <Pill
                          variant="neutral"
                          appearance="outline"
                          circular={false}
                          className="text-xs font-medium text-neutral-500 ml-16"
                        >
                          {totals[item.type].toLocaleString("pt-PT")}
                        </Pill>
                      </div>
                    </Toggle>
                  );
                })}
              </div>

              {activeTab === "datasets" && (
                <div className="flex flex-col gap-32 mb-32">
                  <h2 className="font-bold text-xl text-neutral-900">Filtros</h2>
                  {(Object.keys(DATASET_FILTERS) as FilterKey[]).map((filterKey) => {
                    const section = DATASET_FILTERS[filterKey];
                    return (
                      <div key={filterKey} className="pr-32 max-w-[592px] flex flex-col gap-8">
                        <h3 className="font-bold text-base text-neutral-900 mb-8">
                          {section.title}
                        </h3>
                        {section.options.map((option) => {
                          const isSelected = selectedFilters[filterKey] === option.id;
                          return (
                            <Toggle
                              key={option.id}
                              id={`filter-${filterKey}-${option.id}`}
                              name={`filter-${filterKey}`}
                              value={option.id}
                              appearance="icon"
                              variant="primary"
                              checked={isSelected}
                              onChange={() => handleFilterChange(filterKey, option.id)}
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
                                <Pill
                                  variant="neutral"
                                  appearance="outline"
                                  circular={false}
                                  className="text-xs font-medium text-neutral-500 ml-16"
                                >
                                  {option.count}
                                </Pill>
                              </div>
                            </Toggle>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="xl:col-span-8 p-32 pr-0">
              <div className="flex items-center justify-between mb-24">
                <p className="text-m-bold text-neutral-900">
                  {totalForActiveTab} Resultado
                  {totalForActiveTab !== 1 ? "s" : ""}
                </p>
              </div>

              {!isLoading && (
                <>
                  {activeTab === "datasets" && (
                    <div className="flex flex-col gap-0">
                      {datasets.length > 0 ? (
                        datasets.map((dataset) => (
                          <Link
                            key={dataset.id}
                            href={`/pages/datasets/${dataset.slug}`}
                            className="block p-20 border border-neutral-200 -mt-px first:rounded-t-8 last:rounded-b-8 hover:border-primary-600 hover:z-10 hover:shadow-sm transition-all relative"
                          >
                            <h3 className="text-m-bold text-primary-700">
                              {dataset.title}
                            </h3>
                            {dataset.organization && (
                              <p className="text-s-regular text-neutral-500 mt-4">
                                {dataset.organization.name}
                                {dataset.last_modified && (
                                  <span className="ml-8">
                                    — Atualizado a{" "}
                                    {new Date(
                                      dataset.last_modified
                                    ).toLocaleDateString("pt-PT")}
                                  </span>
                                )}
                              </p>
                            )}
                            <p className="text-s-regular text-neutral-700 mt-8 line-clamp-2">
                              {dataset.description}
                            </p>
                            {dataset.tags?.length > 0 && (
                              <div className="flex flex-wrap gap-8 mt-8">
                                {dataset.tags.slice(0, 5).map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-xs px-8 py-2 bg-neutral-100 text-neutral-600 rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </Link>
                        ))
                      ) : (
                        <CardNoResults
                          position="center"
                          icon={
                            <Icon name="agora-line-search" className="w-48 h-48 text-neutral-400" />
                          }
                          title={`Nenhum resultado encontrado para "${query}"`}
                          description="Tente pesquisar com termos diferentes."
                        />
                      )}
                    </div>
                  )}

                  {activeTab === "dataservices" && (
                    <div className="flex flex-col gap-0">
                      {dataservices.length > 0 ? (
                        dataservices.map((ds) => (
                          <Link
                            key={ds.id}
                            href={`/pages/dataservices/${ds.id}`}
                            className="block p-20 border border-neutral-200 -mt-px first:rounded-t-8 last:rounded-b-8 hover:border-primary-600 hover:z-10 hover:shadow-sm transition-all relative"
                          >
                            <h3 className="text-m-bold text-primary-700">
                              {ds.title}
                            </h3>
                            {ds.organization && (
                              <p className="text-s-regular text-neutral-500 mt-4">
                                {ds.organization.name}
                              </p>
                            )}
                            <p className="text-s-regular text-neutral-700 mt-8 line-clamp-2">
                              {ds.description}
                            </p>
                          </Link>
                        ))
                      ) : (
                        <CardNoResults
                          position="center"
                          icon={
                            <Icon name="agora-line-search" className="w-48 h-48 text-neutral-400" />
                          }
                          title={`Nenhum resultado encontrado para "${query}"`}
                          description="Tente pesquisar com termos diferentes."
                        />
                      )}
                    </div>
                  )}

                  {activeTab === "organizations" && (
                    <div className="flex flex-col gap-0">
                      {organizations.length > 0 ? (
                        organizations.map((org) => (
                          <Link
                            key={org.id}
                            href={`/pages/organizations/${org.slug}`}
                            className="flex items-center gap-20 p-20 border border-neutral-200 -mt-px first:rounded-t-8 last:rounded-b-8 hover:border-primary-600 hover:z-10 hover:shadow-sm transition-all relative"
                          >
                            {org.logo ? (
                              <img
                                src={org.logo}
                                alt={org.name}
                                className="w-48 h-48 object-contain rounded-4 shrink-0"
                              />
                            ) : (
                              <div className="w-48 h-48 bg-neutral-100 rounded-4 flex items-center justify-center shrink-0">
                                <Icon
                                  name="agora-line-buildings"
                                  className="w-20 h-20 text-neutral-400"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="text-m-bold text-primary-700">
                                {org.name}
                              </h3>
                              {org.description && (
                                <p className="text-s-regular text-neutral-700 mt-4 line-clamp-2">
                                  {org.description}
                                </p>
                              )}
                            </div>
                          </Link>
                        ))
                      ) : (
                        <CardNoResults
                          position="center"
                          icon={
                            <Icon name="agora-line-search" className="w-48 h-48 text-neutral-400" />
                          }
                          title={`Nenhum resultado encontrado para "${query}"`}
                          description="Tente pesquisar com termos diferentes."
                        />
                      )}
                    </div>
                  )}

                  {activeTab === "reuses" && (
                    <div className="flex flex-col gap-0">
                      {reuses.length > 0 ? (
                        reuses.map((reuse) => (
                          <Link
                            key={reuse.id}
                            href={`/pages/reuses/${reuse.slug}`}
                            className="flex items-center gap-20 p-20 border border-neutral-200 -mt-px first:rounded-t-8 last:rounded-b-8 hover:border-primary-600 hover:z-10 hover:shadow-sm transition-all relative"
                          >
                            {reuse.image_thumbnail || reuse.image ? (
                              <img
                                src={reuse.image_thumbnail || reuse.image || ""}
                                alt={reuse.title}
                                className="w-48 h-48 object-cover rounded-4 shrink-0"
                              />
                            ) : (
                              <div className="w-48 h-48 bg-neutral-100 rounded-4 flex items-center justify-center shrink-0">
                                <Icon
                                  name="agora-line-bar-chart"
                                  className="w-20 h-20 text-neutral-400"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="text-m-bold text-primary-700">
                                {reuse.title}
                              </h3>
                              <p className="text-s-regular text-neutral-500 mt-4">
                                {reuse.organization?.name || (reuse.owner ? `${reuse.owner.first_name} ${reuse.owner.last_name}`.trim() : '')}
                              </p>
                              <p className="text-s-regular text-neutral-700 mt-4 line-clamp-2">
                                {reuse.description}
                              </p>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <CardNoResults
                          position="center"
                          icon={
                            <Icon name="agora-line-search" className="w-48 h-48 text-neutral-400" />
                          }
                          title={`Nenhum resultado encontrado para "${query}"`}
                          description="Tente pesquisar com termos diferentes."
                        />
                      )}
                    </div>
                  )}

                  {totalForActiveTab > PAGE_SIZE && (
                    <div className="mt-32">
                      <Pagination
                        currentPage={currentPage}
                        totalItems={totalForActiveTab}
                        pageSize={PAGE_SIZE}
                        baseUrl={`/pages/search?q=${encodeURIComponent(query)}&type=${activeTab}`}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {!query && (
        <div className="container mx-auto text-center py-48 text-neutral-500">
          <p className="text-m-regular">
            Introduza um termo para pesquisar no portal.
          </p>
        </div>
      )}
    </div>
  );
}
