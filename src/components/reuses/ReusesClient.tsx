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
import { APIResponse, Reuse } from "@/types/api";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import PageBanner from "@/components/PageBanner";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { ReusesFilters } from "@/components/reuses/ReusesFilters";
import { useReusesListing } from "@/hooks/useReusesListing";
import { REUSE_SORT_LABELS } from "@/utils/reusesListingQuery";

interface ReusesClientProps {
  initialData: APIResponse<Reuse>;
  currentPage: number;
  filterCounts?: Record<string, number>;
}

export default function ReusesClient({
  initialData,
  currentPage,
  filterCounts = {},
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
    <div className="min-h-screen flex flex-col font-sans text-neutral-900 bg-neutral-50 filters reuse">
      <main className="flex-grow bg-primary-50">
        <PageBanner
          title="Reutilizações"
          backgroundImageUrl="/Banner/hero-bg.png"
          backgroundPosition="center right"
          breadcrumbItems={[
            { label: "Home", url: "/" },
            { label: "Reutilizações", url: "/pages/reuses" },
          ]}
          subtitle={
            <p className="text-primary-100 max-w-[592px]">
              {total === 0
                ? "Não existem resultados disponíveis para a sua pesquisa"
                : `Pesquise através de ${total.toLocaleString("pt-PT")} reutilizações em dados.gov.pt`}
            </p>
          }
        >
          <PublishDropdown darkMode={true} outline={false} />
        </PageBanner>

        {/* Search Filter */}
        <SearchFilter
          id="reuses-search"
          placeholder="Pesquisar reutilizações..."
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
          <div className="divider-neutral-200 mb-24" />

          <div
            className={`grid grid-filters gap-x-[32px] ${filtersOpen ? "md:grid-cols-3 xl:grid-cols-12" : ""}`}
          >
            {/* Sidebar */}
            {filtersOpen && <ReusesFilters filterCounts={filterCounts} />}

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
                  {reuses.length > 0 ? (
                    reuses.map((reuse) => {
                      const timeAgo =
                        reuse.last_modified || reuse.created_at
                          ? formatDistanceToNow(new Date(reuse.last_modified || reuse.created_at), {
                              locale: pt,
                            })
                              .replace("aproximadamente ", "")
                              .replace("quase ", "")
                              .replace("menos de ", "")
                              .replace("cerca de ", "")
                          : "Desconhecido";

                      return (
                        <div key={reuse.id} className="h-full">
                          <CardLinks
                            onClick={() => router.push(`/pages/reuses/${reuse.slug}`)}
                            className="cursor-pointer text-neutral-900 h-full"
                            variant="transparent"
                            image={{
                              src: reuse.image_thumbnail || reuse.image || "/laptop.png",
                              alt: reuse.title,
                            }}
                            category={reuse.organization?.name || "Reutilização"}
                            title={<div className="underline text-xl-bold">{reuse.title}</div>}
                            description={
                              reuse.description ? (
                                <p className="text-sm line-clamp-3 leading-relaxed text-neutral-900 mt-[8px] max-w-[592px]">
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
                          <Icon name="agora-line-search" className="w-12 h-12 text-primary-500" />
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

                {/* Pagination */}
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
