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
import { APIResponse, Organization, Reuse } from "@/types/api";
import HeroGeneral from "@/components/HeroGeneral";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { ReusesFilters } from "@/components/reuses/ReusesFilters";
import { useReusesListing } from "@/hooks/useReusesListing";
import { REUSE_SORT_LABELS } from "@/utils/reusesListingQuery";
import { formatDateToTimeAgo } from "@/utils/formatDate";
import { twJoin } from "tailwind-merge";
import ListingErrorBanner from "@/components/Shared/ListingErrorBanner";

interface ReusesClientProps {
  initialData: APIResponse<Reuse>;
  currentPage: number;
  filterCounts?: Record<string, number>;
  allOrganizations?: Organization[];
}

export default function ReusesClient({
  initialData,
  currentPage,
  filterCounts = {},
  allOrganizations = [],
}: ReusesClientProps) {
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
    <main className="w-full flex flex-col items-center justify-center gap-32 bg-primary-50">
      <HeroGeneral
        title="Reutilizações"
        breadcrumbItems={[
          { label: "Home", url: "/" },
          { label: "Reutilizações", url: "/pages/reuses" },
        ]}
        subtitle={
          <p className="max-w-[592px] text-primary-100">
            {total === 0
              ? "Não existem resultados disponíveis para a sua pesquisa"
              : `Pesquise através de ${total.toLocaleString("pt-PT")} reutilizações em dados.gov.pt`}
          </p>
        }
      >
        <PublishDropdown darkMode={true} outline={false} />
      </HeroGeneral>

      {/* Search Filter */}
      <SearchFilter
        id="reuses-search"
        placeholder="Pesquisar reutilizações..."
        value={searchQuery}
        onChange={setSearchQuery}
        onSearch={handleSearch}
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
          <div className="w-full flex items-center xl:justify-end ">
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
                <Toggle key={key} value={key} aria-label={`Ordenar por ${label}`}>
                  {label}
                </Toggle>
              ))}
            </ToggleGroup>
          </div>
        </div>
        <div className="w-full divider-neutral-200 mb-24" />
        <div
          className={twJoin("grid gap-32 w-full", filtersOpen ? "grid-cols-12" : "")}
        >
          {/* Sidebar */}
          {filtersOpen && (
            <div className="col-span-4 ">
              <ReusesFilters filterCounts={filterCounts} allOrganizations={allOrganizations} />
            </div>
          )}

          {/* Results Area */}
          <div className={filtersOpen ? "col-span-8" : "col-span-full"}>
            <div>
              <div
                className={twJoin("grid gap-32", filtersOpen ? "grid-cols-1" : "grid-cols-1  lg:grid-cols-2")}
              >
                {listData.error ? (
                  <ListingErrorBanner
                    entity="as reutilizações"
                    errorStatus={listData.errorStatus}
                  />
                ) : reuses.length > 0 ? (
                  reuses.map((reuse) => {
                    const timeAgo = formatDateToTimeAgo(reuse.last_modified || reuse.created_at);
                    return (
                      <div key={reuse.id} className="h-full">
                        <CardLinks
                          onClick={() => router.push(`/pages/reuses/${reuse.slug}`)}
                          className="!h-full [&_.card-links-container]:!h-full [&_.content]:!flex-col [&_.content]:xl:!flex-row-reverse cursor-pointer text-neutral-900"
                          variant="transparent"
                          image={{
                            src: reuse.image_thumbnail || reuse.image || "/laptop.png",
                            alt: reuse.title,
                          }}
                          category={reuse.organization?.name || "Reutilização"}
                          title={<div className="text-xl-bold underline">{reuse.title}</div>}
                          description={
                            reuse.description ? (
                              <p className="text-sm mt-[8px] line-clamp-3 max-w-[592px] leading-relaxed text-neutral-900">
                                {reuse.description}
                              </p>
                            ) : undefined
                          }
                          date={<span className="font-[300]">Atualizado há {timeAgo}</span>}
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
                              children: `${reuse.datasets?.length || 0} datasets`,
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
                              children: reuse.metrics?.followers || 0,
                              title: "Favoritos",
                              onClick: (e: MouseEvent) => e.preventDefault(),
                              className: "text-[#034AD8]",
                            },
                          ]}
                          mainLink={
                            <Link href={`/pages/reuses/${reuse.slug}`}>
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
                        <Icon name="agora-line-search" className="h-12 w-12 text-primary-500" />
                      }
                      title="Não encontrou nenhuma reutilização?"
                      subtitle={
                        <span className="font-bold">
                          Tente redefinir os filtros para ampliar sua busca.
                        </span>
                      }
                      description="Explore a nossa lista completa de reutilizações de dados abertos."
                      position="center"
                      hasAnchor={true}
                      valueAnchor="Redefinir filtros"
                      anchorHref="/pages/reuses"
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
        <div className="w-1/2 flex justify-center">
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
