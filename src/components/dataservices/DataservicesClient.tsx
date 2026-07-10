"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Icon,
  CardNoResults,
  Button,
  CardLinks,
  ToggleGroup,
  Toggle,
} from "@ama-pt/agora-design-system";
import { twJoin } from "tailwind-merge";
import { Pagination } from "@/components/Pagination";
import { DataservicesFilters } from "@/components/dataservices/DataservicesFilters";
import SearchFilter from "@/components/Shared/SearchFilter";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { Dataservice } from "@/service/types/dataservice";
import { APIResponse } from "@/service/types/shared";
import HeroGeneral from "@/components/HeroGeneral";
import { formatDateToTimeAgo } from "@/utils/formatDate";
import { useDataservicesListing } from "@/hooks/useDataservicesListing";
import { DATASERVICE_SORT_LABELS } from "@/utils/dataservicesListingQuery";
import { useTranslation } from "react-i18next";

interface DataservicesClientProps {
  initialData: APIResponse<Dataservice>;
  currentPage: number;
}

export default function DataservicesClient({ initialData, currentPage }: DataservicesClientProps) {
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
  } = useDataservicesListing({ initialData, currentPage });
  const { t } = useTranslation("common");

  const { data: dataservices, total, page_size } = listData;

  return (
    <main className="flex w-full flex-col items-center justify-center gap-32 bg-primary-50">
      <HeroGeneral
        title="APIs"
        breadcrumbItems={[
          { label: "Início", url: "/" },
          { label: "APIs", url: "/dataservices" },
        ]}
        subtitle={
          <p className="max-w-[592px] text-primary-100">
            {total === 0
              ? "Não existem resultados disponíveis para a sua pesquisa"
              : `Pesquise através de ${total.toLocaleString("pt-PT")} APIs em dados.gov.pt`}
          </p>
        }
      >
        <PublishDropdown darkMode={true} outline={false} />
      </HeroGeneral>

      {/* Search Filter */}
      <SearchFilter
        id="dataservices-search"
        placeholder="Pesquisar APIs..."
        value={searchQuery}
        onChange={setSearchQuery}
        onSearch={handleSearch}
        examplesText='Exemplos: "geolocalização", "transportes", "saúde"'
      />

      {/* Main Content */}
      <div className="container flex flex-col items-center justify-center gap-24 py-32">
        {/* Filters toggle + results count + sort */}
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
              {total === 1
                ? t("results_one", { count: total.toLocaleString("pt-PT") })
                : t("results_other", { count: total.toLocaleString("pt-PT") })}
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
              {Object.entries(DATASERVICE_SORT_LABELS).map(([key, label]) => (
                <Toggle key={key} value={key} aria-label={`Ordenar por ${label}`}>
                  {label}
                </Toggle>
              ))}
            </ToggleGroup>
          </div>
        </div>
        <div className="divider-neutral-200 mb-24 w-full" />
        <div className={twJoin("grid w-full gap-32", filtersOpen ? "grid-cols-12" : "")}>
          {/* Sidebar */}
          {filtersOpen && (
            <div className="col-span-4">
              <DataservicesFilters />
            </div>
          )}

          {/* Results Area */}
          <div className={filtersOpen ? "col-span-8" : "col-span-full"}>
            <div
              className={twJoin(
                "grid gap-32",
                filtersOpen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
              )}
            >
              {dataservices.length > 0 ? (
                dataservices.map((ds) => {
                  const timeAgo = formatDateToTimeAgo(ds.last_modified || ds.created_at);
                  const dsUrl = `/dataservices/${ds.slug}`;

                  return (
                    <div key={ds.id} className="h-full">
                      <CardLinks
                        onClick={() => router.push(dsUrl)}
                        className="!h-full cursor-pointer text-neutral-900 [&_.card-links-container]:!h-full [&_.content]:!flex-col [&_.content]:xl:!flex-row-reverse"
                        variant="transparent"
                        image={{
                          src: ds.organization?.logo || "/images/placeholders/organization.png",
                          alt: ds.title,
                        }}
                        category={ds.organization?.name || "API"}
                        title={<div className="text-xl-bold underline">{ds.title}</div>}
                        description={
                          ds.description ? (
                            <p className="text-sm mt-[8px] line-clamp-3 max-w-[592px] leading-relaxed text-neutral-900">
                              {ds.description}
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
                            children: ds.metrics?.views?.toLocaleString("pt-PT") || "0",
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
                            children: `${ds.datasets?.length || 0} datasets`,
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
                            children: ds.metrics?.followers || 0,
                            title: "Favoritos",
                            onClick: (e: MouseEvent) => e.preventDefault(),
                            className: "text-[#034AD8]",
                          },
                        ]}
                        mainLink={
                          <Link href={dsUrl}>
                            <span className="underline">{ds.title}</span>
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
                      <Icon
                        name="agora-line-search"
                        className="icon-xl h-12 w-12 text-primary-500"
                      />
                    }
                    title="Não encontrou o que procurava?"
                    subtitle={
                      <span className="font-bold">
                        Tente redefinir os filtros para ampliar a sua pesquisa.
                      </span>
                    }
                    description={
                      <div className="mx-auto max-w-[592px]">
                        Explore a nossa lista completa de APIs de dados abertos.
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

        {/* Pagination */}
        <div className="flex w-1/2 justify-center">
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
