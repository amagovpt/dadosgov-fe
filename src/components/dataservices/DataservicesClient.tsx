"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  InputSearchBar,
  InputSelect,
  DropdownSection,
  DropdownOption,
  Icon,
  CardNoResults,
  Button,
  CardGeneral,
  Toggle,
  Pill,
  Sidebar,
  SidebarItem,
  Checkbox,
  InputSearch,
} from "@ama-pt/agora-design-system";
import { Pagination } from "@/components/Pagination";
import { CategoryToggles } from "@/components/CategoryToggles";
import { fetchOrganizations, suggestTags } from "@/services/api";
import { APIResponse, Dataservice, Organization, SiteMetrics } from "@/types/api";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

import PageBanner from "@/components/PageBanner";

const SORT_OPTIONS: Record<string, string> = {
  relevancia: "",
  recentes: "-created_at",
};

function SortSelect({
  currentSortKey,
  onSortChange,
}: {
  currentSortKey: string;
  onSortChange: (value: string) => void;
}) {
  const [mounted, setMounted] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectRef = React.useRef<any>(null);
  const lastValue = React.useRef(currentSortKey);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      const selected = selectRef.current?.selectedOptions?.[0]?.value;
      if (selected && selected !== lastValue.current) {
        lastValue.current = selected;
        onSortChange(selected);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [mounted, onSortChange]);

  if (!mounted) {
    return (
      <div className="selectDataservice">
        <label className="text-s-regular text-neutral-700 mb-4 block">Ordenar por :</label>
        <div className="w-full border border-neutral-300 rounded-8 px-16 py-12 text-m-regular text-neutral-900 bg-white">
          {currentSortKey === "recentes" ? "Mais recentes" : "Relevância"}
        </div>
      </div>
    );
  }

  return (
    <InputSelect
      label="Ordenar por :"
      id="sort-dataservices"
      className="selectDataservice"
      ref={selectRef}
    >
      <DropdownSection name="order">
        <DropdownOption value="relevancia" selected={currentSortKey === "relevancia"}>
          Relevância
        </DropdownOption>
        <DropdownOption value="recentes" selected={currentSortKey === "recentes"}>
          Mais recentes
        </DropdownOption>
      </DropdownSection>
    </InputSelect>
  );
}

const API_TOGGLE_FILTERS = {
  metodo: {
    title: "Métodos de acesso",
    options: [
      { id: "all", label: "Todos", count: "352" },
      { id: "free_download", label: "Download gratuito", count: "230" },
      { id: "open_conditions", label: "Aberto sob certas condições", count: "16" },
      { id: "auth_access", label: "Acesso mediante autorização", count: "106" },
    ],
  },
  atualizacao: {
    title: "Data da atualização",
    options: [
      { id: "all", label: "Todos", count: "352" },
      { id: "30_days", label: "Os últimos 30 dias", count: "96" },
      { id: "12_months", label: "Os últimos 12 meses", count: "279" },
      { id: "3_years", label: "Os últimos 3 anos", count: "352" },
    ],
  },
  organizacao: {
    title: "Tipo de organização",
    options: [
      { id: "all", label: "Todos", count: "352" },
      { id: "public_service", label: "Serviço público", count: "259" },
      { id: "local_authority", label: "Autoridade local", count: "54" },
      { id: "business", label: "Negócios", count: "8" },
      { id: "association", label: "Associação", count: "6" },
      { id: "user", label: "Utilizador", count: "7" },
    ],
  },
};

type ApiFilterKey = keyof typeof API_TOGGLE_FILTERS;

interface DataservicesClientProps {
  initialData: APIResponse<Dataservice>;
  currentPage: number;
  siteMetrics?: SiteMetrics;
  initialFilters?: { q?: string; sort?: string };
}

