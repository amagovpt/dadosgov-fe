"use client";

import { useState, useCallback, useEffect, useMemo, type MouseEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CardLinks,
  Button,
  Icon,
  CardNoResults,
  Toggle,
  ToggleGroup,
} from "@ama-pt/agora-design-system";
import { Pagination } from "@/components/Pagination";
import SearchFilter from "@/components/Shared/SearchFilter";
import { useSearchFilterUrlSync } from "@/hooks/useSearchFilterUrlSync";
import { fetchOrganizations, fetchReuses, suggestTags } from "@/services/api";
import {
  APIResponse,
  Organization,
  Reuse,
  ReuseFilters,
} from "@/types/api";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

import PageBanner from "@/components/PageBanner";
import PublishDropdown from "@/components/admin/PublishDropdown";
import {
  AdvancedFilterGroup,
  AdvancedFiltersSidebar,
} from "@/components/filters/AdvancedFiltersSidebar";
import {
  ToggleFilterSection,
  ToggleFilterSections,
} from "@/components/filters/ToggleFilterSections";

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
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  },
  "12_months": () => {
    const d = new Date(); d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  },
  "3_years": () => {
    const d = new Date(); d.setFullYear(d.getFullYear() - 3);
    return d.toISOString().slice(0, 10);
  },
};

function detectAtualizacaoFromParams(filters?: ReuseFilters): string {
  const since = filters?.modified_since;
  if (!since) return "all";
  const diffDays = Math.round((Date.now() - new Date(since).getTime()) / 86400000);
  if (diffDays <= 31) return "30_days";
  if (diffDays <= 366) return "12_months";
  if (diffDays <= 1096) return "3_years";
  return "all";
}

function formatCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return k % 1 === 0 ? `${k} mil` : `${k.toFixed(1).replace(".", ",")} mil`;
  }
  return n.toLocaleString("pt-PT");
}

type ReuseFilterKey = keyof typeof REUSE_TOGGLE_FILTERS;

interface ReusesClientProps {
  initialData: APIResponse<Reuse>;
  currentPage: number;
  filterCounts?: Record<string, number>;
}

