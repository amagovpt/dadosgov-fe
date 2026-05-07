"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Icon,
  CardGeneral,
  ToggleGroup,
  Toggle,
  CardNoResults,
  ProgressBar,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import { deleteDataset, fetchDatasets } from "@/services/api";
import { Pagination } from "@/components/Pagination";
import { DatasetsFilters } from "@/components/datasets/DatasetsFilters";
import SearchFilter from "@/components/Shared/SearchFilter";
import { useSearchFilterUrlSync } from "@/hooks/useSearchFilterUrlSync";
import { APIResponse, Dataset, DatasetFilters } from "@/types/api";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

import PageBanner from "@/components/PageBanner";
import PublishDropdown from "@/components/admin/PublishDropdown";
import Button from "../Primitives/Button";

interface DatasetsClientProps {
  initialData: APIResponse<Dataset>;
  currentPage: number;
  filterCounts?: Record<string, number>;
}

const SORT_OPTIONS: Record<string, string> = {
  relevancia: "",
  criacao: "-created",
  antigo: "created",
  subscritores: "-followers",
};

const SORT_LABELS: Record<string, string> = {
  relevancia: "Relevância",
  criacao: "Mais recente",
  antigo: "Mais antigo",
  subscritores: "Subscritores",
};

export default function DatasetsClient({
  initialData,
  currentPage,
  filterCounts,
}: DatasetsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const { show, hide } = usePopupContext();
  const [listData, setListData] = useState<APIResponse<Dataset>>(initialData);
  const activePage = Number(searchParams.get("page") || String(currentPage || 1));
  const { data: datasets, total, page_size } = listData;

  //TODO: Check if can be removed
  const handleDeleteDataset = (dataset: { id: string; title: string }) => {
    show(
      <div className="flex flex-col gap-[16px]">
        <p>
          Essa ação é irreversível.{" "}
          <span className="text-red-600">Tem a certeza que quer eliminar este conjunto de dados?</span>
        </p>
        <div className="flex justify-end gap-16 pt-16">
          <Button appearance="outline" variant="neutral" onClick={hide}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            hasIcon
            leadingIcon="agora-line-trash"
            leadingIconHover="agora-solid-trash"
            onClick={async () => {
              try {
                await deleteDataset(dataset.id);
                hide();
                router.refresh();
              } catch {
                hide();
              }
            }}
          >
            Eliminar
          </Button>
        </div>
      </div>,
      { title: "Elimine o conjunto de dados", closeAriaLabel: "Fechar", dimensions: "m" }
    );
  };


  const currentQuery = searchParams.get("q") || "";
  const currentSort = searchParams.get("sort") || "";
  const [filtersOpen, setFiltersOpen] = useState(false);

  const currentSortKey =
    Object.entries(SORT_OPTIONS).find(([, v]) => v === currentSort)?.[0] || "relevancia";

  const getLiveParams = useCallback(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams(Array.from(searchParams.entries()));
  }, [searchParams]);

  const buildUrl = useCallback(
    (overrides: Record<string, string | null>) => {
      const params = getLiveParams();
      for (const [key, value] of Object.entries(overrides)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      params.delete("page");
      params.sort();
      const qs = params.toString();
      return `${pathname}${qs ? `?${qs}` : ""}`;
    },
    [getLiveParams, pathname]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadDatasetsFromUrl() {
      const params = new URLSearchParams(queryString);
      const tags = params
        .getAll("tag")
        .flatMap((value) => value.split(","))
        .map((value) => value.trim())
        .filter(Boolean);
      const licenses = params.getAll("license");
      const formats = params.getAll("format");
      const organizations = params.getAll("organization");
      const badges = params.getAll("badge");
      const frequencies = params.getAll("frequency");

      const filters: DatasetFilters = {
        ...(params.get("q") && { q: params.get("q") as string }),
        ...(params.get("schema") && { schema: params.get("schema") as string }),
        ...(params.get("geozone") && { geozone: params.get("geozone") as string }),
        ...(params.get("granularity") && { granularity: params.get("granularity") as string }),
        ...(params.get("sort") && { sort: params.get("sort") as string }),
        ...(params.get("modified_since") && {
          modified_since: params.get("modified_since") as string,
        }),
        ...(params.get("featured") && { featured: params.get("featured") === "true" }),
        ...(tags.length > 0 && { tag: tags.length === 1 ? tags[0] : tags }),
        ...(licenses.length > 0 && { license: licenses.length === 1 ? licenses[0] : licenses }),
        ...(formats.length > 0 && { format: formats.length === 1 ? formats[0] : formats }),
        ...(organizations.length > 0 && {
          organization: organizations.length === 1 ? organizations[0] : organizations,
        }),
        ...(badges.length > 0 && { badge: badges.length === 1 ? badges[0] : badges }),
        ...(frequencies.length > 0 && {
          frequency: frequencies.length === 1 ? frequencies[0] : frequencies,
        }),
      };

      if (!filters.sort && !filters.q) {
        filters.sort = "-created";
      }

      const next = await fetchDatasets(activePage, initialData.page_size || 20, filters);
      if (!cancelled) {
        setListData(next);
      }
    }

    loadDatasetsFromUrl();
    return () => {
      cancelled = true;
    };
  }, [queryString, activePage, initialData.page_size]);

  const onSearchNavigate = useCallback(
    (query: string) => {
      router.replace(buildUrl({ q: query || null }), { scroll: false });
    },
    [router, buildUrl]
  );

  const { searchQuery, setSearchQuery, handleSearch } = useSearchFilterUrlSync({
    currentQuery,
    onSearchNavigate,
  });

  const handleSort = useCallback(
    (selectedKey: string) => {
      const sortValue = SORT_OPTIONS[selectedKey] || null;
      if (sortValue === (currentSort || null)) return;
      router.replace(buildUrl({ sort: sortValue }), { scroll: false });
    },
    [router, buildUrl, currentSort]
  );

  return (
    <div className="min-h-screen flex flex-col font-sans text-neutral-900 bg-neutral-50 filters dataset">
      <main className="flex-grow bg-primary-50">
        <PageBanner
          title="Conjuntos de dados"
          backgroundImageUrl="/Banner/hero-bg.png"
          backgroundPosition="center right"
          //containerClassName="dataset"
          breadcrumbItems={[
            { label: "Home", url: "/" },
            { label: "Conjuntos de dados", url: "/pages/datasets" },
          ]}
          subtitle={
            <p className="text-primary-100 max-w-[592px]">
              {total === 0
                ? "Não existem resultados disponíveis para a sua pesquisa"
                : `Pesquise através de ${total.toLocaleString("pt-PT")} conjuntos de dados em dados.gov.pt`}
            </p>
          }
        >
          <PublishDropdown darkMode={true} outline={false} />
        </PageBanner>

        {/* Search Filter */}
        <SearchFilter
          id="datasets-search"
          placeholder="Pesquisar por conjuntos de dados..."
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
        />

        {/* Main Content */}
        <div className="container mx-auto md:gap-32 xl:gap-64 bg-primary-50">
          {/* Results count + Sort toggles — full width, aligned with grid */}
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
                <DatasetsFilters filterCounts={filterCounts} />
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
                  {datasets.length > 0 ? (
                    datasets.map((dataset) => {
                      const qualityScore =
                        dataset.quality?.score != null
                          ? Math.round(dataset.quality.score * 100)
                          : 0;
                      const formatMetric = (value: number | undefined) => {
                        if (!value) return "0";
                        if (value >= 1_000_000)
                          return (value / 1_000_000).toFixed(1).replace(".", ",") + " M";
                        if (value >= 1_000) return (value / 1_000).toFixed(0) + " mil";
                        return String(value);
                      };
                      const timeAgo = dataset.last_modified
                        ? formatDistanceToNow(new Date(dataset.last_modified), { locale: pt })
                          .replace("aproximadamente ", "")
                          .replace("quase ", "")
                          .replace("menos de ", "")
                          .replace("cerca de ", "")
                        : "Desconhecido";

                      return (
                        <Link
                          key={dataset.id}
                          href={`/pages/datasets/${dataset.slug}`}
                          className="card-general-listing rounded-[4px] overflow-hidden h-full flex flex-col"
                        >
                          <CardGeneral
                            variant="white"
                            image={{
                              src:
                                dataset.organization?.logo ||
                                "/images/placeholders/organization.png",
                              alt: dataset.organization?.name || "Organização",
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
                                    {dataset.organization?.name || "Sem Organização"}
                                  </span>
                                </div>
                              ) as unknown as string
                            }
                            titleText={dataset.title}
                            descriptionText={
                              (
                                <div className="flex flex-col grow">
                                  <p className="text-m-regular text-neutral-800 line-clamp-3 mb-16">
                                    {dataset.description}
                                  </p>
                                  <div
                                    className={`mt-auto ${qualityScore <= 45 ? "quality-progress-warning" : qualityScore > 50 ? "quality-progress-success" : ""}`}
                                  >
                                    <ProgressBar
                                      value={qualityScore}
                                      max={100}
                                      hideLabel={true}
                                      hidePercentageValue={true}
                                    />
                                    <span className="text-[14px] text-neutral-900 mt-4 block">
                                      {qualityScore}% Qualidade dos metadados
                                    </span>
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
                                        <span>{formatMetric(dataset.metrics?.views)}</span>
                                      </div>
                                      <div className="flex items-center gap-8" title="Downloads">
                                        <Icon
                                          name="agora-solid-download"
                                          dimensions="xs"
                                          className="fill-neutral-700"
                                          aria-hidden="true"
                                        />
                                        <span>
                                          {formatMetric(dataset.metrics?.resources_downloads)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-8" title="Reutilizações">
                                        <svg width="16" height="16" viewBox="0 0 24 24" className="w-16 h-16 fill-neutral-700" aria-hidden="true">
                                          <path d="M4 22.9091V15.2727C4 14.6702 4.47969 14.1818 5.07143 14.1818C5.66316 14.1818 6.14286 14.6702 6.14286 15.2727V22.9091C6.14286 23.5116 5.66316 24 5.07143 24C4.47969 24 4 23.5116 4 22.9091ZM10.4286 22.9091V1.09091C10.4286 0.488417 10.9083 0 11.5 0C12.0917 0 12.5714 0.488417 12.5714 1.09091V22.9091C12.5714 23.5116 12.0917 24 11.5 24C10.9083 24 10.4286 23.5116 10.4286 22.9091ZM16.8571 22.9091V9.81818C16.8571 9.21569 17.3368 8.72727 17.9286 8.72727C18.5203 8.72727 19 9.21569 19 9.81818V22.9091C19 23.5116 18.5203 24 17.9286 24C17.3368 24 16.8571 23.5116 16.8571 22.9091Z" />
                                        </svg>
                                        <span>{dataset.metrics?.reuses || 0}</span>
                                      </div>
                                      <div className="flex items-center gap-8" title="Favoritos">
                                        <Icon
                                          name="agora-solid-star"
                                          dimensions="xs"
                                          className="fill-neutral-700"
                                          aria-hidden="true"
                                        />
                                        <span>{formatMetric(dataset.metrics?.followers)}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-8 text-primary-600 mt-8">
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
                              href: `/pages/datasets/${dataset.slug}`,
                            }}
                          />
                        </Link>
                      );
                    })
                  ) : (
                    <div className="col-span-full">
                      <CardNoResults
                        icon={
                          <Icon
                            name="agora-line-search"
                            className="w-12 h-12 text-primary-500 icon-xl"
                          />
                        }
                        title="Não encontrámos o que procura"
                        subtitle={
                          <span className="font-bold">A sua pesquisa não devolveu resultados.</span>
                        }
                        description={
                          <div className="max-w-[592px] mx-auto">
                            Verifique os termos introduzidos ou ajuste os filtros para ver mais
                            resultados.
                          </div>
                        }
                        position="center"
                        hasAnchor={false}
                      />
                    </div>
                  )}
                </div>

                <div className="pb-64 mt-64 flex justify-center">
                  <Pagination currentPage={activePage} totalItems={total} pageSize={page_size} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
