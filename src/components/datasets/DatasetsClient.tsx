"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Icon,
  CardGeneral,
  CardLinks,
  ToggleGroup,
  Toggle,
  Pill,
  CardNoResults,
  ProgressBar,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import { deleteDataset } from "@/services/api";
import { Pagination } from "@/components/Pagination";
import { DatasetsFilters } from "@/components/datasets/DatasetsFilters";
import SearchFilter from "@/components/Shared/SearchFilter";
import { useSearchFilterUrlSync } from "@/hooks/useSearchFilterUrlSync";
import { APIResponse, Dataset, DatasetFilters, SiteMetrics } from "@/types/api";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

import PageBanner from "@/components/PageBanner";
import PublishDropdown from "@/components/admin/PublishDropdown";
import Button from "../Primitives/Button";
import CardMetrics, { CardMetricsProps } from "../Primitives/Cards/CardMetrics";

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
  const { show, hide } = usePopupContext();
  const { data: datasets, total, page_size } = initialData;

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

  const currentQuery = initialFilters.q || "";
  const currentSort = initialFilters.sort || "";
  const [filtersOpen, setFiltersOpen] = React.useState(false);

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

  const onSearchNavigate = React.useCallback(
    (query: string) => {
      router.replace(buildUrl({ q: query || null }), { scroll: false });
    },
    [router, buildUrl]
  );

  const { searchQuery, setSearchQuery, handleSearch } = useSearchFilterUrlSync({
    currentQuery,
    onSearchNavigate,
  });

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
                    datasets.map((dataset, index) => {
                      const timeAgo = dataset.last_modified
                        ? formatDistanceToNow(new Date(dataset.last_modified), { locale: pt })
                          .replace("aproximadamente ", "")
                          .replace("quase ", "")
                          .replace("menos de ", "")
                          .replace("cerca de ", "")
                        : "Desconhecido";
                      const cardProps = {
                        ...dataset,
                        last_modified: timeAgo,
                        link: `/pages/datasets/${dataset.slug}`
                      } as CardMetricsProps;
                      return <CardMetrics key={`dataset-${index}`} {...cardProps} />
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

