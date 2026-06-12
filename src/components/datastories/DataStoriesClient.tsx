"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CardLinks, Button, Icon, CardNoResults } from "@ama-pt/agora-design-system";
import { Pagination } from "@/components/Pagination";
import HeroGeneral from "@/components/HeroGeneral";
import SearchFilter from "@/components/Shared/SearchFilter";
import { Datastories } from "@/service/types/datastories/datastories";
import { DataStoriesFilterState } from "@/service/types/datastories/filters";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { getAssets } from "@/utils/getAssets";
import { formatDateToTimeAgo } from "@/utils/formatDate";
import { DataStoriesFilters } from "@/components/datastories/DataStoriesFilters";
import { DATA_STORIES_PAGE_SIZE } from "@/utils/dataStoriesListingQuery";
import { useDataStoriesListing } from "@/hooks/useDataStoriesListing";
import { twJoin } from "tailwind-merge";

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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<DataStoriesFilterState>({
    toggles: { temas: "all", atualizacao: "all" },
    tags: [],
  });

  const {
    activePage,
    buildUrl,
    handleSearch,
    pagedStories,
    replaceWith,
    searchQuery,
    setSearchQuery,
    total,
  } = useDataStoriesListing({
    currentPage,
    initialQuery: initialFilters?.q,
    stories,
    activeFilters,
  });

  return (
    <main className="w-full flex flex-col justify-center items-center bg-primary-50 gap-32">
      <HeroGeneral
        title="Data Stories"
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
      <div className="container flex flex-col gap-24 justify-center items-center py-32">
        {/* Results count + Sort toggles */}
        <div className="w-full flex xl:flex-row flex-col gap-16">
          <div className="w-full flex flex-row items-end gap-32 ">
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
        </div>
        <div className="divider-neutral-200 mb-24" />
        <div
          className={`grid gap-32 w-full ${filtersOpen ? "grid-cols-12" : ""}`}
        >
          {/* Sidebar */}
          {filtersOpen && (
            <DataStoriesFilters
              stories={stories}
              onFiltersChange={setActiveFilters}
              onClearSearch={() => {
                setSearchQuery("");
                replaceWith({ q: null, page: 1 });
              }}
            />
          )}

          {/* Results Area */}
          <div className={filtersOpen ? "col-span-8" : "col-span-full"}>
            <div
              className={twJoin("grid gap-32", filtersOpen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2")}
            >
              {pagedStories.length > 0 ? (
                pagedStories.map((story) => {
                  const timeAgo = formatDateToTimeAgo(story.createdAt);
                  return (
                    <div key={story.slug} className="h-full">
                      <CardLinks
                        onClick={() => router.push(`/pages/datastories/${story.slug}`)}
                        className="!h-full [&_.card-links-container]:!h-full [&_.text-content]:!w-full [&_.content]:!flex-col [&_.content]:xl:!flex-row-reverse cursor-pointer text-neutral-900"
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
                          <p className="text-sm mt-8 line-clamp-3 max-w-[592px] leading-relaxed text-neutral-900">
                            {formatHtmlParagraphs(story.description)}
                          </p>
                        }
                        date={<span className="font-[300]">Publicado há {timeAgo}</span>}
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
                currentPage={activePage}
                totalItems={total}
                pageSize={DATA_STORIES_PAGE_SIZE}
                baseUrl={buildUrl()}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
