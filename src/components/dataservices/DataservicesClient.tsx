"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Icon,
  CardNoResults,
  Button,
  CardLinks,
  ToggleGroup,
  Toggle,
} from "@ama-pt/agora-design-system";
import { twJoin } from "tailwind-merge";
import { Pagination } from "@/components/Pagination";
import { DataservicesFilters } from "@/components/dataservices/DataservicesFilters";
import SearchFilter from "@/components/Shared/SearchFilter";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { Dataservice } from "@/service/types/dataservice";
import { APIResponse } from "@/service/types/shared";
import { FrontOfficePage } from "@/service/types/shared/common";
import { Hero } from "@/components/Shared/Hero";
import { formatDateToTimeAgo } from "@/utils/formatDate";
import { useDataservicesListing } from "@/hooks/useDataservicesListing";
import { useTranslation } from "react-i18next";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";

interface DataservicesClientProps {
  initialData: APIResponse<Dataservice>;
  currentPage: number;
  /** Optional: the CMS is the source of truth, the `dataservices` namespace is the fallback. */
  pageContent?: FrontOfficePage;
}

export default function DataservicesClient({
  initialData,
  currentPage,
  pageContent,
}: DataservicesClientProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation("common");
  const { t: tDs } = useTranslation("dataservices");
  const { language } = i18n;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const {
    activePage,
    buildUrl,
    handleSearch,
    handleSortChange,
    listData,
    searchQuery,
    setSearchQuery,
    sortDefault,
  } = useDataservicesListing({ initialData, currentPage });

  const { data: dataservices, total, page_size } = listData;

  const DATASERVICE_SORT_LABELS: Record<string, string> = {
    relevancia: tDs("sort.relevancia"),
    recentes: tDs("sort.recentes"),
  };

  return (
    <main className="flex w-full flex-col items-center justify-center gap-32 bg-primary-50">
      <Hero.Root>
        <Hero.Breadcrumb />
        <Hero.Content>
          <Hero.Title>{pageContent?.hero?.title ?? tDs("hero.title")}</Hero.Title>
          <Hero.Description
            description={
              <div className="max-w-[592px] text-primary-100">
                <p>
                  {total === 0
                    ? tDs("hero.subtitleEmpty")
                    : tDs("hero.subtitleCount", { count: total })}
                </p>
                <div className="mt-8">
                  {stripHtmlTags(pageContent?.hero?.description ?? tDs("hero.subtitleText"))}
                </div>
              </div>
            }
          />
        </Hero.Content>
        <Hero.Actions>
          <PublishDropdown darkMode={true} outline={false} />
        </Hero.Actions>
      </Hero.Root>

      {/* Search Filter */}
      <SearchFilter
        id="dataservices-search"
        placeholder={pageContent?.search?.placeholder ?? tDs("search.placeholder")}
        value={searchQuery}
        onChange={setSearchQuery}
        onSearch={handleSearch}
        examplesText={tDs("search.examples")}
      />

      {/* Main Content */}
      <div className="container flex flex-col items-center justify-center gap-24 py-32">
        {/* Filters toggle + results count + sort */}
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
              {filtersOpen ? t("filters.hideFilters") : t("filters.openFilters")}
            </Button>
            <span className="whitespace-nowrap text-l-regular text-neutral-900">
              {t("results", { count: total })}
            </span>
          </div>
          <div className="flex w-full items-center xl:justify-end">
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
              {Object.entries(DATASERVICE_SORT_LABELS).map(([key, label]) => (
                <Toggle key={key} value={key} aria-label={tDs("sort.ariaLabel", { label })}>
                  {label}
                </Toggle>
              ))}
            </ToggleGroup>
          </div>
        </div>
        <div className="divider-neutral-200 mb-24 w-full" />
        <div className={twJoin("grid w-full gap-32", filtersOpen ? "grid-cols-12" : "")}>
          {/* Sidebar */}
          {filtersOpen && (
            <div className="col-span-4">
              <DataservicesFilters />
            </div>
          )}

          {/* Results Area */}
          <div className={filtersOpen ? "col-span-8" : "col-span-full"}>
            <div
              className={twJoin(
                "grid gap-32",
                filtersOpen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
              )}
            >
              {dataservices.length > 0 ? (
                dataservices.map((ds) => {
                  const timeAgo = formatDateToTimeAgo(
                    ds.last_modified || ds.created_at,
                    language as "pt" | "en"
                  );
                  const dsUrl = `/dataservices/${ds.slug}`;

                  return (
                    <div key={ds.id} className="h-full">
                      <CardLinks
                        onClick={() => router.push(dsUrl)}
                        className="!h-full cursor-pointer text-neutral-900 [&_.card-links-container]:!h-full [&_.content]:!flex-col [&_.content]:xl:!flex-row-reverse"
                        variant="transparent"
                        image={{
                          src: ds.organization?.logo || "/images/placeholders/organization.png",
                          alt: ds.title,
                        }}
                        category={ds.organization?.name || t("card.api")}
                        title={<div className="text-xl-bold underline">{ds.title}</div>}
                        description={
                          ds.description ? (
                            <p className="text-sm mt-[8px] line-clamp-3 max-w-[592px] leading-relaxed text-neutral-900">
                              {ds.description}
                            </p>
                          ) : undefined
                        }
                        date={
                          <span className="font-[300]">
                            {t("card.updatedAgo", { date: timeAgo })}
                          </span>
                        }
                        links={[
                          {
                            href: "#",
                            hasIcon: true,
                            leadingIcon: "agora-line-eye",
                            leadingIconHover: "agora-solid-eye",
                            trailingIcon: "",
                            trailingIconHover: "",
                            trailingIconActive: "",
                            children: ds.metrics?.views?.toLocaleString("pt-PT") || "0",
                            title: t("card.views"),
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
                            children: t("card.datasetsCount", { count: ds.datasets?.total ?? 0 }),
                            title: t("card.datasets"),
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
                            children: ds.metrics?.followers || 0,
                            title: t("card.favorites"),
                            onClick: (e: MouseEvent) => e.preventDefault(),
                            className: "text-[#034AD8]",
                          },
                        ]}
                        mainLink={
                          <Link href={dsUrl}>
                            <span className="underline">{ds.title}</span>
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
                        name="agora-line-search"
                        className="icon-xl h-12 w-12 text-primary-500"
                      />
                    }
                    title={pageContent?.noResults?.title ?? tDs("noResults.title")}
                    subtitle={
                      <span className="font-bold">
                        {pageContent?.noResults?.subtitle ?? tDs("noResults.subtitle")}
                      </span>
                    }
                    description={
                      <div className="mx-auto max-w-[592px]">
                        {pageContent?.noResults?.description ?? tDs("noResults.description")}
                      </div>
                    }
                    position="center"
                    hasAnchor={false}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex w-1/2 justify-center">
          <Pagination
            currentPage={activePage}
            totalItems={total}
            pageSize={page_size}
            baseUrl={buildUrl()}
          />
        </div>
      </div>
    </main>
  );
}
