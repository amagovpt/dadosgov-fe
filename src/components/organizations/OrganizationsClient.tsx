"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon, ToggleGroup, Toggle, CardNoResults } from "@ama-pt/agora-design-system";
import { Pagination } from "@/components/Pagination";
import { OrganizationsFilters } from "./OrganizationsFilters";
import SearchFilter from "@/components/Shared/SearchFilter";
import {
  APIResponse,
  OrgBadges,
  Organization,
} from "@/types/api";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

import HeroGeneral from "@/components/HeroGeneral";
import CardMetrics, { CardMetricsProps } from "../Primitives/Cards/CardMetrics";
import { formatDateToTimeAgo } from "@/utils/formatDate";
import { useOrganizationsListing } from "@/hooks/useOrganizationsListing";
import { ORGANIZATION_SORT_LABELS } from "@/utils/organizationsListingQuery";

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
    <div className="filters organization flex min-h-screen flex-col bg-neutral-50 font-sans text-neutral-900">
      <main className="flex-grow bg-primary-50">
        <HeroGeneral
          title="Organizações"
          backgroundImageUrl="/Banner/hero-bg.png"
          backgroundPosition="center right"
          breadcrumbItems={[
            { label: "Home", url: "/" },
            { label: "Organizações", url: "/pages/organizations" },
          ]}
          subtitle={
            <p className="max-w-[592px] text-primary-100">
              {total === 0
                ? "Não existem resultados disponíveis para a sua pesquisa"
                : `Pesquise através de ${total.toLocaleString("pt-PT")} organizações em dados.gov.pt`}
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
            <div className="flex items-center justify-end py-16 xl:col-span-7">
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

          <div
            className={`grid-filters grid gap-x-[32px] ${filtersOpen ? "md:grid-cols-3 xl:grid-cols-12" : ""}`}
          >
            {/* Sidebar */}
            {filtersOpen && (
              <div className="xl:col-span-5 xl:block">
                <OrganizationsFilters
                  orgBadges={orgBadges}
                  orgBadgeCounts={orgBadgeCounts}
                  allOrganizations={allOrganizations}
                />
              </div>
            )}

            {/* Results Area */}
            <div className={filtersOpen ? "xl:col-span-7" : "col-span-full"}>
              <div>
                <div
                  className="gap-32"
                  style={{
                    display: "grid",
                    gridTemplateColumns: filtersOpen
                      ? "repeat(2, minmax(0, 1fr))"
                      : "repeat(3, minmax(0, 1fr))",
                  }}
                >
                  {organizations.length > 0 ? (
                    organizations.map((org, index) => {
                      const timeAgo = formatDateToTimeAgo(org.last_modified);
                      const cardProps = {
                        ...org,
                        last_modified: timeAgo,
                        title: org.name,
                        link: `/pages/organizations/${org.slug}`,
                      } as CardMetricsProps;
                      return (
                        <CardMetrics key={`dataset-${index}`} {...cardProps} hideProgressBar />
                      );
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
    </div>
  );
}
