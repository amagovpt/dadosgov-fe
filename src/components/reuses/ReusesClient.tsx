"use client";

import { useState, useCallback, useEffect, type MouseEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useSearchFilterUrlSync } from "@/hooks/useSearchFilterUrlSync";
import { fetchReuses } from "@/services/api";
import {
  APIResponse,
  Reuse,
  ReuseFilters,
} from "@/types/api";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

import PageBanner from "@/components/PageBanner";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { ReusesFilters } from "@/components/reuses/ReusesFilters";
import { writeQueryParamValues } from "@/utils/filterUtils";

const SORT_OPTIONS: Record<string, string> = {
  relevancia: "",
  recentes: "-last_modified",
  antigos: "last_modified",
  subscritores: "-followers",
};

const SORT_LABELS: Record<string, string> = {
  relevancia: "Relevância",
  recentes: "Mais recente",
  antigos: "Mais antigo",
  subscritores: "Subscritores",
};

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
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const [listData, setListData] = useState<APIResponse<Reuse>>(initialData);
  const activePage = Number(searchParams.get("page") || String(currentPage || 1));
  const { data: reuses, total, page_size } = listData;
  const currentQuery = searchParams.get("q") || "";
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadReusesFromUrl() {
      const params = new URLSearchParams(queryString);
      const tags = params.getAll("tag");
      const organizations = params.getAll("organization");

      const filters: ReuseFilters = {
        ...(params.get("q") && { q: params.get("q") as string }),
        ...(params.get("type") && { type: params.get("type") as string }),
        ...(params.get("sort") && { sort: params.get("sort") as string }),
        ...(params.get("modified_since") && {
          modified_since: params.get("modified_since") as string,
        }),
        ...(tags.length > 0 && { tag: tags.length === 1 ? tags[0] : tags }),
        ...(organizations.length > 0 && {
          organization: organizations.length === 1 ? organizations[0] : organizations,
        }),
      };

      const next = await fetchReuses(activePage, initialData.page_size || 12, filters);
      if (!cancelled) setListData(next);
    }

    loadReusesFromUrl();
    return () => {
      cancelled = true;
    };
  }, [queryString, activePage, initialData.page_size]);

  const getLiveParams = useCallback(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams(Array.from(searchParams.entries()));
  }, [searchParams]);

  const buildUrl = useCallback(
    (overrides: Partial<ReuseFilters> & { page?: number } = {}) => {
      const params = getLiveParams();

      if ("q" in overrides) {
        if (overrides.q) params.set("q", overrides.q);
        else params.delete("q");
      }

      if ("type" in overrides) {
        if (overrides.type) params.set("type", overrides.type);
        else params.delete("type");
      }

      if ("tag" in overrides) {
        const tag = overrides.tag;
        const values = !tag ? [] : Array.isArray(tag) ? tag : [tag];
        writeQueryParamValues(params, "tag", values);
      }

      if ("organization" in overrides) {
        const organization = overrides.organization;
        const values = !organization ? [] : Array.isArray(organization) ? organization : [organization];
        writeQueryParamValues(params, "organization", values);
      }

      if ("sort" in overrides) {
        if (overrides.sort) params.set("sort", overrides.sort);
        else params.delete("sort");
      }

      if ("page" in overrides) {
        if (overrides.page && overrides.page > 1) params.set("page", String(overrides.page));
        else params.delete("page");
      } else if (activePage > 1) {
        params.set("page", String(activePage));
      }

      const qs = params.toString();
      return `/pages/reuses${qs ? `?${qs}` : ""}`;
    },
    [activePage, getLiveParams]
  );

  const onSearchNavigate = useCallback(
    (query: string) => {
      router.replace(buildUrl({ q: query || undefined, page: 1 }), { scroll: false });
    },
    [router, buildUrl]
  );

  const { searchQuery, setSearchQuery, handleSearch } = useSearchFilterUrlSync({
    currentQuery,
    onSearchNavigate,
  });

  const handleSortChange = useCallback(
    (value: string) => {
      router.replace(buildUrl({ sort: SORT_OPTIONS[value] || undefined, page: 1 }), {
        scroll: false,
      });
    },
    [router, buildUrl]
  );

  const sortDefault = (() => {
    const reverseMap: Record<string, string> = {
      "-last_modified": "recentes",
      last_modified: "antigos",
      "-followers": "subscritores",
    };
    return reverseMap[searchParams.get("sort") || ""] || "relevancia";
  })();

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
              <ReusesFilters filterCounts={filterCounts} />
            )}

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
