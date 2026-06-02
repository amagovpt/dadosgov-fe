"use client";

import React, { useState } from "react";
import {
  Icon,
  ToggleGroup,
  Toggle,
  CardNoResults,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import { deleteDataset } from "@/services/api";
import { Pagination } from "@/components/Pagination";
import { DatasetsFilters } from "@/components/datasets/DatasetsFilters";
import SearchFilter from "@/components/Shared/SearchFilter";
import { APIResponse, Dataset, Frequency, Granularity, License, Organization } from "@/types/api";

import HeroGeneral from "@/components/HeroGeneral";
import PublishDropdown from "@/components/admin/PublishDropdown";
import Button from "../Primitives/Button";
import CardMetrics, { CardMetricsProps } from "../Primitives/Cards/CardMetrics";
import { formatDateToTimeAgo } from "@/utils/formatDate";
import { DATASET_SORT_LABELS } from "@/utils/datasetsListingQuery";
import { useDatasetsListing } from "@/hooks/useDatasetsListing";
import { twJoin } from "tailwind-merge";
import ListingErrorBanner from "@/components/Shared/ListingErrorBanner";

interface DatasetsClientProps {
  initialData: APIResponse<Dataset>;
  currentPage: number;
  filterCounts?: Record<string, number>;
  allOrganizations?: Organization[];
  allLicenses?: License[];
  allFrequencies?: Frequency[];
  allGranularities?: Granularity[];
}

export default function DatasetsClient({
  initialData,
  currentPage,
  filterCounts,
  allOrganizations = [],
  allLicenses = [],
  allFrequencies = [],
  allGranularities = [],
}: DatasetsClientProps) {
  const { show, hide } = usePopupContext();
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
  } = useDatasetsListing({ initialData, currentPage });

  const { data: datasets, total, page_size } = listData;

  // TODO: Keep this while delete action is not wired to the cards UI.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteDataset = (dataset: { id: string; title: string }) => {
    show(
      <div className="flex flex-col gap-16">
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

  return (
    <main className="w-full flex flex-col justify-center items-center bg-primary-50 gap-32">
      <HeroGeneral
        title="Conjuntos de dados"
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
      </HeroGeneral>

      {/* Search Filter */}
      <SearchFilter
        id="datasets-search"
        placeholder="Pesquisar por conjuntos de dados..."
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
            <span className="text-neutral-900 text-l-regular whitespace-nowrap">
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
              {Object.entries(DATASET_SORT_LABELS).map(([key, label]) => (
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
              <DatasetsFilters
                filterCounts={filterCounts}
                allOrganizations={allOrganizations}
                allLicenses={allLicenses}
                allFrequencies={allFrequencies}
                allGranularities={allGranularities}
              />
            </div>
          )}

          {/* Results Area */}
          <div className={filtersOpen ? "col-span-8" : "col-span-full"}>
            <div>
              <div
                className={twJoin("grid gap-32", filtersOpen ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3")}
              >
                {listData.error ? (
                  <ListingErrorBanner
                    entity="os conjuntos de dados"
                    errorStatus={listData.errorStatus}
                  />
                ) : datasets.length > 0 ? (
                  datasets.map((dataset, index) => {
                    const timeAgo = formatDateToTimeAgo(dataset.last_modified);
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
