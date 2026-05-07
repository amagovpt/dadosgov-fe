"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Icon,
  CardGeneral,
  ToggleGroup,
  Toggle,
  CardNoResults,
} from "@ama-pt/agora-design-system";
import { Pagination } from "@/components/Pagination";
import { OrganizationsFilters } from "./OrganizationsFilters";
import SearchFilter from "@/components/Shared/SearchFilter";
import { useListingUrlState } from "@/hooks/useListingUrlState";
import { useSearchFilterUrlSync } from "@/hooks/useSearchFilterUrlSync";
import { fetchOrganizations } from "@/services/api";
import {
  APIResponse,
  OrgBadges,
  Organization,
  OrganizationFilters,
} from "@/types/api";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

import PageBanner from "@/components/PageBanner";

interface OrganizationsClientProps {
  initialData: APIResponse<Organization>;
  currentPage: number;
  orgBadges: OrgBadges;
  orgBadgeCounts: Record<string, number>;
  allOrganizations?: Organization[];
}

const SORT_OPTIONS: Record<string, string> = {
  relevancia: "",
  mais_dados: "-datasets",
  mais_reutilizacoes: "-reuses",
  subscritores: "-followers",
};

const SORT_LABELS: Record<string, string> = {
  relevancia: "Relevância",
  mais_dados: "Mais dados",
  mais_reutilizacoes: "Mais reutilizações",
  subscritores: "Subscritores",
};

