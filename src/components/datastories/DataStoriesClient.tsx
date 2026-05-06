"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CardLinks,
  InputSearch,
  Button,
  Icon,
  CardNoResults,
  Toggle,
  //ToggleGroup,
  Pill,
  Sidebar,
  SidebarItem,
  Checkbox,
} from "@ama-pt/agora-design-system";
import { Pagination } from "@/components/Pagination";
import PageBanner from "@/components/PageBanner";
import SearchFilter from "@/components/Shared/SearchFilter";
import { useSearchFilterUrlSync } from "@/hooks/useSearchFilterUrlSync";
import { suggestTags } from "@/services/api";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { Datastories } from "@/types/datastories/datastories";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { getAssets } from "@/utils/getAssets";
import { formatDateToTimeAgo } from "@/utils/formatDate";

/*const SORT_OPTIONS: Record<string, string> = {
  recentes: "",
  visualizados: "-views",
};

const SORT_LABELS: Record<string, string> = {
  recentes: "Mais recentes",
  visualizados: "Mais visualizados",
};*/

const now = new Date();
const daysAgo = (dateStr: string, days: number) =>
  (now.getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24) <= days;

interface DataStoriesClientProps {
  currentPage: number;
  initialFilters?: { q?: string; sort?: string };
  datastories: Datastories;
}

