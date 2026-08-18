"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionGroup,
  Button,
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
import { formatDateLong } from "@/utils/formatDate";
import { CopyField } from "./CopyField";
import { DEFAULT_PAGE_SIZE, SPREADSHEET_FORMATS, TABULAR_FORMATS } from "./constants";
import { buildTabularData, downloadUrl, formatBytes, parseCsv, translateExtrasKey, translateExtrasValue } from "./utils";
import { SpreadsheetPreview, TabularData } from "./types";

export const ResourceExpandedContent: React.FC<{ resource: Resource }> = ({ resource }) => {
  const { i18n } = useTranslation("common");
  const { t: tds } = useTranslation("datasets");
  const locale = i18n.language as "pt" | "en";
  const [tabularData, setTabularData] = useState<TabularData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const tableRef = useRef<HTMLDivElement>(null);

  const visibleRows = useMemo(() => {
    if (!tabularData) return [];
    const start = (page - 1) * DEFAULT_PAGE_SIZE;
    return tabularData.rows.slice(start, start + DEFAULT_PAGE_SIZE);
  }, [tabularData, page]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const format = resource.format?.toLowerCase() || "";
  const isTabular = TABULAR_FORMATS.includes(format);
  const isSpreadsheet = SPREADSHEET_FORMATS.includes(format);
  const isRemote = resource.filetype === "remote";

  useEffect(() => {
    if (!isTabular) return;
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
  }, [resource.id, isTabular, isSpreadsheet, isRemote, tds]);

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
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <LoaderDialog title={tds("resources.preview.loading")} />
                  </div>
                ) : error || !tabularData ? (
                  <p className="text-neutral-900 text-sm">
                    {error || tds("resources.preview.unavailable")}
                  </p>
                ) : (
                  <div className="space-y-16">
                    <div className="hidden bg-primary-100 rounded-8 p-24 flex items-center gap-16" style={{ marginBottom: "24px" }}>
                      <div className="flex-1">
                        <p className="font-bold text-neutral-900 text-sm">
                          {tds("resources.preview.exploreTitle")}
                        </p>
                        <p className="text-neutral-900 text-xs mt-4">
                          {tds("resources.preview.exploreDescription")}
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        appearance="outline"
                        hasIcon={true}
                        trailingIcon="agora-line-external-link"
                        trailingIconHover="agora-solid-external-link"
                        onClick={() => window.open(resource.url, '_blank')}
                      >
                        {tds("resources.preview.exploreCta")}
                      </Button>
                    </div>
                    <div className="overflow-x-auto" ref={tableRef}>
                      <Table desktopLayout="table">
                        <TableHeader>
                          <TableRow>
                            {tabularData.headers.map((header, i) => (
                              <TableHeaderCell key={i}>
                                {header}
                              </TableHeaderCell>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {visibleRows.map((row, i) => (
                            <TableRow key={i}>
                              {row.map((cell, j) => (
                                <TableCell
                                  key={j}
                                  headerLabel={tabularData.headers[j] || ""}
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
                      totalItems={tabularData.rows.length}
                      pageSize={DEFAULT_PAGE_SIZE}
                      onPageChange={handlePageChange}
                    />
                    <p className="text-neutral-900 text-sm" style={{ marginTop: "24px" }}>
                      {tds("resources.preview.footer", {
                        date: formatDateLong(
                          tabularData.lastModified ||
                            resource.last_modified ||
                            resource.created_at,
                          locale
                        ),
                        cols: tabularData.totalCols,
                        rows: tabularData.totalRows,
                      })}
                      {tabularData.rows.length < tabularData.totalRows &&
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
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <LoaderDialog title={tds("resources.preview.loadingStructure")} />
                  </div>
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
