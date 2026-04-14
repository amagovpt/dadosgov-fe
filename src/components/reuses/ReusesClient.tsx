"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CardLinks,
  InputSearch,
  Button,
  InputSelect,
  DropdownSection,
  DropdownOption,
  Icon,
  CardNoResults,
  Toggle,
  ToggleGroup,
  Pill,
  Sidebar,
  SidebarItem,
  Checkbox,
} from "@ama-pt/agora-design-system";
import { Pagination } from "@/components/Pagination";
import { fetchOrganizations, suggestTags } from "@/services/api";
import {
  APIResponse,
  Organization,
  Reuse,
  ReuseFilters,
  ReuseType,
  SiteMetrics,
} from "@/types/api";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

import PageBanner from "@/components/PageBanner";
import PublishDropdown from "@/components/admin/PublishDropdown";

const SORT_OPTIONS: Record<string, string> = {
  relevancia: "",
  recentes: "-last_modified",
  antigos: "last_modified",
  subscritores: "-followers",
};

const SORT_LABELS: Record<string, string> = {
  relevancia: "Relevância",
  recentes: "Mais recente",
  antigos: "Mais antigo",
  subscritores: "Subscritores",
};

function TypeSelect({
  currentType,
  reuseTypes,
  onTypeChange,
}: {
  currentType: string;
  reuseTypes: ReuseType[];
  onTypeChange: (value: string) => void;
}) {
  const [mounted, setMounted] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectRef = React.useRef<any>(null);
  const lastValue = React.useRef(currentType);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      const selected = selectRef.current?.selectedOptions?.[0]?.value;
      if (selected !== undefined && selected !== lastValue.current) {
        lastValue.current = selected;
        onTypeChange(selected);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [mounted, onTypeChange]);

  if (!mounted) {
    const label = reuseTypes.find((rt) => rt.id === currentType)?.label || "Todos os tipos";
    return (
      <div>
        <label className="text-s-regular text-neutral-700 mb-4 block">Tipo:</label>
        <div className="w-full border border-neutral-300 rounded-8 px-16 py-12 text-m-regular text-neutral-900 bg-white">
          {label}
        </div>
      </div>
    );
  }

  // Cast to accept mixed children (static + mapped elements)
  const FlexDropdownSection = DropdownSection as React.FC<
    Omit<React.ComponentProps<typeof DropdownSection>, "children"> & { children: React.ReactNode }
  >;

  return (
    <InputSelect label="Tipo:" id="filter-type" ref={selectRef}>
      <FlexDropdownSection name="types">
        <DropdownOption value="" selected={!currentType}>
          Todos os tipos
        </DropdownOption>
        {reuseTypes.map((rt) => (
          <DropdownOption key={rt.id} value={rt.id} selected={currentType === rt.id}>
            {rt.label}
          </DropdownOption>
        ))}
      </FlexDropdownSection>
    </InputSelect>
  );
}

const REUSE_TOGGLE_FILTERS = {
  atualizacao: {
    title: "Data da atualização",
    options: [
      { id: "all", label: "Todos", count: "352" },
      { id: "30_days", label: "Os últimos 30 dias", count: "96" },
      { id: "12_months", label: "Os últimos 12 meses", count: "279" },
      { id: "3_years", label: "Os últimos 3 anos", count: "352" },
    ],
  },
};

type ReuseFilterKey = keyof typeof REUSE_TOGGLE_FILTERS;

interface ReusesClientProps {
  initialData: APIResponse<Reuse>;
  currentPage: number;
  initialFilters?: ReuseFilters;
  reuseTypes?: ReuseType[];
  siteMetrics?: SiteMetrics;
}

