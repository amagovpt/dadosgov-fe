"use client";

import { useState } from "react";
import { Button, Icon, ToggleGroup, Toggle, CardNoResults } from "@ama-pt/agora-design-system";
import { Pagination } from "@/components/Pagination";
import { OrganizationsFilters } from "./OrganizationsFilters";
import SearchFilter from "@/components/Shared/SearchFilter";
import { OrgBadges, Organization } from "@/service/types/identity";
import { APIResponse } from "@/service/types/shared";
import PublishDropdown from "@/components/admin/PublishDropdown";

import HeroGeneral from "@/components/HeroGeneral";
import CardMetrics, { CardMetricsProps } from "../Primitives/Cards/CardMetrics";
import { OrganizationBadges } from "@/components/organizations/OrganizationBadges";
import { formatDateToTimeAgo } from "@/utils/formatDate";
import { useOrganizationsListing } from "@/hooks/useOrganizationsListing";
import { twJoin } from "tailwind-merge";
import ListingErrorBanner from "@/components/Shared/ListingErrorBanner";
import { useTranslation } from "react-i18next";
import { FrontOfficePage } from "@/service/types/shared/common";

interface OrganizationsClientProps {
  initialData: APIResponse<Organization>;
  currentPage: number;
  orgBadges: OrgBadges;
  orgBadgeCounts: Record<string, number>;
  allOrganizations?: Organization[];
  /** Optional: the CMS is the source of truth, the `organizations` namespace is the fallback. */
  pageContent?: FrontOfficePage;
}

export default function OrganizationsClient({
  initialData,
  currentPage,
  orgBadges,
  orgBadgeCounts,
  allOrganizations,
  pageContent,
}: OrganizationsClientProps) {
  const { t, i18n } = useTranslation("common");
  const { t: tOrg } = useTranslation("organizations");
  const { language } = i18n;

  const ORGANIZATION_SORT_LABELS: Record<string, string> = {
    relevancia: tOrg("sort.relevancia"),
    mais_dados: tOrg("sort.mais_dados"),
    mais_reutilizacoes: tOrg("sort.mais_reutilizacoes"),
    subscritores: tOrg("sort.subscritores"),
  };

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
  } = useOrganizationsListing({ initialData, currentPage });

  const { data: organizations, total, page_size } = listData;

  return (
    <main className="flex w-full flex-col items-center justify-center gap-32 bg-primary-50">
      <HeroGeneral
        title={pageContent?.hero?.title ?? tOrg("hero.title")}
        subtitle={
          <p className="max-w-[592px] text-primary-100">
            {pageContent?.hero?.subtitle ?? tOrg("hero.subtitle")}
          </p>
        }
      >
        <PublishDropdown darkMode={true} outline={false} />
      </HeroGeneral>

      {/* Search Filter */}
      <SearchFilter
        id="organizations-search"
        placeholder={pageContent?.search?.placeholder ?? tOrg("search.placeholder")}
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
              {Object.entries(ORGANIZATION_SORT_LABELS).map(([key, label]) => (
                <Toggle key={key} value={key} aria-label={tOrg("sort.ariaLabel", { label })}>
                  {label}
                </Toggle>
              ))}
            </ToggleGroup>
          </div>
        </div>
        <div className="divider-neutral-200 mb-24" />
        <div className={twJoin("grid w-full gap-32", filtersOpen ? "grid-cols-12" : "")}>
          {/* Sidebar */}
          {filtersOpen && (
            <div className="col-span-4">
              <OrganizationsFilters
                orgBadges={orgBadges}
                orgBadgeCounts={orgBadgeCounts}
                allOrganizations={allOrganizations}
              />
            </div>
          )}

          {/* Results Area */}
          <div className={filtersOpen ? "col-span-8" : "col-span-full"}>
            <div>
              <div
                className={twJoin(
                  "grid gap-32",
                  filtersOpen
                    ? "grid-cols-1 lg:grid-cols-2"
                    : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
                )}
              >
                {listData.error ? (
                  <ListingErrorBanner
                    entity={tOrg("theOrganizations")}
                    errorStatus={listData.errorStatus}
                  />
                ) : organizations.length > 0 ? (
                  organizations.map((org) => {
                    const timeAgo = formatDateToTimeAgo(
                      org.last_modified,
                      language as "pt" | "en"
                    );
                    const cardProps: CardMetricsProps = {
                      title: org.name,
                      description: org.description ?? "",
                      link: `/organizations/${org.slug}`,
                      last_modified: timeAgo,
                      organization: {
                        name: org.name,
                        logo: org.logo ?? undefined,
                      },
                      metrics: {
                        views: org.metrics.views,
                        resources_downloads: org.metrics.resource_downloads,
                        reuses: org.metrics.reuses,
                        followers: org.metrics.followers,
                      },
                      titleBadges: <OrganizationBadges badges={org.badges} />,
                    };
                    return <CardMetrics key={`org-${org.slug}`} {...cardProps} hideProgressBar />;
                  })
                ) : (
                  <div className="col-span-full">
                    <CardNoResults
                      icon={
                        <Icon
                          name={pageContent?.noResults?.icon ?? "agora-line-search"}
                          className="h-12 w-12 text-primary-500"
                        />
                      }
                      title={pageContent?.noResults?.title ?? tOrg("noResults.title")}
                      subtitle={
                        <span className="font-bold">
                          {pageContent?.noResults?.subtitle ?? tOrg("noResults.subtitle")}
                        </span>
                      }
                      description={
                        <div className="mx-auto max-w-[592px]">
                          {pageContent?.noResults?.description ?? tOrg("noResults.description")}
                        </div>
                      }
                      position="center"
                      hasAnchor={false}
                    />
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-center pb-64">
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
  );
}