export default function OrganizationsClient({
  initialData,
  currentPage,
  orgBadges,
  orgBadgeCounts,
  allOrganizations,
}: OrganizationsClientProps) {
  const searchParams = useSearchParams();
  const { buildUrl, replaceWith, activePage } = useListingUrlState(currentPage);
  const queryString = searchParams.toString();
  const [listData, setListData] = useState<APIResponse<Organization>>(initialData);
  const { data: organizations, total, page_size } = listData;

  const currentQuery = searchParams.get("q") || "";
  const currentSort = searchParams.get("sort") || "";
  const [filtersOpen, setFiltersOpen] = useState(false);

  const currentSortKey =
    Object.entries(SORT_OPTIONS).find(([, v]) => v === currentSort)?.[0] || "relevancia";

  useEffect(() => {
    let cancelled = false;

    async function loadOrganizationsFromUrl() {
      const params = new URLSearchParams(queryString);
      const badges = params.getAll("badge");
      const organizationsFilter = params.getAll("organization");

      const filters: OrganizationFilters = {
        ...(params.get("q") && { q: params.get("q") as string }),
        ...(params.get("sort") && { sort: params.get("sort") as string }),
        ...(badges.length > 0 && { badge: badges.length === 1 ? badges[0] : badges }),
        ...(organizationsFilter.length > 0 && {
          organization:
            organizationsFilter.length === 1 ? organizationsFilter[0] : organizationsFilter,
        }),
      };

      if (!filters.sort && !filters.q) {
        filters.sort = "-last_modified";
      }

      const next = await fetchOrganizations(activePage, initialData.page_size || 20, filters);
      if (!cancelled) setListData(next);
    }

    loadOrganizationsFromUrl();
    return () => {
      cancelled = true;
    };
  }, [queryString, activePage, initialData.page_size]);

  const onSearchNavigate = useCallback(
    (query: string) => {
      replaceWith({ q: query || null, page: 1 });
    },
    [replaceWith]
  );

  const { searchQuery, setSearchQuery, handleSearch } = useSearchFilterUrlSync({
    currentQuery,
    onSearchNavigate,
  });

  const handleSort = useCallback(
    (selectedKey: string) => {
      const sortValue = SORT_OPTIONS[selectedKey] || null;
      if (sortValue === (currentSort || null)) return;
      replaceWith({ sort: sortValue, page: 1 });
    },
    [currentSort, replaceWith]
  );

  return (
    <div className="min-h-screen flex flex-col font-sans text-neutral-900 bg-neutral-50 filters organization">
      <main className="flex-grow bg-primary-50">
        <PageBanner
          title="Organizações"
          backgroundImageUrl="/Banner/hero-bg.png"
          backgroundPosition="center right"
          //containerClassName="dataset"
          breadcrumbItems={[
            { label: "Home", url: "/" },
            { label: "Organizações", url: "/pages/organizations" },
          ]}
          subtitle={
            <p className="text-primary-100 max-w-[592px]">
              {total === 0
                ? "Não existem resultados disponíveis para a sua pesquisa"
                : `Pesquise através de ${total.toLocaleString("pt-PT")} organizações em dados.gov.pt`}
            </p>
          }
        >
          <PublishDropdown darkMode={true} outline={false} />
        </PageBanner>

        {/* Search Filter */}
        <SearchFilter
          id="organizations-search"
          placeholder="Pesquisar organizações..."
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
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
            <div className="xl:col-span-7 flex items-center justify-end py-16">
              <ToggleGroup
                multiple={false}
                value={currentSortKey}
                onChange={(val) => {
                  const selected = val.length > 0 ? val[0] : "relevancia";
                  if (selected !== currentSortKey) {
                    handleSort(selected);
                  }
                }}
              >
                {Object.entries(SORT_LABELS).map(([key, label]) => (
                  <Toggle key={key} value={key} aria-label={`Ordenar por ${label}`}>
                    {label}
                  </Toggle>
                ))}
              </ToggleGroup>
            </div>
          </div>
          <div className="divider-neutral-200 mb-24" />

          <div
            className={`grid grid-filters gap-x-[32px] ${filtersOpen ? "md:grid-cols-3 xl:grid-cols-12" : ""}`}
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
                    organizations.map((org) => {
                      const formatMetric = (value: number | undefined) => {
                        if (!value) return "0";
                        if (value >= 1_000_000)
                          return (value / 1_000_000).toFixed(1).replace(".", ",") + " M";
                        if (value >= 1_000) return (value / 1_000).toFixed(0) + " mil";
                        return String(value);
                      };
                      const timeAgo = org.last_modified
                        ? formatDistanceToNow(new Date(org.last_modified), { locale: pt })
                            .replace("aproximadamente ", "")
                            .replace("quase ", "")
                            .replace("menos de ", "")
                            .replace("cerca de ", "")
                        : "Desconhecido";

                      return (
                        <Link
                          key={org.id}
                          href={`/pages/organizations/${org.slug}`}
                          className="card-general-listing rounded-[4px] overflow-hidden h-full flex flex-col"
                        >
                          <CardGeneral
                            variant="neutral-100"
                            image={{
                              src: org.logo || "/images/placeholders/organization.png",
                              alt: org.name,
                              height: "56px",
                              className: "bg-primary-100 !object-contain !h-[56px]",
                            }}
                            subtitleText={
                              (
                                <div className="flex flex-col">
                                  <span style={{ fontSize: "16px" }} className="text-neutral-900">
                                    {timeAgo}
                                  </span>
                                  <span
                                    style={{ fontSize: "16px", fontWeight: 300 }}
                                    className="text-neutral-900 mt-4"
                                  >
                                    Organização
                                  </span>
                                </div>
                              ) as unknown as string
                            }
                            titleText={org.name}
                            descriptionText={
                              (
                                <div className="flex flex-col grow">
                                  {org.description && (
                                    <p className="text-m-regular text-neutral-800 line-clamp-3 mb-16">
                                      {org.description}
                                    </p>
                                  )}
                                  <div className="mt-auto">
                                    <div className="flex items-center flex-wrap gap-8 text-xs mt-12 text-neutral-700">
                                      <div
                                        className="flex items-center gap-8"
                                        title="Visualizações"
                                      >
                                        <Icon
                                          name="agora-solid-eye"
                                          dimensions="xs"
                                          className="fill-neutral-700"
                                          aria-hidden="true"
                                        />
                                        <span>{formatMetric(org.metrics?.views)}</span>
                                      </div>
                                      <div className="flex items-center gap-8" title="Datasets">
                                        <Icon
                                          name="agora-solid-layers-menu"
                                          dimensions="xs"
                                          className="fill-neutral-700"
                                          aria-hidden="true"
                                        />
                                        <span>{org.metrics?.datasets || 0}</span>
                                      </div>
                                      <div className="flex items-center gap-8" title="Reutilizações">
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="w-16 h-16 fill-neutral-700" aria-hidden="true">
                                          <path d="M4 22.9091V15.2727C4 14.6702 4.47969 14.1818 5.07143 14.1818C5.66316 14.1818 6.14286 14.6702 6.14286 15.2727V22.9091C6.14286 23.5116 5.66316 24 5.07143 24C4.47969 24 4 23.5116 4 22.9091ZM10.4286 22.9091V1.09091C10.4286 0.488417 10.9083 0 11.5 0C12.0917 0 12.5714 0.488417 12.5714 1.09091V22.9091C12.5714 23.5116 12.0917 24 11.5 24C10.9083 24 10.4286 23.5116 10.4286 22.9091ZM16.8571 22.9091V9.81818C16.8571 9.21569 17.3368 8.72727 17.9286 8.72727C18.5203 8.72727 19 9.21569 19 9.81818V22.9091C19 23.5116 18.5203 24 17.9286 24C17.3368 24 16.8571 23.5116 16.8571 22.9091Z" />
                                        </svg>
                                        <span>{org.metrics?.reuses || 0}</span>
                                      </div>
                                      <div className="flex items-center gap-8" title="Favoritos">
                                        <Icon
                                          name="agora-solid-star"
                                          dimensions="xs"
                                          className="fill-neutral-700"
                                          aria-hidden="true"
                                        />
                                        <span>{formatMetric(org.metrics?.followers)}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-8 text-primary-600 mt-16">
                                      <Icon
                                        name="agora-line-arrow-right-circle"
                                        className="w-32 h-32"
                                        aria-hidden="true"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) as unknown as string
                            }
                            isBlockedLink={true}
                            anchor={{
                              href: `/pages/organizations/${org.slug}`,
                            }}
                          />
                        </Link>
                      );
                    })
                  ) : (
                    <div className="col-span-full">
                      <CardNoResults
                        icon={
                          <Icon name="agora-line-search" className="w-12 h-12 text-primary-500" />
                        }
                        title="Nenhuma organização encontrada"
                        subtitle={
                          <span className="font-bold">
                            Não existem organizações que correspondam aos filtros aplicados.
                          </span>
                        }
                        description={
                          <div className="max-w-[592px] mx-auto">
                            Experimente remover filtros ou usar outros termos de pesquisa.
                          </div>
                        }
                        position="center"
                        hasAnchor={false}
                      />
                    </div>
                  )}
                </div>

                <div className="pb-64 mt-8 flex justify-center">
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
