"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  InputSearchBar,
  Icon,
  CardNoResults,
  Button,
  CardGeneral,
  ToggleGroup,
  Toggle,
} from "@ama-pt/agora-design-system";
import { twJoin } from "tailwind-merge";
import { Pagination } from "@/components/Pagination";
import { DataservicesFilters } from "@/components/dataservices/DataservicesFilters";
import { APIResponse, Dataservice } from "@/types/api";
import HeroGeneral from "@/components/HeroGeneral";
import { formatDateToTimeAgo } from "@/utils/formatDate";
import { formatMetricValue } from "@/utils/formatNumber";

const SORT_OPTIONS: Record<string, string> = {
  relevancia: "",
  recentes: "-created_at",
};

const DATASERVICES_SORT_LABELS: Record<string, string> = {
  relevancia: "Relevância",
  recentes: "Mais recentes",
};

interface DataservicesClientProps {
  initialData: APIResponse<Dataservice>;
  currentPage: number;
  initialFilters?: { q?: string; sort?: string };
}

export default function DataservicesClient({
  initialData,
  currentPage,
  initialFilters,
}: DataservicesClientProps) {
  const router = useRouter();
  const { data: dataservices, total, page_size } = initialData;
  const [searchQuery, setSearchQuery] = useState(initialFilters?.q || "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const currentQuery = initialFilters?.q || "";
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildUrl = useCallback(
    (overrides: { q?: string | null; sort?: string | null; page?: number } = {}) => {
      const params = new URLSearchParams();
      const q = overrides.q !== undefined ? overrides.q : initialFilters?.q;
      const sort = overrides.sort !== undefined ? overrides.sort : initialFilters?.sort;
      const page = overrides.page ?? currentPage;

      if (q) params.set("q", q);
      if (sort) params.set("sort", sort);
      if (page > 1) params.set("page", String(page));

      const qs = params.toString();
      return `/pages/dataservices${qs ? `?${qs}` : ""}`;
    },
    [initialFilters, currentPage]
  );

  useEffect(() => {
    if (searchQuery === currentQuery) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl({ q: searchQuery.trim() || null, page: 1 }));
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, currentQuery, router, buildUrl]);

  const handleSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    router.push(buildUrl({ q: searchQuery.trim() || null, page: 1 }));
  }, [router, buildUrl, searchQuery]);

  const handleSortChange = useCallback(
    (value: string) => {
      router.push(buildUrl({ sort: SORT_OPTIONS[value] || null, page: 1 }));
    },
    [router, buildUrl]
  );

  const sortDefault = (() => {
    const reverseMap: Record<string, string> = {
      "-created_at": "recentes",
    };
    return reverseMap[initialFilters?.sort || ""] || "relevancia";
  })();

  return (
    <main className="w-full flex flex-col justify-center items-center bg-primary-50 gap-32">
      <HeroGeneral
        title="APIs"
        breadcrumbItems={[
          { label: "Home", url: "/" },
          { label: "APIs", url: "/pages/dataservices" },
        ]}
        subtitle={
          <p className="max-w-[592px] text-primary-100">
            {total === 0
              ? "Não existem resultados disponíveis para a sua pesquisa"
              : `Pesquise através de ${total.toLocaleString("pt-PT")} APIs em dados.gov.pt`}
          </p>
        }
      >
        <InputSearchBar
          label="O que procura nas APIs?"
          placeholder="Pesquisar APIs..."
          id="dataservices-search"
          hasVoiceActionButton={false}
          voiceActionAltText="Pesquisar por voz"
          searchActionAltText="Pesquisar"
          darkMode={true}
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter") handleSearch();
          }}
          onSearchActivate={() => handleSearch()}
        />
        <div className="mt-8 text-s-regular text-neutral-200">
          Exemplos: &quot;geolocalização&quot;, &quot;transportes&quot;, &quot;saúde&quot;
        </div>
      </HeroGeneral>

      {/* Main Content */}
      <div className="container flex flex-col gap-24 justify-center items-center py-32">
        {/* Filters toggle + results count + sort */}
        <div className="w-full flex xl:flex-row flex-col gap-16">
          <div className="w-full flex flex-row items-end gap-32">
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
          <div className="w-full flex items-center xl:justify-end">
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
              {Object.entries(DATASERVICES_SORT_LABELS).map(([key, label]) => (
                <Toggle key={key} value={key} aria-label={`Ordenar por ${label}`}>
                  {label}
                </Toggle>
              ))}
            </ToggleGroup>
          </div>
        </div>
        <div className="w-full divider-neutral-200 mb-24" />
        <div className={twJoin("grid gap-32 w-full", filtersOpen ? "grid-cols-12" : "")}>
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
                filtersOpen
                  ? "grid-cols-1 lg:grid-cols-2"
                  : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
              )}
            >
              {dataservices.length > 0 ? (
                dataservices.map((ds) => {
                  const timeAgo = formatDateToTimeAgo(ds.last_modified);
                  const dsUrl = `/pages/dataservices/preview?title=${encodeURIComponent(ds.title)}&description=${encodeURIComponent(ds.description || "")}`;

                  return (
                    <Link
                      key={ds.id}
                      href={dsUrl}
                      className="card-general-listing flex h-full flex-col overflow-hidden rounded-4"
                    >
                      <CardGeneral
                        variant="neutral-100"
                        image={{
                          src: ds.organization?.logo || "/images/placeholders/organization.png",
                          alt: ds.organization?.name || "Organização",
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
                                className="mt-4 text-neutral-900"
                              >
                                {ds.organization?.name || "Sem Organização"}
                              </span>
                            </div>
                          ) as unknown as string
                        }
                        titleText={ds.title}
                        descriptionText={
                          (
                            <div className="flex grow flex-col">
                              {ds.description && (
                                <p className="mb-16 line-clamp-3 text-m-regular text-neutral-800">
                                  {ds.description}
                                </p>
                              )}
                              <div className="mt-auto">
                                <div className="text-xs mt-12 flex flex-wrap items-center gap-8 text-neutral-700">
                                  <div className="flex items-center gap-8" title="Visualizações">
                                    <Icon
                                      name={ds.metrics?.views ? "agora-solid-eye" : "agora-line-eye"}
                                      dimensions="xs"
                                      className="fill-neutral-700"
                                      aria-hidden="true"
                                    />
                                    <span>{formatMetricValue(ds.metrics?.views, 0)}</span>
                                  </div>
                                  <div className="flex items-center gap-8" title="Favoritos">
                                    <Icon
                                      name={
                                        ds.metrics?.followers ? "agora-solid-star" : "agora-line-star"
                                      }
                                      dimensions="xs"
                                      className="fill-neutral-700"
                                      aria-hidden="true"
                                    />
                                    <span>{formatMetricValue(ds.metrics?.followers, 0)}</span>
                                  </div>
                                </div>
                                <div className="mt-16 flex items-center gap-8 text-primary-600">
                                  <Icon
                                    name="agora-line-arrow-right-circle"
                                    className="h-32 w-32"
                                    aria-hidden="true"
                                  />
                                </div>
                              </div>
                            </div>
                          ) as unknown as string
                        }
                        isBlockedLink={true}
                        anchor={{ href: dsUrl }}
                      />
                    </Link>
                  );
                })
              ) : (
                <div className="col-span-full">
                  <CardNoResults
                    icon={
                      <Icon name="agora-line-search" className="icon-xl h-12 w-12 text-primary-500" />
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
        <div className="w-1/2 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalItems={total}
            pageSize={page_size}
            baseUrl={buildUrl()}
          />
        </div>
      </div>
    </main>
  );
}