export default function DataservicesClient({
  initialData,
  currentPage,
  siteMetrics,
  initialFilters,
}: DataservicesClientProps) {
  const router = useRouter();
  const { data: dataservices, total, page_size } = initialData;
  const [searchQuery, setSearchQuery] = useState(initialFilters?.q || "");
  const [selectedToggleFilters, setSelectedToggleFilters] = useState<Record<ApiFilterKey, string>>({
    metodo: "all",
    atualizacao: "all",
    organizacao: "all",
  });

  const handleToggleFilterChange = (filterKey: ApiFilterKey, optionId: string) => {
    setSelectedToggleFilters((prev) => ({ ...prev, [filterKey]: optionId }));
  };

  // Advanced filters state
  const [filterOrgs, setFilterOrgs] = useState<Organization[]>([]);
  const [filterTagOptions, setFilterTagOptions] = useState<{ id: string; name: string }[]>([]);
  const [filterSearchQueries, setFilterSearchQueries] = useState<Record<string, string>>({});
  const [isFiltersLoading, setIsFiltersLoading] = useState(true);

  useEffect(() => {
    async function loadFilterData() {
      try {
        const orgsRes = await fetchOrganizations(1, 100, { sort: "-datasets" });
        setFilterOrgs(orgsRes.data);
      } catch (error) {
        console.error("Failed to load filter data", error);
      } finally {
        setIsFiltersLoading(false);
      }
    }
    loadFilterData();
  }, []);

  const handleTagSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setFilterTagOptions([]);
      return;
    }
    try {
      const results = await suggestTags(q);
      setFilterTagOptions(results.map((t) => ({ id: t.text, name: t.text })));
    } catch {
      setFilterTagOptions([]);
    }
  }, []);

  const handleAdvancedFilterChange = (paramName: string, value: string) => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const currentValues = params.getAll(paramName);
    if (currentValues.includes(value)) {
      params.delete(paramName);
      currentValues.filter((v) => v !== value).forEach((v) => params.append(paramName, v));
    } else {
      params.append(paramName, value);
    }
    params.set("page", "1");
    router.push(`/pages/dataservices?${params.toString()}`);
  };

  const handleClearAdvancedFilter = (paramName: string) => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    params.delete(paramName);
    params.set("page", "1");
    router.push(`/pages/dataservices?${params.toString()}`);
  };

  const handleFilterSearchChange = (groupName: string, value: string) => {
    setFilterSearchQueries((prev) => ({ ...prev, [groupName]: value }));
    if (groupName === "Palavras-chave") handleTagSearch(value);
  };

  const getActiveValues = (paramName: string) => {
    if (typeof window === "undefined") return [];
    return new URLSearchParams(window.location.search).getAll(paramName);
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
  ];
  const currentQuery = initialFilters?.q || "";
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildUrl = useCallback(
    (overrides: { q?: string | null; sort?: string | null; page?: number } = {}) => {
      const params = new URLSearchParams();
      const q = overrides.q !== undefined ? overrides.q : initialFilters?.q;
      const sort = overrides.sort !== undefined ? overrides.sort : initialFilters?.sort;
      const page = overrides.page ?? currentPage;

      if (q) params.set("q", q);
      if (sort) params.set("sort", sort);
      if (page > 1) params.set("page", String(page));

      const qs = params.toString();
      return `/pages/dataservices${qs ? `?${qs}` : ""}`;
    },
    [initialFilters, currentPage]
  );

  useEffect(() => {
    if (searchQuery === currentQuery) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl({ q: searchQuery.trim() || null, page: 1 }));
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, currentQuery, router, buildUrl]);

  const handleSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    router.push(buildUrl({ q: searchQuery.trim() || null, page: 1 }));
  }, [router, buildUrl, searchQuery]);

  const handleSortChange = useCallback(
    (value: string) => {
      router.push(buildUrl({ sort: SORT_OPTIONS[value] || null, page: 1 }));
    },
    [router, buildUrl]
  );

  const handleClearFilters = useCallback(() => {
    router.push("/pages/dataservices");
  }, [router]);

  const sortDefault = (() => {
    const reverseMap: Record<string, string> = {
      "-created_at": "recentes",
    };
    return reverseMap[initialFilters?.sort || ""] || "relevancia";
  })();

  const hasActiveFilters = !!initialFilters?.q;

  return (
    <div className="min-h-screen flex flex-col font-sans text-neutral-900 bg-neutral-50 filters dataservice">
      <main className="flex-grow bg-primary-50">
        <PageBanner
          title="APIs"
          backgroundImageUrl="/Banner/hero-bg.png"
          backgroundPosition="center right"
          breadcrumbItems={[
            { label: "Home", url: "/" },
            { label: "APIs", url: "/pages/dataservices" },
          ]}
          subtitle={
            <p className="text-primary-100 max-w-[592px]">
              {total === 0
                ? "Não existem resultados disponíveis para a sua pesquisa"
                : `Pesquise através de ${total.toLocaleString("pt-PT")} APIs em dados.gov.pt`}
            </p>
          }
        >
          <InputSearchBar
            label="O que procura nas APIs?"
            placeholder="Pesquisar APIs..."
            id="dataservices-search"
            hasVoiceActionButton={false}
            voiceActionAltText="Pesquisar por voz"
            searchActionAltText="Pesquisar"
            darkMode={true}
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter") handleSearch();
            }}
            onSearchActivate={() => handleSearch()}
          />
          <div className="mt-8 text-s-regular text-neutral-200">
            Exemplos: &quot;geolocalização&quot;, &quot;transportes&quot;, &quot;saúde&quot;
          </div>
          <div className="absolute w-full mb-64 bg-white text-neutral-900 shadow-lg dropdown"></div>
        </PageBanner>

        <div className="container mx-auto md:gap-32 xl:gap-64 bg-white">
          <div className="grid md:grid-cols-3 xl:grid-cols-12 grid-filters">
            {/* Sidebar */}
            <div className="xl:col-span-5 xl:block p-32 pl-0">
              {siteMetrics && (
                <div>
                  <CategoryToggles siteMetrics={siteMetrics} searchQuery={initialFilters?.q} />
                </div>
              )}

              <div className="flex flex-col gap-32 mt-[36px]">
                <h2 className="font-bold text-xl text-neutral-900">Filtros</h2>
                {(Object.keys(API_TOGGLE_FILTERS) as ApiFilterKey[]).map((filterKey) => {
                  const section = API_TOGGLE_FILTERS[filterKey];
                  return (
                    <div key={filterKey} className="pr-32 max-w-[592px] flex flex-col gap-8">
                      <h3 className="font-bold text-base text-neutral-900 mb-8">{section.title}</h3>
                      {section.options.map((option) => {
                        const isSelected = selectedToggleFilters[filterKey] === option.id;
                        return (
                          <Toggle
                            key={option.id}
                            id={`api-filter-${filterKey}-${option.id}`}
                            name={`api-filter-${filterKey}`}
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

              <h2 className="font-bold text-xl text-neutral-900 mt-[36px] mb-[32px]">
                Filtros avançados
              </h2>

              <Sidebar variant="filter" className="font-bold">
                {advancedFilterGroups.map((group, index) => {
                  const searchQuery = filterSearchQueries[group.name] || "";
                  const activeValues = getActiveValues(group.param);
                  const activeCount = activeValues.length;

                  const selectedItems: { id: string; name: string }[] = group.suggest
                    ? activeValues
                        .filter((v) => !group.data.some((d) => d.id === v))
                        .map((v) => ({ id: v, name: v }))
                    : [];

                  const allData = [...selectedItems, ...group.data];

                  const filteredData = group.suggest
                    ? allData
                    : allData.filter((item) =>
                        item.name.toLowerCase().includes(searchQuery.toLowerCase())
                      );

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
                        {activeCount > 0 && (
                          <button
                            onClick={() => handleClearAdvancedFilter(group.param)}
                            className="text-xs text-primary-500 hover:text-primary-700 underline mb-4 mt-4 cursor-pointer"
                          >
                            Limpar {group.name.toLowerCase()}
                          </button>
                        )}
                        {group.searchable && (
                          <div className="mb-4 mt-8 relative">
                            <InputSearch
                              label="Pesquisar"
                              hideLabel
                              placeholder={
                                group.suggest ? "Escreva para pesquisar..." : "Pesquisar"
                              }
                              value={searchQuery}
                              onChange={(e) => handleFilterSearchChange(group.name, e.target.value)}
                            />
                            <Icon
                              name="agora-solid-search"
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-primary-500 w-5 h-5 pointer-events-none"
                              aria-hidden="true"
                            />
                          </div>
                        )}
                        <div
                          className={`flex flex-col gap-2 ${
                            showScroll ? "max-h-[225px] overflow-y-auto" : ""
                          }`}
                        >
                          {isFiltersLoading && !group.suggest ? null : filteredData.length > 0 ? (
                            filteredData.map((item) => (
                              <Checkbox
                                key={item.id}
                                label={item.name}
                                className="font-bold"
                                value={item.id}
                                name={group.param}
                                checked={activeValues.includes(item.id)}
                                onChange={() => handleAdvancedFilterChange(group.param, item.id)}
                              />
                            ))
                          ) : group.suggest && searchQuery.length < 2 ? (
                            activeCount > 0 ? null : (
                              <p className="text-sm text-neutral-900">
                                Escreva pelo menos 2 caracteres...
                              </p>
                            )
                          ) : (
                            <p className="text-sm text-neutral-500">Sem resultados</p>
                          )}
                        </div>
                      </div>
                    </SidebarItem>
                  );
                })}
              </Sidebar>

              <div className="mt-32">
                <Button variant="primary" appearance="outline" onClick={handleClearFilters}>
                  Limpar filtros
                </Button>
              </div>
            </div>

            {/* Results Area */}
            <div className="xl:col-span-7 mt-[36px]">
              <div>
                <div className="grid md:grid-cols-2 xl:grid-cols-12 gap-32 mb-16 items-center mt-[12px]">
                  <span className="text-neutral-900 font-medium text-base xl:col-span-6 mt-[32px]">
                    {total.toLocaleString("pt-PT")} Resultados
                  </span>
                  <div className="w-full md:w-auto xl:col-span-6 flex items-end gap-16 justify-end">
                    {hasActiveFilters && (
                      <Button
                        variant="primary"
                        appearance="link"
                        hasIcon={true}
                        trailingIcon="agora-line-close"
                        trailingIconHover="agora-solid-close"
                        onClick={handleClearFilters}
                      >
                        Limpar filtros
                      </Button>
                    )}
                    <div className="flex-grow max-w-[240px]">
                      <SortSelect currentSortKey={sortDefault} onSortChange={handleSortChange} />
                    </div>
                  </div>
                </div>

                <div className="divider-neutral-200 mt-[14px] mb-24" />

                <div className="grid xs:grid-cols-1 sm:grid-cols-2 gap-32">
                  {dataservices.length > 0 ? (
                    dataservices.map((ds) => {
                      const formatMetric = (value: number | undefined) => {
                        if (!value) return "0";
                        if (value >= 1_000_000)
                          return (value / 1_000_000).toFixed(1).replace(".", ",") + " M";
                        if (value >= 1_000) return (value / 1_000).toFixed(0) + " mil";
                        return String(value);
                      };
                      const timeAgo = ds.last_modified
                        ? formatDistanceToNow(new Date(ds.last_modified), { locale: pt })
                            .replace("aproximadamente ", "")
                            .replace("quase ", "")
                            .replace("menos de ", "")
                            .replace("cerca de ", "")
                        : "Desconhecido";
                      const dsUrl = `/pages/dataservices/preview?title=${encodeURIComponent(ds.title)}&description=${encodeURIComponent(ds.description || "")}`;

                      return (
                        <Link
                          key={ds.id}
                          href={dsUrl}
                          className="card-general-listing rounded-[4px] overflow-hidden h-full flex flex-col"
                        >
                          <CardGeneral
                            variant="neutral-100"
                            image={{
                              src: ds.organization?.logo || "/images/placeholders/organization.png",
                              alt: ds.organization?.name || "Organização",
                              height: "56px",
                              className: "bg-primary-100 !object-contain !h-[56px]",
                            }}
                            subtitleText={
                              (
                                <div className="flex flex-col">
                                  <span style={{ fontSize: "16px" }} className="text-neutral-900">
                                    {timeAgo}
                                  </span>
                                  <span
                                    style={{ fontSize: "16px", fontWeight: 300 }}
                                    className="text-neutral-900 mt-4"
                                  >
                                    {ds.organization?.name || "Sem Organização"}
                                  </span>
                                </div>
                              ) as unknown as string
                            }
                            titleText={ds.title}
                            descriptionText={
                              (
                                <div className="flex flex-col grow">
                                  {ds.description && (
                                    <p className="text-m-regular text-neutral-800 line-clamp-3 mb-16">
                                      {ds.description}
                                    </p>
                                  )}
                                  <div className="mt-auto">
                                    <div className="flex items-center flex-wrap gap-8 text-xs mt-12 text-neutral-700">
                                      <div
                                        className="flex items-center gap-8"
                                        title="Visualizações"
                                      >
                                        <Icon
                                          name={
                                            ds.metrics?.views ? "agora-solid-eye" : "agora-line-eye"
                                          }
                                          dimensions="xs"
                                          className="fill-neutral-700"
                                          aria-hidden="true"
                                        />
                                        <span>{formatMetric(ds.metrics?.views)}</span>
                                      </div>
                                      <div className="flex items-center gap-8" title="Favoritos">
                                        <Icon
                                          name={
                                            ds.metrics?.followers
                                              ? "agora-solid-star"
                                              : "agora-line-star"
                                          }
                                          dimensions="xs"
                                          className="fill-neutral-700"
                                          aria-hidden="true"
                                        />
                                        <span>{formatMetric(ds.metrics?.followers)}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-8 text-primary-600 mt-16">
                                      <Icon
                                        name="agora-line-arrow-right-circle"
                                        className="w-32 h-32"
                                        aria-hidden="true"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) as unknown as string
                            }
                            isBlockedLink={true}
                            anchor={{ href: dsUrl }}
                          />
                        </Link>
                      );
                    })
                  ) : (
                    <div className="col-span-full">
                      <CardNoResults
                        icon={
                          <Icon
                            name="agora-line-search"
                            className="w-12 h-12 text-primary-500 icon-xl"
                          />
                        }
                        title="Não encontrou o que procurava?"
                        subtitle={
                          <span className="font-bold">
                            Tente redefinir os filtros para ampliar a sua pesquisa.
                          </span>
                        }
                        description={
                          <div className="max-w-[592px] mx-auto">
                            Explore a nossa lista completa de APIs de dados abertos.
                          </div>
                        }
                        position="center"
                        hasAnchor={false}
                      />
                    </div>
                  )}
                </div>

                <div className="pt-64 flex justify-center pb-64 pagination-filters">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={total}
                    pageSize={page_size}
                    baseUrl={buildUrl()}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