export default function ReusesClient({
  initialData,
  currentPage,
  filterCounts = {},
}: ReusesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const [listData, setListData] = useState<APIResponse<Reuse>>(initialData);
  const activePage = Number(searchParams.get("page") || String(currentPage || 1));
  const { data: reuses, total, page_size } = listData;
  const currentQuery = searchParams.get("q") || "";
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Toggle filters state
  const [selectedToggleFilters, setSelectedToggleFilters] = useState<
    Record<ReuseFilterKey, string>
  >({
    atualizacao: detectAtualizacaoFromParams({
      modified_since: searchParams.get("modified_since") || undefined,
    }),
  });

  useEffect(() => {
    const params = new URLSearchParams(queryString);
    const modifiedSince = params.get("modified_since") || undefined;
    setSelectedToggleFilters((prev) => ({
      ...prev,
      atualizacao: detectAtualizacaoFromParams({ modified_since: modifiedSince }),
    }));
  }, [queryString]);

  useEffect(() => {
    let cancelled = false;

    async function loadReusesFromUrl() {
      const params = new URLSearchParams(queryString);
      const tags = params.getAll("tag");
      const organizations = params.getAll("organization");

      const filters: ReuseFilters = {
        ...(params.get("q") && { q: params.get("q") as string }),
        ...(params.get("type") && { type: params.get("type") as string }),
        ...(params.get("sort") && { sort: params.get("sort") as string }),
        ...(params.get("modified_since") && {
          modified_since: params.get("modified_since") as string,
        }),
        ...(tags.length > 0 && { tag: tags.length === 1 ? tags[0] : tags }),
        ...(organizations.length > 0 && {
          organization: organizations.length === 1 ? organizations[0] : organizations,
        }),
      };

      const next = await fetchReuses(activePage, initialData.page_size || 12, filters);
      if (!cancelled) setListData(next);
    }

    loadReusesFromUrl();
    return () => {
      cancelled = true;
    };
  }, [queryString, activePage, initialData.page_size]);

  const navigateWithParams = useCallback((params: URLSearchParams) => {
    // First page is implicit; keep URLs clean and stable.
    params.delete("page");
    params.sort();
    const nextUrl = `${pathname}${params.size > 0 ? `?${params.toString()}` : ""}`;
    router.replace(nextUrl, { scroll: false });
  }, [pathname, router]);

  const getLiveParams = useCallback(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams(Array.from(searchParams.entries()));
  }, [searchParams]);

  const handleToggleFilterChange = (filterKey: ReuseFilterKey, optionId: string) => {
    setSelectedToggleFilters((prev) => ({ ...prev, [filterKey]: optionId }));

    if (filterKey === "atualizacao") {
      const params = getLiveParams();
      params.delete("modified_since");
      if (optionId !== "all" && DATE_RANGE_MAP[optionId]) {
        params.set("modified_since", DATE_RANGE_MAP[optionId]());
      }
      navigateWithParams(params);
    }
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
    const params = getLiveParams();
    const currentValues = params.getAll(paramName);

    // Read actual current state from URL at click time to avoid stale render state.
    const isCurrentlyChecked = currentValues.includes(value);

    if (isCurrentlyChecked) {
      params.delete(paramName);
      currentValues.filter((v) => v !== value).forEach((v) => params.append(paramName, v));
    } else {
      params.append(paramName, value);
    }
    navigateWithParams(params);
  };

  const handleClearAdvancedFilter = (paramName: string) => {
    const params = getLiveParams();
    params.delete(paramName);
    navigateWithParams(params);
  };

  const handleFilterSearchChange = (groupName: string, value: string) => {
    setFilterSearchQueries((prev) => ({ ...prev, [groupName]: value }));
    if (groupName === "Palavras-chave") handleTagSearch(value);
  };

  const getActiveValues = (paramName: string) => {
    return searchParams.getAll(paramName);
  };

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
              ? formatCount(filterCounts[`atualizacao_${option.id}`])
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
        data: filterOrgs.map((organization) => ({ id: organization.id, name: organization.name })),
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
    [filterOrgs, filterTagOptions]
  );

  const buildUrl = useCallback(
    (overrides: Partial<ReuseFilters> & { page?: number } = {}) => {
      const params = getLiveParams();

      if ("q" in overrides) {
        if (overrides.q) params.set("q", overrides.q);
        else params.delete("q");
      }

      if ("type" in overrides) {
        if (overrides.type) params.set("type", overrides.type);
        else params.delete("type");
      }

      if ("tag" in overrides) {
        params.delete("tag");
        const tag = overrides.tag;
        if (tag) {
          if (Array.isArray(tag)) tag.forEach((value) => params.append("tag", value));
          else params.append("tag", tag);
        }
      }

      if ("organization" in overrides) {
        params.delete("organization");
        const organization = overrides.organization;
        if (organization) {
          if (Array.isArray(organization)) {
            organization.forEach((value) => params.append("organization", value));
          } else {
            params.append("organization", organization);
          }
        }
      }

      if ("sort" in overrides) {
        if (overrides.sort) params.set("sort", overrides.sort);
        else params.delete("sort");
      }

      if ("page" in overrides) {
        if (overrides.page && overrides.page > 1) params.set("page", String(overrides.page));
        else params.delete("page");
      } else if (activePage > 1) {
        params.set("page", String(activePage));
      }

      const qs = params.toString();
      return `/pages/reuses${qs ? `?${qs}` : ""}`;
    },
    [activePage, getLiveParams]
  );

  const onSearchNavigate = useCallback(
    (query: string) => {
      router.replace(buildUrl({ q: query || undefined, page: 1 }), { scroll: false });
    },
    [router, buildUrl]
  );

  const { searchQuery, setSearchQuery, handleSearch } = useSearchFilterUrlSync({
    currentQuery,
    onSearchNavigate,
  });

  const handleSortChange = useCallback(
    (value: string) => {
      router.replace(buildUrl({ sort: SORT_OPTIONS[value] || undefined, page: 1 }), {
        scroll: false,
      });
    },
    [router, buildUrl]
  );

  const sortDefault = (() => {
    const reverseMap: Record<string, string> = {
      "-last_modified": "recentes",
      last_modified: "antigos",
      "-followers": "subscritores",
    };
    return reverseMap[searchParams.get("sort") || ""] || "relevancia";
  })();

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
          <PublishDropdown darkMode={true} outline={false} />
        </PageBanner>

        {/* Search Filter */}
        <SearchFilter
          id="reuses-search"
          placeholder="Pesquisar reutilizações..."
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
        />

        {/* Main Content */}
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
                  <Toggle key={key} value={key} aria-label={`Ordenar por ${label}`}>
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
                <ToggleFilterSections
                  sections={toggleSections}
                  selectedValues={selectedToggleFilters}
                  onChange={(sectionKey, optionId) =>
                    handleToggleFilterChange(sectionKey as ReuseFilterKey, optionId)
                  }
                  idPrefix="reuse-filter"
                />

                <h2 className="font-bold text-xl text-neutral-900 mt-[36px] mb-[32px]">
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
                  isLoading={isFiltersLoading}
                />

                <div className="mt-32">
                  <Button
                    variant="primary"
                    appearance="outline"
                    onClick={() => {
                      setSelectedToggleFilters({
                        atualizacao: "all",
                      });
                      router.replace("/pages/reuses", { scroll: false });
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
                                onClick: (e: MouseEvent) => e.preventDefault(),
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
                                onClick: (e: MouseEvent) => e.preventDefault(),
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
                                onClick: (e: MouseEvent) => e.preventDefault(),
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
                    currentPage={activePage}
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



