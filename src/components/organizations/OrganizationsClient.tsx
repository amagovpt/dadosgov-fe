"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon, ToggleGroup, Toggle, CardNoResults } from "@ama-pt/agora-design-system";
import { Pagination } from "@/components/Pagination";
import { OrganizationsFilters } from "./OrganizationsFilters";
import SearchFilter from "@/components/Shared/SearchFilter";
import { OrgBadges, Organization } from "@/service/types/identity";
import { APIResponse } from "@/service/types/shared";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

import HeroGeneral from "@/components/HeroGeneral";
import CardMetrics, { CardMetricsProps } from "../Primitives/Cards/CardMetrics";
import { OrganizationBadges } from "@/components/organizations/OrganizationBadges";
import { formatDateToTimeAgo } from "@/utils/formatDate";
import { useOrganizationsListing } from "@/hooks/useOrganizationsListing";
import { ORGANIZATION_SORT_LABELS } from "@/utils/organizationsListingQuery";
import { twJoin } from "tailwind-merge";
import ListingErrorBanner from "@/components/Shared/ListingErrorBanner";
import { useTranslation } from "react-i18next";

interface OrganizationsClientProps {
  initialData: APIResponse<Organization>;
  currentPage: number;
  orgBadges: OrgBadges;
  orgBadgeCounts: Record<string, number>;
  allOrganizations?: Organization[];
}

export default function OrganizationsClient({
  initialData,
  currentPage,
  orgBadges,
  orgBadgeCounts,
  allOrganizations,
}: OrganizationsClientProps) {
  const { t } = useTranslation("common");

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
        title="Organizações"
        breadcrumbItems={[
          { label: "Início", url: "/" },
          { label: "Organizações", url: "/organizations" },
        ]}
        subtitle={
          <p className="max-w-[592px] text-primary-100">
            Conheça as organizações que partilham dados abertos connosco e explore os recursos que
            disponibilizam.
          </p>
        }
      >
        <PublishDropdown darkMode={true} outline={false} />
      </HeroGeneral>

      {/* Search Filter */}
      <SearchFilter
        id="organizations-search"
        placeholder="Pesquisar organizações..."
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
              {filtersOpen ? "Ocultar filtros" : "Abrir filtros"}
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
                <Toggle key={key} value={key} aria-label={`Ordenar por ${label}`}>
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
                  <ListingErrorBanner entity="as organizações" errorStatus={listData.errorStatus} />
                ) : organizations.length > 0 ? (
                  organizations.map((org) => {
                    const timeAgo = formatDateToTimeAgo(org.last_modified);
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
                        <Icon name="agora-line-search" className="h-12 w-12 text-primary-500" />
                      }
                      title="Nenhuma organização encontrada"
                      subtitle={
                        <span className="font-bold">
                          Não existem organizações que correspondam aos filtros aplicados.
                        </span>
                      }
                      description={
                        <div className="mx-auto max-w-[592px]">
                          Experimente remover filtros ou usar outros termos de pesquisa.
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
