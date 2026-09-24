"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionGroup,
  Icon,
  LoaderDialog,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Tabs,
  Tab,
  TabHeader,
  TabBody,
} from "@ama-pt/agora-design-system";
import { Resource } from "@/service/types/dataset";
import { Pagination } from "@/components/Pagination";
import { fetchTabularPage, fetchTabularProfile } from "@/service/api/tabular";
import { TabularPage, TabularProfile, TabularSortDir } from "@/service/types/tabular";
import { formatDateLong } from "@/utils/formatDate";
import { CopyField } from "./CopyField";
import { PREVIEW_PAGE_SIZE, SPREADSHEET_FORMATS, TABULAR_FORMATS } from "./constants";
import { buildTabularData, downloadUrl, formatBytes, parseCsv, sortRowsByColumn, translateExtrasKey, translateExtrasValue } from "./utils";
import { SpreadsheetPreview, TabularData } from "./types";

type SortOrder = "none" | "ascending" | "descending";

type AgoraSortType = "string" | "numeric" | "date";

/** Map a csv-detective python_type to the Agora table sort affordance. */
const agoraSortType = (pythonType?: string): AgoraSortType => {
  if (pythonType === "int" || pythonType === "float") return "numeric";
  if (pythonType === "date" || pythonType === "datetime") return "date";
  return "string";
};

/** Same mapping for the in-app heuristics used by the byte-proxy preview. */
const heuristicSortType = (type?: string): AgoraSortType => {
  if (type === "integer" || type === "float") return "numeric";
  if (type === "date") return "date";
  return "string";
};

const formatCell = (value: unknown): string =>
  value === null || value === undefined ? "" : String(value);