export default function ReusesClient({
  initialData,
  currentPage,
  initialFilters,
  reuseTypes = [],
  siteMetrics,
}: ReusesClientProps) {
  const router = useRouter();
  const { data: reuses, total, page_size } = initialData;
  const [searchQuery, setSearchQuery] = useState(initialFilters?.q || "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const currentQuery = initialFilters?.q || "";
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Toggle filters state
  const [selectedToggleFilters, setSelectedToggleFilters] = useState<
    Record<ReuseFilterKey, string>
  >({
    atualizacao: "all",
  });

  const handleToggleFilterChange = (filterKey: ReuseFilterKey, optionId: string) => {
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
    router.push(`/pages/reuses?${params.toString()}`);
  };

  const handleClearAdvancedFilter = (paramName: string) => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    params.delete(paramName);
    params.set("page", "1");
    router.push(`/pages/reuses?${params.toString()}`);
  };

  const handleFilterSearchChange = (groupName: string, value: string) => {
    setFilterSearchQueries((prev) => ({ ...prev, [groupName]: value }));
    if (groupName === "Temático") handleTagSearch(value);
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

  const buildUrl = useCallback(
    (overrides: Partial<ReuseFilters> & { page?: number } = {}) => {
      const params = new URLSearchParams();
      const q = overrides.q ?? initialFilters?.q;
      const type = overrides.type ?? initialFilters?.type;
      const tag = overrides.tag ?? initialFilters?.tag;
      const organization = overrides.organization ?? initialFilters?.organization;
      const sort = "sort" in overrides ? overrides.sort : initialFilters?.sort;
      //const page = overrides.page ?? currentPage;

      if (q) params.set("q", q);
      if (type) params.set("type", type);
      if (tag) params.set("tag", tag);
      if (organization) params.set("organization", organization);
      if (sort) params.set("sort", sort);
      //if (page > 1) params.set("page", String(page));

      const qs = params.toString();
      return `/pages/reuses${qs ? `?${qs}` : ""}`;
    },
    [initialFilters /*, currentPage*/]
  );

  useEffect(() => {
    if (searchQuery === currentQuery) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl({ q: searchQuery || undefined, page: 1 }));
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, currentQuery, router, buildUrl]);

  const handleSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    router.push(buildUrl({ q: searchQuery || undefined, page: 1 }));
  }, [router, buildUrl, searchQuery]);

  const handleSortChange = useCallback(
    (value: string) => {
      router.push(buildUrl({ sort: SORT_OPTIONS[value] || undefined, page: 1 }));
    },
    [router, buildUrl]
  );

  const handleTypeFilter = useCallback(
    (typeId: string) => {
      router.push(
        buildUrl({
          type: typeId === initialFilters?.type ? undefined : typeId,
          page: 1,
        })
      );
    },
    [router, buildUrl, initialFilters?.type]
  );

  const handleClearFilters = useCallback(() => {
    router.push("/pages/reuses");
  }, [router]);

  const sortDefault = (() => {
    const reverseMap: Record<string, string> = {
      "-last_modified": "recentes",
      last_modified: "antigos",
      "-followers": "subscritores",
    };
    return reverseMap[initialFilters?.sort || ""] || "relevancia";
  })();

  const hasActiveFilters = !!(
    initialFilters?.q ||
    initialFilters?.type ||
    initialFilters?.tag ||
    initialFilters?.organization
  );

  return (
    <div className="min-h-screen flex flex-col font-sans text-neutral-900 bg-neutral-50 filters reuse">
      <main className="flex-grow bg-primary-50">
        <PageBanner
          title="Reutilizações"
          backgroundImageUrl="/Banner/hero-bg.png"
          backgroundPosition="center right"
          breadcrumbItems={[
            { label: "Home", url: "/" },
            { label: "Reutilizações", url: "/pages/reuses" },
          ]}
          subtitle={
            <p className="text-primary-100 max-w-[592px]">
              {total === 0
                ? "Não existem resultados disponíveis para a sua pesquisa"
                : `Pesquise através de ${total.toLocaleString("pt-PT")} reutilizações em dados.gov.pt`}
            </p>
          }
        >
          <PublishDropdown darkMode={true} />
        </PageBanner>

        {/* Search Section */}
        <div className="container mx-auto pt-32 pb-16 px-4">
          <div className="max-w-[592px]">
            <InputSearch
              label="Pesquisar"
              placeholder="Pesquisar reutilizações..."
              id="reuses-search"
              defaultValue={initialFilters?.q || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
            <div className="mt-8 text-s-regular text-neutral-900">
              Exemplos: &quot;educação&quot;, &quot;saúde pública&quot;, &quot;ambiente&quot;
            </div>
          </div>
        </div>

        <div className="container mx-auto md:gap-32 xl:gap-64 bg-primary-50">
          {/* Results count + Sort toggles */}
          <div className="grid md:grid-cols-3 xl:grid-cols-12 grid-filters gap-x-[32px]">
            <div className="xl:col-span-5 flex flex-row items-end gap-24 pl-0 py-16">
              <Button
                appearance="outline"
                variant="neutral"
                hasIcon
                {...(filtersOpen
                  ? {
                      leadingIcon: "agora-line-chevron-left",
                      leadingIconHover: "agora-solid-chevron-left",
                    }
                  : {
                      trailingIcon: "agora-line-chevron-right",
                      trailingIconHover: "agora-solid-chevron-right",
                    })}
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                {filtersOpen ? "Ocultar filtros" : "Abrir filtros"}
              </Button>
              <span className="text-neutral-900 text-l-regular whitespace-nowrap">
                {total.toLocaleString("pt-PT")} Resultados
              </span>
            </div>
            <div className="xl:col-span-7 flex items-center justify-end py-16">
              <ToggleGroup
                multiple={false}
                value={sortDefault}
                onChange={(val) => {
                  const selected = val.length > 0 ? val[0] : "relevancia";
                  if (selected !== sortDefault) {
                    handleSortChange(selected);
                  }
                }}
              >
                {Object.entries(SORT_LABELS).map(([key, label]) => (
                  <Toggle key={key} value={key} selected={sortDefault === key}>
                    {label}
                  </Toggle>
                ))}
              </ToggleGroup>
            </div>
          </div>
          <div className="divider-neutral-200 mb-24" />

          <div
            className={`grid grid-filters gap-x-[32px] ${filtersOpen ? "md:grid-cols-3 xl:grid-cols-12" : ""}`}
          >
            {/* Sidebar */}
            {filtersOpen && (
              <div className="xl:col-span-5 xl:block">
                <div className="flex flex-col gap-32 mt-[36px] mb-[36px]">
                  <h2 className="font-bold text-xl text-neutral-900">Filtros</h2>
                  {(Object.keys(REUSE_TOGGLE_FILTERS) as ReuseFilterKey[]).map((filterKey) => {
                    const section = REUSE_TOGGLE_FILTERS[filterKey];
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
                              id={`reuse-filter-${filterKey}-${option.id}`}
                              name={`reuse-filter-${filterKey}`}
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
                    const sq = filterSearchQueries[group.name] || "";
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
                          item.name.toLowerCase().includes(sq.toLowerCase())
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
                                value={sq}
                                onChange={(e) =>
                                  handleFilterSearchChange(group.name, e.target.value)
                                }
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
                            ) : group.suggest && sq.length < 2 ? (
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
                  <Button
                    variant="primary"
                    appearance="outline"
                    onClick={() => {
                      setSelectedToggleFilters({
                        atualizacao: "all",
                      });
                      router.push("/pages/reuses");
                    }}
                  >
                    Limpar filtros
                  </Button>
                </div>
              </div>
            )}

            {/* Results Area */}
            <div className={filtersOpen ? "xl:col-span-7" : "col-span-full"}>
              <div>
                <div
                  className="grid agora-card-links-datasets-px0 gap-32"
                  style={{
                    gridTemplateColumns: filtersOpen
                      ? "repeat(1, minmax(0, 1fr))"
                      : "repeat(2, minmax(0, 1fr))",
                  }}
                >
                  {reuses.length > 0 ? (
                    reuses.map((reuse) => {
                      const timeAgo =
                        reuse.last_modified || reuse.created_at
                          ? formatDistanceToNow(new Date(reuse.last_modified || reuse.created_at), {
                              locale: pt,
                            })
                              .replace("aproximadamente ", "")
                              .replace("quase ", "")
                              .replace("menos de ", "")
                              .replace("cerca de ", "")
                          : "Desconhecido";

                      return (
                        <div key={reuse.id} className="h-full">
                          <CardLinks
                            onClick={() => router.push(`/pages/reuses/${reuse.slug}`)}
                            className="cursor-pointer text-neutral-900 h-full"
                            variant="transparent"
                            image={{
                              src: reuse.image_thumbnail || reuse.image || "/laptop.png",
                              alt: reuse.title,
                            }}
                            category={reuse.organization?.name || "Reutilização"}
                            title={<div className="underline text-xl-bold">{reuse.title}</div>}
                            description={
                              reuse.description ? (
                                <p className="text-sm line-clamp-3 leading-relaxed text-neutral-900 mt-[8px] max-w-[592px]">
                                  {reuse.description}
                                </p>
                              ) : undefined
                            }
                            date={<span className="font-[300]">Atualizado há {timeAgo}</span>}
                            links={[
                              {
                                href: "#",
                                hasIcon: true,
                                leadingIcon: "agora-line-eye",
                                leadingIconHover: "agora-solid-eye",
                                trailingIcon: "",
                                trailingIconHover: "",
                                trailingIconActive: "",
                                children: reuse.metrics?.views?.toLocaleString("pt-PT") || "0",
                                title: "Visualizações",
                                onClick: (e: React.MouseEvent) => e.preventDefault(),
                                className: "text-[#034AD8]",
                              },
                              {
                                href: "#",
                                hasIcon: true,
                                leadingIcon: "agora-line-layers-menu",
                                leadingIconHover: "agora-solid-layers-menu",
                                trailingIcon: "",
                                trailingIconHover: "",
                                trailingIconActive: "",
                                children: `${reuse.datasets?.length || 0} datasets`,
                                title: "Datasets",
                                onClick: (e: React.MouseEvent) => e.preventDefault(),
                                className: "text-[#034AD8]",
                              },
                              {
                                href: "#",
                                hasIcon: true,
                                leadingIcon: "agora-line-star",
                                leadingIconHover: "agora-solid-star",
                                trailingIcon: "",
                                trailingIconHover: "",
                                trailingIconActive: "",
                                children: reuse.metrics?.followers || 0,
                                title: "Favoritos",
                                onClick: (e: React.MouseEvent) => e.preventDefault(),
                                className: "text-[#034AD8]",
                              },
                            ]}
                            mainLink={
                              <Link href={`/pages/reuses/${reuse.slug}`}>
                                <span className="underline">{reuse.title}</span>
                              </Link>
                            }
                            blockedLink={true}
                          />
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full">
                      <CardNoResults
                        icon={
                          <Icon name="agora-line-search" className="w-12 h-12 text-primary-500" />
                        }
                        title="Não encontrou nenhuma reutilização?"
                        subtitle={
                          <span className="font-bold">
                            Tente redefinir os filtros para ampliar sua busca.
                          </span>
                        }
                        description="Explore a nossa lista completa de reutilizações de dados abertos."
                        position="center"
                        hasAnchor={true}
                        valueAnchor="Redefinir filtros"
                        anchorHref="/pages/reuses"
                        anchorTrailingIcon="agora-line-arrow-right-circle"
                        anchorTrailingIconHover="agora-solid-arrow-right-circle"
                      />
                    </div>
                  )}
                </div>

                {/* Pagination */}
                <div className="pb-64 mt-8 flex justify-center">
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
