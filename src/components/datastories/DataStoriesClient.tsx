"use client";

import { useState, useCallback, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CardLinks,
  Button,
  Icon,
  CardNoResults,
  //ToggleGroup,
} from "@ama-pt/agora-design-system";
import { Pagination } from "@/components/Pagination";
import PageBanner from "@/components/PageBanner";
import SearchFilter from '@/components/Shared/SearchFilter';
import { useSearchFilterUrlSync } from "@/hooks/useSearchFilterUrlSync";
import { suggestTags } from "@/services/api";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { Datastories } from "@/types/datastories/datastories";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { getAssets } from "@/utils/getAssets";
import {
  AdvancedFilterGroup,
  AdvancedFiltersSidebar,
} from "@/components/filters/AdvancedFiltersSidebar";
import {
  ToggleFilterSection,
  ToggleFilterSections,
} from "@/components/filters/ToggleFilterSections";

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

  const toggleSections: ToggleFilterSection[] = [
    {
      key: "temas",
      title: TOGGLE_FILTERS.temas.title,
      options: [{ id: "all", label: "Todos", count: stories.length }, ...TOGGLE_FILTERS.temas.options],
    },
    {
      key: "atualizacao",
      title: TOGGLE_FILTERS.atualizacao.title,
      options: TOGGLE_FILTERS.atualizacao.options.map((option) => ({
        id: option.id,
        label: option.label,
        count: option.count,
      })),
    },
  ];

  const advancedFilterGroups: AdvancedFilterGroup[] = [
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
    <div className="min-h-screen flex flex-col font-sans text-neutral-900 bg-neutral-50 filters datastories">
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
            <p className="text-primary-100 max-w-[592px]">
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
            className={`grid grid-filters gap-x-[32px] ${filtersOpen ? "md:grid-cols-3 xl:grid-cols-12" : ""}`}
          >
            {/* Sidebar */}
            {filtersOpen && (
              <div className="xl:col-span-5 xl:block">
                <ToggleFilterSections
                  sections={toggleSections}
                  selectedValues={selectedToggleFilters}
                  onChange={(sectionKey, optionId) =>
                    handleToggleFilterChange(sectionKey as FilterKey, optionId)
                  }
                  idPrefix="datastory-filter"
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
                  checkboxIdPrefix="datastory"
                />

                <div className="mt-32 mb-64">
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
                  className="grid agora-card-links-datasets-px0 gap-32"
                  style={{
                    gridTemplateColumns: filtersOpen
                      ? "repeat(1, minmax(0, 1fr))"
                      : "repeat(2, minmax(0, 1fr))",
                  }}
                >
                  {pagedStories.length > 0 ? (
                    pagedStories.map((story) => {
                      const timeAgo = story.createdAt
                        ? formatDistanceToNow(new Date(story.createdAt), { locale: pt })
                          .replace("aproximadamente ", "")
                          .replace("quase ", "")
                          .replace("menos de ", "")
                          .replace("cerca de ", "")
                        : "Desconhecido";

                      return (
                        <div key={story.slug} className="h-full">
                          <CardLinks
                            onClick={() => router.push(`/pages/datastories/${story.slug}`)}
                            className="cursor-pointer text-neutral-900 h-full"
                            variant="transparent"
                            image={{ src: story.image && story.image[0] ? getAssets(story.image[0].id) : "/card-full-image.png", alt: story.title }}
                            category={story.organizationName}
                            title={<div className="underline text-xl-bold">{story.title}</div>}
                            description={
                              <p className="text-sm line-clamp-3 leading-relaxed text-neutral-900 mt-[8px] max-w-[592px]">
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
                                children: `${story.datasets.length} datasets`,
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
                                children: story.metrics.followers,
                                title: "Favoritos",
                                onClick: (e: MouseEvent) => e.preventDefault(),
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
                          <Icon name="agora-line-search" className="w-12 h-12 text-primary-500" />
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
                <div className="pb-64 mt-8 flex justify-center">
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
