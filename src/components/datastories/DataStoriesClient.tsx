"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CardLinks,
  Button,
  Icon,
  CardNoResults,
  // ToggleGroup,
  // Toggle,
} from "@ama-pt/agora-design-system";
import { Pagination } from "@/components/Pagination";
import PageBanner from "@/components/PageBanner";
import SearchFilter from "@/components/Shared/SearchFilter";
import { useSearchFilterUrlSync } from "@/hooks/useSearchFilterUrlSync";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { Datastories } from "@/types/datastories/datastories";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { getAssets } from "@/utils/getAssets";
import {
  DataStoriesFilterState,
  DataStoriesFilters,
} from "@/components/datastories/DataStoriesFilters";

/* const SORT_OPTIONS: Record<string, string> = {
  recentes: "",
  visualizados: "-views",
};

const SORT_LABELS: Record<string, string> = {
  recentes: "Mais recentes",
  visualizados: "Mais visualizados",
}; */

const PAGE_SIZE = 12;

const daysAgo = (dateStr: string, days: number) =>
  (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24) <= days;

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const stories = Array.isArray(datastories) ? datastories : [];

  const activePage = Number(searchParams.get("page") || String(currentPage || 1));
  const currentQuery = searchParams.get("q") || initialFilters?.q || "";
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [activeFilters, setActiveFilters] = useState<DataStoriesFilterState>({
    toggles: { temas: "all", atualizacao: "all" },
    tags: [],
  });

  const getLiveParams = useCallback(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams(Array.from(searchParams.entries()));
  }, [searchParams]);

  const buildUrl = useCallback(
    (overrides: { q?: string | null; page?: number } = {}) => {
      const params = getLiveParams();

      if ("q" in overrides) {
        if (overrides.q) params.set("q", overrides.q);
        else params.delete("q");
      }

      if ("page" in overrides) {
        if (overrides.page && overrides.page > 1) params.set("page", String(overrides.page));
        else params.delete("page");
      } else if (activePage > 1) {
        params.set("page", String(activePage));
      }

      params.sort();
      const qs = params.toString();
      return `${pathname}${qs ? `?${qs}` : ""}`;
    },
    [activePage, getLiveParams, pathname]
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

  // const [currentSortKey, setCurrentSortKey] = useState("recentes");

  const filteredStories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return stories.filter((story) => {
      if (
        q &&
        !story.title.toLowerCase().includes(q) &&
        !story.description.toLowerCase().includes(q)
      ) {
        return false;
      }

      if (activeFilters.toggles.temas !== "all" && story.theme !== activeFilters.toggles.temas) {
        return false;
      }

      if (
        activeFilters.tags.length > 0 &&
        !activeFilters.tags.some((tag) => story.tags.tag === tag)
      ) {
        return false;
      }

      if (activeFilters.toggles.atualizacao === "30_days" && !daysAgo(story.createdAt, 30)) {
        return false;
      }
      if (activeFilters.toggles.atualizacao === "12_months" && !daysAgo(story.createdAt, 365)) {
        return false;
      }
      if (activeFilters.toggles.atualizacao === "3_years" && !daysAgo(story.createdAt, 365 * 3)) {
        return false;
      }

      return true;
    });
  }, [activeFilters, searchQuery, stories]);

  const sortedStories = useMemo(
    () =>
      [...filteredStories].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [filteredStories]
  );

  const total = sortedStories.length;

  const pagedStories = useMemo(
    () => sortedStories.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE),
    [activePage, sortedStories]
  );

  // const sortValue = SORT_OPTIONS[currentSortKey] || "";

  /* const handleSortChange = useCallback((value: string) => {
    setCurrentSortKey(value);
  }, []); */

  /* const sortDefault = (() => {
    const reverseMap: Record<string, string> = { "-views": "visualizados" };
    return reverseMap[initialFilters?.sort || ""] || "recentes";
  })(); */

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
                ? "Nao existem resultados disponiveis para a sua pesquisa"
                : `Pesquise atraves de ${total} data stories em dados.gov.pt`}
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
          examplesText='Exemplos: "servicos publicos", "turismo", "territorios"'
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
            {/* <div className="xl:col-span-7 flex items-center justify-end py-16">
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
            </div> */}
          </div>
          <div className="divider-neutral-200 mb-24" />

          <div
            className={`grid grid-filters gap-x-[32px] ${filtersOpen ? "md:grid-cols-3 xl:grid-cols-12" : ""}`}
          >
            {/* Sidebar */}
            {filtersOpen && (
              <DataStoriesFilters
                stories={stories}
                onFiltersChange={setActiveFilters}
                onClearSearch={() => {
                  setSearchQuery("");
                  router.replace(buildUrl({ q: null, page: 1 }), { scroll: false });
                }}
              />
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
                            image={{
                              src:
                                story.image && story.image[0]
                                  ? getAssets(story.image[0].id)
                                  : "/card-full-image.png",
                              alt: story.title,
                            }}
                            category={story.organizationName}
                            title={<div className="underline text-xl-bold">{story.title}</div>}
                            description={
                              <p className="text-sm line-clamp-3 leading-relaxed text-neutral-900 mt-[8px] max-w-[592px]">
                                {formatHtmlParagraphs(story.description)}
                              </p>
                            }
                            date={<span className="font-[300]">Publicado ha {timeAgo}</span>}
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
                                title: "Visualizacoes",
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
                        title="Nao encontrou nenhuma data story?"
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
                    currentPage={activePage}
                    totalItems={total}
                    pageSize={PAGE_SIZE}
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
