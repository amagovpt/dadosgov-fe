"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
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
import { Organization } from "@/service/types/identity";
import { Reuse } from "@/service/types/reuse";
import { APIResponse } from "@/service/types/shared";
import HeroGeneral from "@/components/HeroGeneral";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { ReusesFilters } from "@/components/reuses/ReusesFilters";
import { useReusesListing } from "@/hooks/useReusesListing";
import { formatDateToTimeAgo } from "@/utils/formatDate";
import { twJoin } from "tailwind-merge";
import ListingErrorBanner from "@/components/Shared/ListingErrorBanner";
import { useTranslation } from "react-i18next";
import { FrontOfficePage } from "@/service/types/shared/common";

interface ReusesClientProps {
  initialData: APIResponse<Reuse>;
  currentPage: number;
  filterCounts?: Record<string, number>;
  allOrganizations?: Organization[];
  pageContent?: FrontOfficePage;
}

export default function ReusesClient({
  initialData,
  currentPage,
  filterCounts = {},
  allOrganizations = [],
  pageContent,
}: ReusesClientProps) {
  const { t, i18n } = useTranslation("common");
  const { t: tr } = useTranslation("reuses");

  const { language } = i18n;

  const REUSE_SORT_LABELS: Record<string, string> = {
    relevancia: tr("sort.relevancia"),
    recentes: tr("sort.recentes"),
    antigos: tr("sort.antigos"),
    subscritores: tr("sort.subscritores"),
  };

  const router = useRouter();

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
  } = useReusesListing({ initialData, currentPage });

  const { data: reuses, total, page_size } = listData;

  return (
    <main className="flex w-full flex-col items-center justify-center gap-32 bg-primary-50">
      <HeroGeneral
        title={pageContent?.hero.title ?? t("reuses")}
        breadcrumbItems={[
          { label: t("home"), url: "/" },
          { label: t("reuses"), url: "/reuses" },
        ]}
        subtitle={<p className="max-w-[592px] text-primary-100">{pageContent?.hero.subtitle ?? tr("hero.subtitle")}</p>}
      >
        <PublishDropdown darkMode={true} outline={false} />
      </HeroGeneral>

      {/* Search Filter */}
      <SearchFilter
        id="reuses-search"
        placeholder={tr("search.placeholder")}
        value={searchQuery}
        onChange={setSearchQuery}
        onSearch={handleSearch}
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
              {Object.entries(REUSE_SORT_LABELS).map(([key, label]) => (
                <Toggle key={key} value={key} aria-label={tr("sort.ariaLabel", { label })}>
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
              <ReusesFilters filterCounts={filterCounts} allOrganizations={allOrganizations} />
            </div>
          )}

          {/* Results Area */}
          <div className={filtersOpen ? "col-span-8" : "col-span-full"}>
            <div>
              <div
                className={twJoin(
                  "grid gap-32",
                  filtersOpen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
                )}
              >
                {listData.error ? (
                  <ListingErrorBanner
                    entity={tr("theReuses")}
                    errorStatus={listData.errorStatus}
                  />
                ) : reuses.length > 0 ? (
                  reuses.map((reuse) => {
                    const timeAgo = formatDateToTimeAgo(reuse.last_modified || reuse.created_at, language as "pt" | "en");
                    return (
                      <div key={reuse.id} className="h-full">
                        <CardLinks
                          onClick={() => router.push(`/reuses/${reuse.slug}`)}
                          className="!h-full cursor-pointer text-neutral-900 [&_.card-links-container]:!h-full [&_.content]:!flex-col [&_.content]:xl:!flex-row-reverse"
                          variant="transparent"
                          image={{
                            src: reuse.image_thumbnail || reuse.image || "/laptop.png",
                            alt: reuse.title,
                          }}
                          category={reuse.organization?.name || tr("card.category")}
                          title={<div className="text-xl-bold underline">{reuse.title}</div>}
                          description={
                            reuse.description ? (
                              <p className="text-sm mt-[8px] line-clamp-3 max-w-[592px] leading-relaxed text-neutral-900">
                                {reuse.description}
                              </p>
                            ) : undefined
                          }
                          date={
                            <span className="font-[300]">{tr("card.updatedAgo", { timeAgo })}</span>
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
                              children: reuse.metrics?.views?.toLocaleString("pt-PT") || "0",
                              title: tr("card.views"),
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
                              children: tr("card.datasetsCount", {
                                count: reuse.datasets?.length || 0,
                              }),
                              title: tr("card.datasets"),
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
                              title: tr("card.favorites"),
                              onClick: (e: MouseEvent) => e.preventDefault(),
                              className: "text-[#034AD8]",
                            },
                          ]}
                          mainLink={
                            <Link href={`/reuses/${reuse.slug}`}>
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
                        <Icon name={pageContent?.noResults.icon ?? "agora-line-search"} className="h-12 w-12 text-primary-500" />
                      }
                      title={pageContent?.noResults.title ?? tr("noResults.title")}
                      subtitle={<span className="font-bold">{pageContent?.noResults.subtitle ?? tr("noResults.subtitle")}</span>}
                      description={pageContent?.noResults.description ?? tr("noResults.description")}
                      position="center"
                      hasAnchor={true}
                      valueAnchor={t("filters.reset")}
                      anchorTarget="_self"
                      anchorHref="/reuses"
                      anchorTrailingIcon="agora-line-arrow-right-circle"
                      anchorTrailingIconHover="agora-solid-arrow-right-circle"
                    />
                  </div>
                )}
              </div>
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