export const ResourceExpandedContent: React.FC<{ resource: Resource }> = ({ resource }) => {
  const { i18n } = useTranslation("common");
  const { t: tds } = useTranslation("datasets");
  const locale = i18n.language as "pt" | "en";

  const format = resource.format?.toLowerCase() || "";
  const isTabular = TABULAR_FORMATS.includes(format);
  const isSpreadsheet = SPREADSHEET_FORMATS.includes(format);
  const isRemote = resource.filetype === "remote";

  // A resource is previewable through api-tabular once hydra has analyzed it
  // successfully (same predicate as udata-front). ODS is not ingested by the
  // pipeline, so it always takes the byte-proxy fallback.
  const extras = resource.extras ?? {};
  const analysisFinishedAt = extras["analysis:parsing:finished_at"] as string | undefined;
  const analysisOk = Boolean(analysisFinishedAt) && !extras["analysis:parsing:error"];
  const canUseTabularApi = isTabular && format !== "ods" && analysisOk;

  const [source, setSource] = useState<"tabular" | "fallback">(
    canUseTabularApi ? "tabular" : "fallback"
  );
  const [tabularPage, setTabularPage] = useState<TabularPage | null>(null);
  const [profile, setProfile] = useState<TabularProfile | null>(null);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<TabularSortDir>("asc");
  const [pageError, setPageError] = useState(false);
  const hasLoadedTabularRef = useRef(false);

  const [tabularData, setTabularData] = useState<TabularData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const tableRef = useRef<HTMLDivElement>(null);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleSortChange = useCallback((header: string, order: SortOrder) => {
    if (order === "none") {
      setSortBy(null);
    } else {
      setSortBy(header);
      setSortDir(order === "ascending" ? "asc" : "desc");
    }
    setPage(1);
  }, []);

  // Tabular path — csv-detective profile (column names + types), fetched once.
  useEffect(() => {
    if (source !== "tabular") return;
    let cancelled = false;
    fetchTabularProfile(resource.id).then((result) => {
      if (!cancelled) setProfile(result);
    });
    return () => {
      cancelled = true;
    };
  }, [resource.id, source]);

  // Tabular path — one server-side page per page/sort combination.
  useEffect(() => {
    if (source !== "tabular") return;
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      setPageError(false);
      const result = await fetchTabularPage(resource.id, {
        page,
        pageSize: PREVIEW_PAGE_SIZE,
        sortBy: sortBy ?? undefined,
        sortDir,
      });
      if (cancelled) return;
      if (result && (result.records.length > 0 || page > 1)) {
        hasLoadedTabularRef.current = true;
        setTabularPage(result);
      } else if (hasLoadedTabularRef.current) {
        // The service was answering — a mid-session page/sort failure shows
        // an inline message instead of downgrading the whole preview.
        setPageError(true);
      } else {
        // First fetch failed (not ingested, service down, empty table):
        // hand over to the byte-proxy fallback.
        setSource("fallback");
      }
      setIsLoading(false);
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [resource.id, source, page, sortBy, sortDir]);

  // Fallback path — raw bytes through proxy-csv / proxy-spreadsheet, parsed
  // in the app (unchanged behaviour for unanalyzed resources and ODS).
  useEffect(() => {
    if (source !== "fallback" || !isTabular) return;
    const unavailableMessage = isRemote
      ? tds("resources.preview.unavailableRemote")
      : tds("resources.preview.loadError");

    async function fetchData() {
      setIsLoading(true);
      setError(null);
      setPage(1);
      try {
        const rid = encodeURIComponent(resource.id);
        const endpoint = isSpreadsheet ? "proxy-spreadsheet" : "proxy-csv";
        const res = await fetch(`/internal-api/${endpoint}?rid=${rid}`);
        if (!res.ok) {
          setError(unavailableMessage);
          return;
        }
        if (isSpreadsheet) {
          const json: SpreadsheetPreview = await res.json();
          const parsed = buildTabularData(json.headers, json.rows, json.totalRows);
          parsed.lastModified = res.headers.get("last-modified") ?? json.lastModified;
          setTabularData(parsed);
        } else {
          const text = await res.text();
          const parsed = parseCsv(text);
          parsed.lastModified = res.headers.get("last-modified");
          setTabularData(parsed);
        }
      } catch {
        setError(unavailableMessage);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [source, resource.id, isTabular, isSpreadsheet, isRemote, tds]);

  // Unified render model over both sources. Tabular headers come from the
  // first row's keys (ground truth for cell lookup, as in udata-front),
  // falling back to the profile's header order while a page is loading.
  const headers = useMemo(() => {
    if (source === "tabular") {
      const firstRecord = tabularPage?.records[0];
      if (firstRecord) return Object.keys(firstRecord);
      return profile?.header ?? [];
    }
    return tabularData?.headers ?? [];
  }, [source, tabularPage, profile, tabularData]);

  /**
   * Sort affordance of a column: the csv-detective type on the api-tabular
   * path, the in-app heuristic on the fallback one, so both previews expose
   * the same sortable headers.
   */
  const sortTypeFor = useCallback(
    (header: string): AgoraSortType => {
      if (source === "tabular") {
        return agoraSortType(profile?.columns?.[header]?.python_type);
      }
      return heuristicSortType(tabularData?.columns.find((col) => col.name === header)?.type);
    },
    [source, profile, tabularData]
  );

  const rows = useMemo(() => {
    if (source === "tabular") {
      // Already ordered and paginated by api-tabular.
      return (tabularPage?.records ?? []).map((record) =>
        headers.map((header) => formatCell(record[header]))
      );
    }
    if (!tabularData) return [];
    // The whole file is in memory here, so sorting happens over every row
    // before paginating — not just over the page on screen.
    const sortIndex = sortBy ? headers.indexOf(sortBy) : -1;
    const ordered =
      sortBy && sortIndex >= 0
        ? sortRowsByColumn(tabularData.rows, sortIndex, sortTypeFor(sortBy), sortDir, locale)
        : tabularData.rows;
    const start = (page - 1) * PREVIEW_PAGE_SIZE;
    return ordered.slice(start, start + PREVIEW_PAGE_SIZE);
  }, [source, tabularPage, headers, tabularData, page, sortBy, sortDir, sortTypeFor, locale]);

  const hasData = source === "tabular" ? tabularPage !== null : tabularData !== null;
  const totalRows = source === "tabular" ? (tabularPage?.meta.total ?? 0) : (tabularData?.totalRows ?? 0);
  const totalCols = source === "tabular" ? headers.length : (tabularData?.totalCols ?? 0);
  const footerDate =
    source === "tabular"
      ? analysisFinishedAt || resource.last_modified || resource.created_at
      : tabularData?.lastModified || resource.last_modified || resource.created_at;

  const FlexTabs = Tabs as React.FC<Omit<React.ComponentProps<typeof Tabs>, "children"> & { children: React.ReactNode }>;

  return (
    <div className="flex gap-16 overflow-hidden">
      <div className="w-[2px] bg-primary-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <FlexTabs>
          {isTabular && (
          <Tab>
            <TabHeader>{tds("resources.tabs.preview")}</TabHeader>
            <TabBody>
              <div className="py-16">
                {isLoading && !hasData ? (
                  <div className="flex items-center justify-center py-16">
                    <LoaderDialog title={tds("resources.preview.loading")} />
                  </div>
                ) : error || !hasData ? (
                  <p className="text-neutral-900 text-sm">
                    {error || tds("resources.preview.unavailable")}
                  </p>
                ) : (
                  <div className="space-y-16">
                    {pageError && (
                      <p className="text-neutral-900 text-sm">
                        {tds("resources.preview.pageLoadError")}
                      </p>
                    )}
                    <div className="overflow-x-auto" ref={tableRef}>
                      <Table desktopLayout="table">
                        <TableHeader>
                          <TableRow>
                            {headers.map((header, i) => (
                              <TableHeaderCell
                                key={i}
                                sortType={sortTypeFor(header)}
                                sortOrder={
                                  sortBy === header
                                    ? sortDir === "asc"
                                      ? "ascending"
                                      : "descending"
                                    : "none"
                                }
                                onSortChange={(order) => handleSortChange(header, order)}
                              >
                                {header}
                              </TableHeaderCell>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.map((row, i) => (
                            <TableRow key={i}>
                              {row.map((cell, j) => (
                                <TableCell
                                  key={j}
                                  headerLabel={headers[j] || ""}
                                >
                                  {cell}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <Pagination
                      currentPage={page}
                      totalItems={source === "tabular" ? totalRows : (tabularData?.rows.length ?? 0)}
                      pageSize={PREVIEW_PAGE_SIZE}
                      onPageChange={handlePageChange}
                    />
                    <p className="text-neutral-900 text-sm" style={{ marginTop: "24px" }}>
                      {tds("resources.preview.footer", {
                        date: formatDateLong(footerDate, locale),
                        cols: totalCols,
                        rows: totalRows,
                      })}
                      {source === "fallback" &&
                        tabularData &&
                        tabularData.rows.length < tabularData.totalRows &&
                        tds("resources.preview.limited", { count: tabularData.rows.length })}
                    </p>
                  </div>
                )}
              </div>
            </TabBody>
          </Tab>
          )}
          {isTabular && (
          <Tab>
            <TabHeader>{tds("resources.tabs.structure")}</TabHeader>
            <TabBody>
              <div className="py-16">
                {isLoading && !hasData ? (
                  <div className="flex items-center justify-center py-16">
                    <LoaderDialog title={tds("resources.preview.loadingStructure")} />
                  </div>
                ) : source === "tabular" ? (
                  profile ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-24">
                      {Object.entries(profile.columns).map(([name, col]) => (
                        <div key={name} className="min-w-0">
                          <p className="text-sm font-bold text-neutral-900 mb-4 break-words">
                            {name}
                          </p>
                          <span className="inline-block bg-neutral-100 text-neutral-900 text-xs px-8 py-4 rounded">
                            {col.format || col.python_type}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-900 text-sm">
                      {tds("resources.preview.structureUnavailable")}
                    </p>
                  )
                ) : error || !tabularData ? (
                  <p className="text-neutral-900 text-sm">
                    {error || tds("resources.preview.structureUnavailable")}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-24">
                    {tabularData.columns.map((col, i) => (
                      <div key={i} className="min-w-0">
                        <p className="text-sm font-bold text-neutral-900 mb-4 break-words">
                          {col.name}
                        </p>
                        <span className="inline-block bg-neutral-100 text-neutral-900 text-xs px-8 py-4 rounded">
                          {col.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabBody>
          </Tab>
          )}
          <Tab>
            <TabHeader>{tds("resources.tabs.metadata")}</TabHeader>
            <TabBody>
              <div className="py-16 space-y-32">
                <CopyField label={tds("resources.metadata.url")} value={resource.url} />
                {resource.latest && (
                  <CopyField label={tds("resources.metadata.stableUrl")} value={resource.latest} />
                )}
                <CopyField label={tds("resources.metadata.identifier")} value={resource.id} />
                {resource.checksum && (
                  <CopyField
                    label={resource.checksum.type}
                    value={resource.checksum.value}
                  />
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px 64px", paddingTop: "32px" }}>
                  <div>
                    <h5 className="font-bold text-sm text-neutral-900 mb-4">
                      {tds("resources.metadata.createdAt")}
                    </h5>
                    <p className="text-neutral-900 text-sm">
                      {formatDateLong(resource.created_at, locale)}
                    </p>
                  </div>
                  {resource.filesize !== undefined && resource.filesize > 0 && (
                    <div>
                      <h5 className="font-bold text-sm text-neutral-900 mb-4">
                        {tds("resources.metadata.size")}
                      </h5>
                      <p className="text-neutral-900 text-sm">
                        {formatBytes(resource.filesize, locale)}
                      </p>
                    </div>
                  )}
                  {resource.last_modified && (
                    <div>
                      <h5 className="font-bold text-sm text-neutral-900 mb-4">
                        {tds("resources.metadata.modifiedAt")}
                      </h5>
                      <p className="text-neutral-900 text-sm">
                        {formatDateLong(resource.last_modified, locale)}
                      </p>
                    </div>
                  )}
                  {resource.type && (
                    <div>
                      <h5 className="font-bold text-sm text-neutral-900 mb-4">
                        {tds("resources.metadata.type")}
                      </h5>
                      <p className="text-neutral-900 text-sm">
                        {tds(`resources.types.${resource.type}`, { defaultValue: resource.type })}
                      </p>
                    </div>
                  )}
                  {resource.mime && (
                    <div>
                      <h5 className="font-bold text-sm text-neutral-900 mb-4">
                        {tds("resources.metadata.mime")}
                      </h5>
                      <code className="bg-neutral-100 px-8 py-4 rounded text-sm text-neutral-900">
                        {resource.mime}
                      </code>
                    </div>
                  )}
                </div>

                {resource.extras && Object.keys(resource.extras).length > 0 && (
                  <div className="pt-16">
                    <AccordionGroup>
                      <Accordion
                        headingTitle={
                          <span className="font-bold text-sm text-neutral-900">
                            {tds("resources.metadata.extras")}
                          </span>
                        }
                        headingLevel="h5"
                      >
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px 64px", padding: "16px" }}>
                          {Object.entries(resource.extras).map(([key, value]) => (
                            <div key={key}>
                              <h6 className="font-bold text-sm text-neutral-900 mb-8">
                                {translateExtrasKey(tds, key)}
                              </h6>
                              <p className="text-neutral-900 text-sm break-all">
                                {translateExtrasValue(tds, value)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </Accordion>
                    </AccordionGroup>
                  </div>
                )}
              </div>
            </TabBody>
          </Tab>
          <Tab>
            <TabHeader>{tds("resources.tabs.downloads")}</TabHeader>
            <TabBody>
              <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: "24px" }}>
                <div>
                  <p className="text-sm text-neutral-900 font-bold" style={{ marginBottom: "12px" }}>
                    {tds("resources.downloads.originalFormat")}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <a
                      href={downloadUrl(resource)}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={resource.title || ""}
                      className="text-primary-600 text-sm hover:underline flex items-center"
                      style={{ gap: "8px" }}
                    >
                      <Icon name="agora-line-download" aria-hidden="true" />
                      {tds("resources.format", {
                        format: (resource.format || "").toUpperCase(),
                      })}
                      {resource.filesize !== undefined && resource.filesize > 0
                        ? ` - ${formatBytes(resource.filesize, locale)}`
                        : ""}
                    </a>
                    <button
                      type="button"
                      className="text-primary-600 hover:text-primary-800 cursor-pointer shrink-0"
                      title={tds("resources.downloads.copyUrl")}
                      onClick={() => navigator.clipboard.writeText(resource.url)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ width: "16px", height: "16px", minWidth: "16px" }}
                        aria-hidden="true"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </TabBody>
          </Tab>
        </FlexTabs>
      </div>
    </div>
  );
};
