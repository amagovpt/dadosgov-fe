"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CardLinks, Button, Icon, CardNoResults } from "@ama-pt/agora-design-system";
import { Pagination } from "@/components/Pagination";
import HeroGeneral from "@/components/HeroGeneral";
import SearchFilter from "@/components/Shared/SearchFilter";
import { Datastories, DataStoriesPage } from "@/service/types/datastories/datastories";
import { DataStoriesFilterState } from "@/service/types/datastories/filters";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { getAssets } from "@/utils/getAssets";
import { formatDateToTimeAgo } from "@/utils/formatDate";
import { DataStoriesFilters } from "@/components/datastories/DataStoriesFilters";
import { DATA_STORIES_PAGE_SIZE } from "@/utils/dataStoriesListingQuery";
import { useDataStoriesListing } from "@/hooks/useDataStoriesListing";
import { twJoin } from "tailwind-merge";
import { useTranslation } from "react-i18next";

interface DataStoriesClientProps {
  currentPage: number;
  initialFilters?: { q?: string; sort?: string };
  pageContent: DataStoriesPage;
  datastories: Datastories;
}

export default function DataStoriesClient({
  currentPage,
  initialFilters,
  pageContent,
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
  const { t } = useTranslation("common");

  return (
    <main className="flex w-full flex-col items-center justify-center gap-32 bg-primary-50">
      <HeroGeneral
        title={pageContent.hero.title}
        breadcrumbItems={[
          { label: t("home"), url: "/" },
          { label: t("datastories"), url: "/datastories" },
        ]}
        subtitle={formatHtmlParagraphs(pageContent.hero.description) as string[]}
      />

      {/* Search Filter */}
      <SearchFilter
        id="datastories-search"
        label={pageContent.search.label}
        placeholder={pageContent.search.placeholder}
        value={searchQuery}
        onChange={setSearchQuery}
        onSearch={handleSearch}
        examplesText={pageContent.search.hint}
      />
      {/* Main Content */}
      <div className="container flex flex-col items-center justify-center gap-24 py-32">
        {/* Results count + Sort toggles */}
        <div className="flex w-full flex-col gap-16 xl:flex-row">
          <div className="flex w-full flex-row items-end gap-32">
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
        <div className={`grid w-full gap-32 ${filtersOpen ? "grid-cols-12" : ""}`}>
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
              className={twJoin(
                "grid gap-32",
                filtersOpen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
              )}
            >
              {pagedStories.length > 0 ? (
                pagedStories.map((story) => {
                  const timeAgo = formatDateToTimeAgo(story.createdAt);
                  return (
                    <div key={story.slug} className="h-full">
                      <CardLinks
                        onClick={() => router.push(`/datastories/${story.slug}`)}
                        className="!h-full cursor-pointer text-neutral-900 [&_.card-links-container]:!h-full [&_.content]:!flex-col [&_.content]:xl:!flex-row-reverse [&_.text-content]:!w-full"
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
                          <Link href={`/datastories/${story.slug}`}>
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
                      <Icon
                        name={pageContent.noResults.icon ?? "agora-line-search"}
                        className="h-12 w-12 text-primary-500"
                      />
                    }
                    title={pageContent.noResults.title}
                    subtitle={<span className="font-bold">{pageContent.noResults.subtitle}</span>}
                    description={pageContent.noResults.description}
                    position="center"
                    hasAnchor={true}
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
