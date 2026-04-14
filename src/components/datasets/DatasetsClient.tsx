"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button,
  InputSearch,
  Icon,
  CardGeneral,
  CardLinks,
  ToggleGroup,
  Toggle,
  Pill,
  CardNoResults,
  ProgressBar,
} from "@ama-pt/agora-design-system";
import { Pagination } from "@/components/Pagination";
import { DatasetsFilters } from "@/components/datasets/DatasetsFilters";
import { APIResponse, Dataset, DatasetFilters, SiteMetrics } from "@/types/api";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

import PageBanner from "@/components/PageBanner";
import PublishDropdown from "@/components/admin/PublishDropdown";

interface DatasetsClientProps {
  initialData: APIResponse<Dataset>;
  currentPage: number;
  siteMetrics?: SiteMetrics;
  initialFilters?: DatasetFilters;
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
  siteMetrics,
  initialFilters = {},
  filterCounts,
}: DatasetsClientProps) {
  const router = useRouter();
  const { data: datasets, total, page_size } = initialData;

  const currentQuery = initialFilters.q || "";
  const currentSort = initialFilters.sort || "";
  const [searchQuery, setSearchQuery] = React.useState(currentQuery);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchRef = React.useRef<() => void>(() => {});

  // Sync local state when URL changes externally (e.g. header SearchDropdown navigation)
  React.useEffect(() => {
    setSearchQuery(initialFilters.q || "");
  }, [initialFilters.q]);

  const currentSortKey =
    Object.entries(SORT_OPTIONS).find(([, v]) => v === currentSort)?.[0] || "relevancia";

  const buildUrl = React.useCallback(
    (overrides: Record<string, string | null>) => {
      const params = new URLSearchParams();
      if (initialFilters.q) params.set("q", initialFilters.q);
      if (initialFilters.sort) params.set("sort", initialFilters.sort);
      if (initialFilters.tag) {
        const tags = Array.isArray(initialFilters.tag) ? initialFilters.tag : [initialFilters.tag];
        tags.forEach((t) => params.append("tag", t));
      }
      if (initialFilters.license) {
        const licenses = Array.isArray(initialFilters.license)
          ? initialFilters.license
          : [initialFilters.license];
        licenses.forEach((l) => params.append("license", l));
      }
      if (initialFilters.format) {
        const formats = Array.isArray(initialFilters.format)
          ? initialFilters.format
          : [initialFilters.format];
        formats.forEach((f) => params.append("format", f));
      }
      if (initialFilters.organization) {
        const orgs = Array.isArray(initialFilters.organization)
          ? initialFilters.organization
          : [initialFilters.organization];
        orgs.forEach((o) => params.append("organization", o));
      }
      if (initialFilters.badge) {
        const badges = Array.isArray(initialFilters.badge)
          ? initialFilters.badge
          : [initialFilters.badge];
        badges.forEach((b) => params.append("badge", b));
      }
      if (initialFilters.schema) params.set("schema", initialFilters.schema);
      if (initialFilters.geozone) params.set("geozone", initialFilters.geozone);
      if (initialFilters.granularity) params.set("granularity", initialFilters.granularity);
      if (initialFilters.featured) params.set("featured", "true");
      for (const [key, value] of Object.entries(overrides)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      params.set("page", "1");
      const qs = params.toString();
      return `/pages/datasets${qs ? `?${qs}` : ""}`;
    },
    [initialFilters]
  );

  React.useEffect(() => {
    if (searchQuery === currentQuery) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.replace(buildUrl({ q: searchQuery.trim() || null }), { scroll: false });
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, currentQuery, router, buildUrl]);

  const handleSearch = React.useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    router.replace(buildUrl({ q: searchQuery.trim() || null }), { scroll: false });
  }, [searchQuery, router, buildUrl]);

  handleSearchRef.current = handleSearch;

  const handleSort = React.useCallback(
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
          <PublishDropdown darkMode={true} />
        </PageBanner>

        {/* Search Section */}
        <div className="container mx-auto pt-32 pb-16 px-4">
          <div className="max-w-[592px]">
            <InputSearch
              label="Pesquisar"
              placeholder="Pesquisar por conjuntos de dados..."
              id="datasets-search"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter") handleSearchRef.current();
              }}
            />
            <div className="mt-8 text-s-regular text-neutral-900">
              Exemplos: &quot;educação&quot;, &quot;saúde pública&quot;, &quot;ambiente&quot;
            </div>
          </div>
        </div>

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
                  <Toggle key={key} value={key} selected={currentSortKey === key}>
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
                  <Pagination currentPage={currentPage} totalItems={total} pageSize={page_size} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
