"use client";

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  ComponentProps,
  FC,
  ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionGroup,
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
import {
  buildTabularData,
  formatBytes,
  parseCsv,
  sortRowsByColumn,
  translateExtrasKey,
  translateExtrasValue,
} from "./utils";
import { SpreadsheetPreview, TabularData } from "./types";
import DataFieldWrapper from "./DataFieldWrapper";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { Typograph } from "@/components/Shared/Generics/Typograph";
import UrlWrapper from "./UrlWrapper";

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

export const ResourceExpandedContent: FC<{ resource: Resource }> = ({ resource }) => {
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
  const [page, setPage] = useState(0);
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
    setPage(0);
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
        page: page + 1,
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
      setPage(0);
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
    const start = page * PREVIEW_PAGE_SIZE;
    return ordered.slice(start, start + PREVIEW_PAGE_SIZE);
  }, [source, tabularPage, headers, tabularData, page, sortBy, sortDir, sortTypeFor, locale]);

  const hasData = source === "tabular" ? tabularPage !== null : tabularData !== null;
  const totalRows =
    source === "tabular" ? (tabularPage?.meta.total ?? 0) : (tabularData?.totalRows ?? 0);
  const totalCols = source === "tabular" ? headers.length : (tabularData?.totalCols ?? 0);
  const footerDate =
    source === "tabular"
      ? analysisFinishedAt || resource.last_modified || resource.created_at
      : tabularData?.lastModified || resource.last_modified || resource.created_at;

  const FlexTabs = Tabs as FC<
    Omit<ComponentProps<typeof Tabs>, "children"> & { children: ReactNode }
  >;

  const formatFileType = (type?: string) => {
    if (type === "main") return tds("labels.fileTypes.main");
    if (type === "doc") return tds("labels.fileTypes.doc");
    return tds("labels.fileTypes.community");
  };

  return (
    <div className="dataset flex gap-16 overflow-hidden">
      <div className="min-w-0 flex-1">
        <FlexTabs fullWidth>
          <Tab>
            <TabHeader>{tds("resources.tabs.metadata")}</TabHeader>
            <TabBody>
              <div className="flex w-full flex-col">
                <div className="flex w-full max-w-[800px] flex-col gap-32 self-center">
                  <DataFieldWrapper label={tds("labels.title")} value={resource.title} />

                  {resource.type && (
                    <DataFieldWrapper
                      label={tds("labels.type")}
                      value={formatFileType(resource.type)}
                    />
                  )}

                  {resource.description && (
                    <DataFieldWrapper
                      label={tds("labels.description")}
                      value={
                        <Typograph
                          tag="p"
                          className="max-w-[592px] wrap-break-word whitespace-pre-wrap"
                        >
                          {formatHtmlParagraphs(resource.description)}
                        </Typograph>
                      }
                    />
                  )}

                  <div className="flex flex-col gap-32 lg:flex-row">
                    <DataFieldWrapper label={tds("labels.format")} value={resource.format} />

                    {resource.mime && (
                      <DataFieldWrapper label={tds("labels.mime")} value={resource.mime} />
                    )}
                  </div>

                  {resource.filesize && (
                    <DataFieldWrapper
                      label={tds("labels.filesize")}
                      value={formatBytes(resource.filesize, locale)}
                    />
                  )}

                  <UrlWrapper url={resource.url} />

                  <div className="flex flex-col gap-32 lg:flex-row">
                    <DataFieldWrapper
                      label={tds("labels.created_at")}
                      value={formatDateLong(resource.created_at, locale)}
                    />

                    {resource.last_modified && (
                      <DataFieldWrapper
                        label={tds("labels.last_modified")}
                        value={formatDateLong(resource.last_modified, locale)}
                      />
                    )}
                  </div>

                  {resource.extras && Object.keys(resource.extras).length > 0 && (
                    <div className="pt-16">
                      <AccordionGroup>
                        <Accordion
                          headingTitle={
                            <span className="text-sm font-bold text-neutral-900">
                              {tds("resources.metadata.extras")}
                            </span>
                          }
                          headingLevel="h5"
                        >
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "32px 64px",
                              padding: "16px",
                            }}
                          >
                            {Object.entries(resource.extras).map(([key, value]) => (
                              <div key={key}>
                                <h6 className="text-sm mb-8 font-bold text-neutral-900">
                                  {translateExtrasKey(tds, key)}
                                </h6>
                                <p className="text-sm break-all text-neutral-900">
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
              </div>
            </TabBody>
          </Tab>

          {isTabular && (
            <Tab>
              <TabHeader>{tds("resources.tabs.preview")}</TabHeader>
              <TabBody>
                <div className="p-16">
                  {isLoading && !hasData ? (
                    <div className="flex items-center justify-center py-16">
                      <LoaderDialog title={tds("resources.preview.loading")} />
                    </div>
                  ) : error || !hasData ? (
                    <p className="text-sm text-neutral-900">
                      {error || tds("resources.preview.unavailable")}
                    </p>
                  ) : (
                    <div className="space-y-16">
                      {pageError && (
                        <p className="text-m-regular text-neutral-900">
                          {tds("resources.preview.pageLoadError")}
                        </p>
                      )}
                      {!pageError && (
                        <div
                          ref={tableRef}
                          className="overflow-x-auto [&_.agora-table-pagination]:flex! [&_.agora-table-pagination]:justify-end! [&_.section-items]:hidden!"
                        >
                          <Table
                            desktopLayout="table"
                            paginationProps={{
                              totalItems:
                                source === "tabular" ? totalRows : (tabularData?.rows.length ?? 0),
                              itemsPerPage: PREVIEW_PAGE_SIZE,
                              availablePageSizes: [PREVIEW_PAGE_SIZE],
                              currentPage: page,
                              onPageChange: handlePageChange,
                              buttonDropdownAriaLabel: "",
                              dropdownListAriaLabel: "",
                              itemsPerPageLabel: "",
                            }}
                          >
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
                                    <TableCell key={j} headerLabel={headers[j] || ""}>
                                      {cell}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
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
                      <div className="grid grid-cols-2 gap-24 md:grid-cols-4">
                        {Object.entries(profile.columns).map(([name, col]) => (
                          <div key={name} className="min-w-0">
                            <p className="text-sm mb-4 font-bold break-words text-neutral-900">
                              {name}
                            </p>
                            <span className="text-xs rounded inline-block bg-neutral-100 px-8 py-4 text-neutral-900">
                              {col.format || col.python_type}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-900">
                        {tds("resources.preview.structureUnavailable")}
                      </p>
                    )
                  ) : error || !tabularData ? (
                    <p className="text-sm text-neutral-900">
                      {error || tds("resources.preview.structureUnavailable")}
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-24 md:grid-cols-4">
                      {tabularData.columns.map((col, i) => (
                        <div key={i} className="min-w-0">
                          <p className="text-sm mb-4 font-bold break-words text-neutral-900">
                            {col.name}
                          </p>
                          <span className="text-xs rounded inline-block bg-neutral-100 px-8 py-4 text-neutral-900">
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
        </FlexTabs>
      </div>
    </div>
  );
};
