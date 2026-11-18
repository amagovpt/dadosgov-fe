"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, CardNoResults, StatusCard } from "@ama-pt/agora-design-system";
import SearchFilter from "@/components/Shared/SearchFilter";
import { Pagination } from "@/components/Pagination";
import { useSearchFilterUrlSync } from "@/hooks/useSearchFilterUrlSync";
import { fetchDatasetResources } from "@/service/api/datasets/detail";
import { RESOURCE_PAGE_SIZE, type ResourceSectionPage } from "@/service/types/dataset/detail";
import { ResourceCard } from "./DatasetResourcesTable/ResourceCard";

function FileSection({ datasetId, section }: { datasetId: string; section: ResourceSectionPage }) {
  const { t } = useTranslation("datasets");
  const headingId = useId();
  const [currentQuery, setCurrentQuery] = useState("");
  const [result, setResult] = useState(section.result);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(section.result === null);
  const [currentPage, setCurrentPage] = useState(1);
  const request = useRef({ q: "", page: 1 });
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const load = useCallback(
    async (q: string, page: number) => {
      controller.current?.abort();
      const pending = new AbortController();
      controller.current = pending;
      request.current = { q, page };
      setCurrentQuery(q);
      setCurrentPage(page);
      setLoading(true);
      setError(false);
      try {
        const next = await fetchDatasetResources(
          datasetId,
          { type: section.type, q, page },
          {
            signal: pending.signal,
          }
        );
        if (!pending.signal.aborted) setResult(next);
      } catch {
        if (!pending.signal.aborted) setError(true);
      } finally {
        if (!pending.signal.aborted) setLoading(false);
      }
    },
    [datasetId, section.type]
  );

  // SearchPagination reports its initial page too; keep this callback stable
  // and ignore that report so hydrated first pages aren't fetched twice.
  const changePage = useCallback(
    (page: number) => {
      if (page !== request.current.page) void load(request.current.q, page);
    },
    [load]
  );

  const search = useCallback(
    (q: string) => {
      if (q !== request.current.q || request.current.page !== 1 || error) void load(q, 1);
    },
    [load, error]
  );
  const { searchQuery, setSearchQuery, handleSearch } = useSearchFilterUrlSync({
    currentQuery,
    onSearchNavigate: search,
    debounceMs: 400,
  });

  return (
    <section
      aria-labelledby={headingId}
      className="flex min-w-0 flex-col gap-32"
      data-resource-type={section.type}
    >
      <h3
        id={headingId}
        className={`text-xl-bold ${section.type === "main" ? "text-primary-900" : "text-neutral-900"}`}
      >
        {t(`resources.types.${section.type}`)}
      </h3>
      <SearchFilter
        id={`${headingId}-search`}
        label={t("resources.search")}
        placeholder={t("resources.searchPlaceholder")}
        value={searchQuery}
        onChange={setSearchQuery}
        onSearch={handleSearch}
        contained={false}
      />
      <div aria-live="polite" aria-atomic="true" className="flex flex-col gap-8">
        <h4 className="text-l-medium text-neutral-900">{t("resources.resultsList")}</h4>
        <p className="text-s-regular text-neutral-700">
          {loading
            ? t("resources.loading")
            : error
              ? t("resources.loadError")
              : t("resources.resultCount", { count: result?.total ?? 0 })}
        </p>
      </div>
      <div aria-busy={loading}>
        {error ? (
          <div className="flex flex-col items-start gap-16">
            <StatusCard variant="danger" description={t("resources.loadError")} showIcon />
            <Button
              appearance="outline"
              onClick={() => void load(request.current.q, request.current.page)}
            >
              {t("resources.retry")}
            </Button>
          </div>
        ) : result?.data.length ? (
          <div className="grid grid-cols-1 gap-32 lg:grid-cols-2">
            {result.data.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        ) : !loading ? (
          <CardNoResults
            position="center"
            title={t("resources.noResults")}
            description={t("resources.noResultsHelp")}
            hasAnchor={false}
          />
        ) : null}
      </div>
      {!error && result && result.total > RESOURCE_PAGE_SIZE && (
        <div className="mt-32 w-full max-w-[696px] self-center" inert={loading}>
          <Pagination
            currentPage={currentPage}
            totalItems={result.total}
            pageSize={RESOURCE_PAGE_SIZE}
            onPageChange={changePage}
            isOnUrl={false}
          />
        </div>
      )}
    </section>
  );
}

export function DatasetFiles({
  datasetId,
  sections,
}: {
  datasetId: string;
  sections: ResourceSectionPage[];
}) {
  const { t } = useTranslation("datasets");
  const visibleSections = sections.filter(
    (section) => section.result === null || section.result.total > 0
  );
  return (
    <div className="flex flex-col gap-64 pb-32">
      {visibleSections.length ? (
        visibleSections.map((section) => (
          <FileSection
            key={`${datasetId}-${section.type}`}
            datasetId={datasetId}
            section={section}
          />
        ))
      ) : (
        <CardNoResults position="center" title={t("resources.noFiles")} hasAnchor={false} />
      )}
    </div>
  );
}