export default function DataStoriesClient({
  currentPage,
  initialFilters,
  datastories,
}: DataStoriesClientProps) {
  const router = useRouter();

  const stories = Array.isArray(datastories) ? datastories : [];

  const atualizacaoOptions = [
    {
      id: "all",
      label: "Todos",
      count: String(stories.length),
    },
    {
      id: "30_days",
      label: "Os últimos 30 dias",
      count: String(stories.filter((s) => daysAgo(s.createdAt, 30)).length),
    },
    {
      id: "12_months",
      label: "Os últimos 12 meses",
      count: String(stories.filter((s) => daysAgo(s.createdAt, 365)).length),
    },
    {
      id: "3_years",
      label: "Os últimos 3 anos",
      count: String(stories.filter((s) => daysAgo(s.createdAt, 365 * 3)).length),
    },
  ];

  const TOGGLE_FILTERS = {
    temas: {
      title: "Temas",
      options: stories.reduce(
        (acc, story) => {
          if (!acc.some((option) => option.id === story.theme)) {
            acc.push({
              id: story.theme,
              label: story.organizationName,
              count: String(stories.filter((s) => s.theme === story.theme).length),
            });
          }
          return acc;
        },
        [] as { id: string; label: string; count: string }[]
      ),
    },
    atualizacao: {
      title: "Data da atualização",
      options: atualizacaoOptions,
    },
  };

  type FilterKey = keyof typeof TOGGLE_FILTERS;

  const [filtersOpen, setFiltersOpen] = useState(false);
  const currentQuery = initialFilters?.q || "";

  const buildUrl = useCallback(
    (overrides: { q?: string | null; page?: number } = {}) => {
      const params = new URLSearchParams();
      const q = "q" in overrides ? overrides.q : initialFilters?.q;
      const page = overrides.page ?? currentPage;

      if (q) params.set("q", q);
      if (page > 1) params.set("page", String(page));

      const qs = params.toString();
      return `/pages/datastories${qs ? `?${qs}` : ""}`;
    },
    [initialFilters, currentPage]
  );

  const onSearchNavigate = useCallback(
    (query: string) => {
      router.replace(buildUrl({ q: query || null, page: 1 }), { scroll: false });
    },
    [router, buildUrl]
  );

  const { searchQuery, setSearchQuery, handleSearch } = useSearchFilterUrlSync({
    currentQuery,
    onSearchNavigate,
  });

  const [selectedToggleFilters, setSelectedToggleFilters] = useState<Record<FilterKey, string>>({
    temas: "all",
    atualizacao: "all",
  });
  //const [currentSortKey, setCurrentSortKey] = useState("recentes");

  const handleToggleFilterChange = (filterKey: FilterKey, optionId: string) => {
    setSelectedToggleFilters((prev) => ({
      ...prev,
      [filterKey]: prev[filterKey] === optionId ? "all" : optionId,
    }));
  };

  // Advanced filters state
  const [filterTagOptions, setFilterTagOptions] = useState<{ id: string; name: string }[]>([]);
  const [filterSearchQueries, setFilterSearchQueries] = useState<Record<string, string>>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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
    if (paramName === "tag") {
      setSelectedTags((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
    }
  };

  const handleClearAdvancedFilter = (paramName: string) => {
    if (paramName === "tag") {
      setSelectedTags([]);
    }
  };

  const handleFilterSearchChange = (groupName: string, value: string) => {
    setFilterSearchQueries((prev) => ({ ...prev, [groupName]: value }));
    if (groupName === "Palavras-chave") handleTagSearch(value);
  };

  const getActiveValues = (paramName: string) => {
    if (paramName === "tag") return selectedTags;
    return [];
  };

  const advancedFilterGroups: {
    name: string;
    param: string;
    data: { id: string; name: string }[];
    searchable: boolean;
    suggest?: boolean;
  }[] = [
    {
      name: "Palavras-chave",
      param: "tag",
      data: filterTagOptions,
      searchable: true,
      suggest: true,
    },
  ];

  const filteredStories = stories.filter((story) => {
    const q = searchQuery.toLowerCase();
    if (
      q &&
      !story.title.toLowerCase().includes(q) &&
      !story.description.toLowerCase().includes(q)
    ) {
      return false;
    }

    // Toggle filter: temas
    if (selectedToggleFilters.temas !== "all" && story.theme !== selectedToggleFilters.temas) {
      return false;
    }

    // Advanced filter: tags (local state)
    if (selectedTags.length > 0 && !selectedTags.some((t) => story.tags.tag === t)) {
      return false;
    }

    // Filtro de atualização
    if (selectedToggleFilters.atualizacao === "30_days" && !daysAgo(story.createdAt, 30)) {
      return false;
    }
    if (selectedToggleFilters.atualizacao === "12_months" && !daysAgo(story.createdAt, 365)) {
      return false;
    }
    if (selectedToggleFilters.atualizacao === "3_years" && !daysAgo(story.createdAt, 365 * 3)) {
      return false;
    }

    return true;
  });

  //const sortValue = SORT_OPTIONS[currentSortKey] || "";
  const sortedStories = [...filteredStories].sort((a, b) => {
    //if (sortValue === "-views") return (b.metrics.views || 0) - (a.metrics.views || 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const total = sortedStories.length;
  const pageSize = 12;
  const pagedStories = sortedStories.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  /*const handleSortChange = useCallback((value: string) => {
    setCurrentSortKey(value);
  }, []);*/

  /*const sortDefault = (() => {
    const reverseMap: Record<string, string> = { "-views": "visualizados" };
    return reverseMap[initialFilters?.sort || ""] || "recentes";
  })();*/

  return (
    <div className="filters datastories flex min-h-screen flex-col bg-neutral-50 font-sans text-neutral-900">
      <main className="flex-grow bg-primary-50">
        <PageBanner
          title="Data Stories"
          backgroundImageUrl="/Banner/hero-bg.png"
          backgroundPosition="center right"
          breadcrumbItems={[
            { label: "Home", url: "/" },
            { label: "Data Stories", url: "/pages/datastories" },
          ]}
          subtitle={
            <p className="max-w-[592px] text-primary-100">
              {total === 0
                ? "Não existem resultados disponíveis para a sua pesquisa"
                : `Pesquise através de ${total} data stories em dados.gov.pt`}
            </p>
          }
        />

        {/* Search Filter */}
        <SearchFilter
          id="datastories-search"
          placeholder="Pesquisar data stories, temas..."
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          examplesText='Exemplos: "serviços públicos", "turismo", "territórios"'
        />

        {/* Main Content */}
        <div className="container mx-auto bg-primary-50 md:gap-32 xl:gap-64">
          {/* Results count + Sort toggles */}
          <div className="grid-filters grid gap-x-[32px] md:grid-cols-3 xl:grid-cols-12">
            <div className="flex flex-row items-end gap-24 py-16 pl-0 xl:col-span-5">
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
              <span className="whitespace-nowrap text-l-regular text-neutral-900">
                {total.toLocaleString("pt-PT")} Resultados
              </span>
            </div>
            {/*<div className="xl:col-span-7 flex items-center justify-end py-16">
              <ToggleGroup
                multiple={false}
                value={currentSortKey}
                onChange={(val) => {
                  const selected = val.length > 0 ? val[0] : "recentes";
                  if (selected !== currentSortKey) handleSortChange(selected);
                }}
              >
                {Object.entries(SORT_LABELS).map(([key, label]) => (
                  <Toggle key={key} value={key} aria-label={`Ordenar por ${label}`}>
                    {label}
                  </Toggle>
                ))}
              </ToggleGroup>
            </div>*/}
          </div>
          <div className="divider-neutral-200 mb-24" />

          <div
            className={`grid-filters grid gap-x-[32px] ${filtersOpen ? "md:grid-cols-3 xl:grid-cols-12" : ""}`}
          >
            {/* Sidebar */}
            {filtersOpen && (
              <div className="xl:col-span-5 xl:block">
                <div className="mb-[36px] mt-[36px] flex flex-col gap-32">
                  <h2 className="text-xl font-bold text-neutral-900">Filtros</h2>
                  {(Object.keys(TOGGLE_FILTERS) as FilterKey[]).map((filterKey) => {
                    const section = TOGGLE_FILTERS[filterKey];
                    return (
                      <div key={filterKey} className="flex max-w-[592px] flex-col gap-8 pr-32">
                        <h3 className="mb-8 text-base font-bold text-neutral-900">
                          {section.title}
                        </h3>
                        {section.options.map((option) => {
                          const isSelected = selectedToggleFilters[filterKey] === option.id;
                          return (
                            <Toggle
                              key={option.id}
                              id={`datastory-filter-${filterKey}-${option.id}`}
                              name={`datastory-filter-${filterKey}`}
                              value={option.id}
                              appearance="icon"
                              variant="primary"
                              checked={isSelected}
                              onChange={() => handleToggleFilterChange(filterKey, option.id)}
                              iconOnly={false}
                              fullWidth={true}
                              className="w-full"
                            >
                              <div className="text-sm flex items-center gap-12 font-bold">
                                <span
                                  className={
                                    isSelected
                                      ? "font-bold text-primary-600"
                                      : "font-bold text-neutral-900"
                                  }
                                >
                                  {option.label}
                                </span>
                                <Pill
                                  variant="neutral"
                                  appearance="outline"
                                  circular={false}
                                  className="text-xs ml-16 font-medium text-neutral-500"
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

                <h2 className="text-xl mb-[32px] mt-[36px] font-bold text-neutral-900">
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
                              className="text-xs mb-4 mt-4 cursor-pointer text-primary-500 underline hover:text-primary-700"
                            >
                              Limpar {group.name.toLowerCase()}
                            </button>
                          )}
                          {group.searchable && (
                            <div className="relative mb-4 mt-8">
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
                                className="w-5 h-5 pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 transform text-primary-500"
                                aria-hidden="true"
                              />
                            </div>
                          )}
                          <div
                            className={`flex flex-col gap-2 ${showScroll ? "max-h-[225px] overflow-y-auto" : ""}`}
                          >
                            {!group.suggest ? null : filteredData.length > 0 ? (
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

                <div className="mb-64 mt-32">
                  <Button
                    variant="primary"
                    appearance="outline"
                    onClick={() => {
                      setSelectedToggleFilters({ temas: "all", atualizacao: "all" });
                      setSearchQuery("");
                      //setCurrentSortKey("recentes");
                      setSelectedTags([]);
                      router.push("/pages/datastories");
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
                  className="agora-card-links-datasets-px0 grid gap-32"
                  style={{
                    gridTemplateColumns: filtersOpen
                      ? "repeat(1, minmax(0, 1fr))"
                      : "repeat(2, minmax(0, 1fr))",
                  }}
                >
                  {pagedStories.length > 0 ? (
                    pagedStories.map((story) => {
                      const timeAgo = formatDateToTimeAgo(story.createdAt);

                      return (
                        <div key={story.slug} className="h-full">
                          <CardLinks
                            onClick={() => router.push(`/pages/datastories/${story.slug}`)}
                            className="h-full cursor-pointer text-neutral-900"
                            variant="transparent"
                            image={{
                              src:
                                story.image && story.image[0]
                                  ? getAssets(story.image[0].id)
                                  : "/card-full-image.png",
                              alt: story.title,
                            }}
                            category={story.organizationName}
                            title={<div className="text-xl-bold underline">{story.title}</div>}
                            description={
                              <p className="text-sm mt-[8px] line-clamp-3 max-w-[592px] leading-relaxed text-neutral-900">
                                {formatHtmlParagraphs(story.description)}
                              </p>
                            }
                            date={<span className="font-[300]">Publicado há {timeAgo}</span>}
                            /*links={[
                              {
                                href: "#",
                                hasIcon: true,
                                leadingIcon: "agora-line-eye",
                                leadingIconHover: "agora-solid-eye",
                                trailingIcon: "",
                                trailingIconHover: "",
                                trailingIconActive: "",
                                children: story.metrics.views.toLocaleString("pt-PT"),
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
                                children: `${story.datasets.length} datasets`,
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
                                children: story.metrics.followers,
                                title: "Favoritos",
                                onClick: (e: React.MouseEvent) => e.preventDefault(),
                                className: "text-[#034AD8]",
                              },
                            ]}*/
                            mainLink={
                              <Link href={`/pages/datastories/${story.slug}`}>
                                <span className="underline">{story.title}</span>
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
                          <Icon name="agora-line-search" className="h-12 w-12 text-primary-500" />
                        }
                        title="Não encontrou nenhuma data story?"
                        subtitle={
                          <span className="font-bold">
                            Tente redefinir os filtros para ampliar sua busca.
                          </span>
                        }
                        description="Explore a nossa lista completa de data stories."
                        position="center"
                        hasAnchor={true}
                        valueAnchor="Redefinir filtros"
                        anchorHref="/pages/datastories"
                        anchorTrailingIcon="agora-line-arrow-right-circle"
                        anchorTrailingIconHover="agora-solid-arrow-right-circle"
                      />
                    </div>
                  )}
                </div>

                {/* Pagination */}
                <div className="mt-8 flex justify-center pb-64">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={total}
                    pageSize={pageSize}
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
