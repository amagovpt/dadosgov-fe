"use client";

import React, { useState, useEffect, type ReactElement } from "react";
import {
  Accordion,
  AccordionGroup,
  Button,
  Icon,
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
import { Resource, CommunityResource } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "https://dados.gov.pt/api/1";

/**
 * Build the backend redirect URL for a resource download.
 * This routes through /api/1/datasets/r/{id}/ so the download is tracked.
 */
function downloadUrl(resource: Resource): string {
  return `${API_BASE_URL}/datasets/r/${resource.id}/`;
}

interface DatasetResourcesTableProps {
  resources: Resource[];
  communityResources?: CommunityResource[];
}

const formatBytes = (bytes?: number) => {
  if (typeof bytes !== "number") return "";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2)).toLocaleString("pt-PT")} ${sizes[i]}`;
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  main: "Ficheiros principais",
  file: "Ficheiros principais",
  documentation: "Documentação",
};

const EXTRAS_KEY_LABELS: Record<string, string> = {
  "check:id": "verificação:id",
  "check:available": "verificar: disponível",
  "check:status": "verificar:status",
  "check:timeout": "verificação:tempo limite",
  "check:date": "verificar:data",
  "check:headers:content-type": "verificar:cabeçalhos:tipo de conteúdo",
  "check:headers:content-length": "verificar:cabeçalhos:comprimento do conteúdo",
  "analysis:check_id": "análise:verificar_id",
  "analysis:content-length": "análise:comprimento do conteúdo",
  "analysis:checksum": "análise: checksum",
  "analysis:mime-type": "análise:tipo MIME",
  "analysis:last-modified-at": "análise:última-modificação-em",
  "analysis:last-modified-detection": "análise:detecção de última modificação",
  "analysis:parsing:started_at": "análise:análise:iniciada_em",
  "analysis:parsing:finished_at": "análise:análise:concluída_em",
  "analysis:parsing:error": "análise:análise:erro",
  "analysis:parsing:parsing_table": "análise:análise sintática:tabela_de_análise",
};

const translateExtrasKey = (key: string): string => {
  return EXTRAS_KEY_LABELS[key] || key;
};

const translateExtrasValue = (value: unknown): string => {
  if (value === true) return "verdadeiro";
  if (value === false) return "falso";
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const CopyField: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label,
  value,
  mono = true,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex items-center gap-8">
        <h5 className="font-bold text-sm text-neutral-900">{label}</h5>
        <button
          type="button"
          onClick={handleCopy}
          className="text-primary-600 hover:text-primary-800 cursor-pointer shrink-0"
          aria-label={`Copiar ${label}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
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
        {copied && <span className="text-xs text-green-600">Copiado!</span>}
      </div>
      <code
        className={`block bg-neutral-100 px-12 py-8 rounded text-sm text-neutral-900 break-all ${mono ? "font-mono" : ""}`}
      >
        {value}
      </code>
    </div>
  );
};

const TABULAR_FORMATS = ["csv", "tsv", "xls", "xlsx", "ods", "parquet"];
const MAX_PREVIEW_ROWS = 5;

interface ColumnInfo {
  name: string;
  type: string;
}

interface TabularData {
  headers: string[];
  columns: ColumnInfo[];
  rows: string[][];
  totalRows: number;
  totalCols: number;
  lastModified: string | null;
}

const detectColumnType = (name: string, values: string[]): string => {
  const lower = name.toLowerCase();
  if (lower.includes("url") || lower.includes("lien") || lower.includes("link") || lower.includes("href"))
    return "url";
  if (lower.includes("email") || lower.includes("courriel") || lower.includes("mail"))
    return "email";
  if (lower.includes("siret")) return "siret";
  if (lower.includes("siren")) return "siren";
  if (lower.includes("date") || lower.includes("data")) return "date";
  if (lower.includes("telephone") || lower.includes("telefone") || lower.includes("phone"))
    return "phone";

  const nonEmpty = values.filter((v) => v.length > 0);
  if (nonEmpty.length === 0) return "string";

  const allNumbers = nonEmpty.every((v) => /^-?\d+([.,]\d+)?$/.test(v));
  if (allNumbers) {
    const hasDecimals = nonEmpty.some((v) => /[.,]\d+$/.test(v));
    return hasDecimals ? "float" : "integer";
  }

  const allBools = nonEmpty.every((v) =>
    ["true", "false", "0", "1", "sim", "não", "yes", "no", "oui", "non"].includes(v.toLowerCase())
  );
  if (allBools) return "boolean";

  const allUrls = nonEmpty.every((v) => /^https?:\/\//.test(v));
  if (allUrls) return "url";

  const allDates = nonEmpty.every((v) => !isNaN(Date.parse(v)) && v.length > 6);
  if (allDates) return "date";

  return "string";
};

const parseCsv = (text: string, separator = ","): TabularData => {
  const lines = text.trim().split("\n");
  if (lines.length === 0)
    return { headers: [], columns: [], rows: [], totalRows: 0, totalCols: 0, lastModified: null };

  const firstLine = lines[0];
  if (firstLine.includes(";") && !firstLine.includes(",")) separator = ";";
  else if (firstLine.includes("\t")) separator = "\t";

  const parseLine = (line: string) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === separator) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const dataLines = lines.slice(1).filter((l) => l.trim().length > 0);
  const allRows = dataLines.map(parseLine);
  const rows = allRows.slice(0, MAX_PREVIEW_ROWS);

  const sampleRows = allRows.slice(0, 100);
  const columns: ColumnInfo[] = headers.map((header, i) => ({
    name: header,
    type: detectColumnType(
      header,
      sampleRows.map((row) => row[i] || "")
    ),
  }));

  return {
    headers,
    columns,
    rows,
    totalRows: dataLines.length,
    totalCols: headers.length,
    lastModified: null,
  };
};

const ResourceExpandedContent: React.FC<{ resource: Resource }> = ({ resource }) => {
  const [tabularData, setTabularData] = useState<TabularData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTabular = TABULAR_FORMATS.includes(resource.format?.toLowerCase() || "");

  useEffect(() => {
    if (!isTabular || resource.format?.toLowerCase() !== "csv") return;

    async function fetchData() {
      setIsLoading(true);
      try {
        const res = await fetch(`/internal-api/proxy-csv?url=${encodeURIComponent(resource.url)}`);
        if (!res.ok) throw new Error("Erro ao carregar o ficheiro");
        const text = await res.text();
        const parsed = parseCsv(text);
        parsed.lastModified = res.headers.get("last-modified");
        setTabularData(parsed);
      } catch (err) {
        console.error("Preview error:", err);
        setError("Não foi possível carregar os dados.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [resource.url, resource.format, isTabular]);

  // Cast Tabs to accept conditional children (the library type is overly strict)
  const FlexTabs = Tabs as React.FC<Omit<React.ComponentProps<typeof Tabs>, "children"> & { children: React.ReactNode }>;

  return (
    <div className="flex gap-16 overflow-hidden">
      <div className="w-[2px] bg-primary-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <FlexTabs>
          {isTabular && !isLoading && !error && tabularData && (
          <Tab>
            <TabHeader>Pré-visualização</TabHeader>
            <TabBody>
              <div className="py-16">
                {isLoading ? (
                  <p className="text-neutral-900 text-sm">A carregar pré-visualização...</p>
                ) : error || !tabularData ? (
                  <p className="text-neutral-900 text-sm">
                    {error || "Pré-visualização não disponível para este recurso."}
                  </p>
                ) : (
                  <div className="space-y-16">
                    <div className="bg-primary-100 rounded-8 p-24 flex items-center gap-16" style={{ marginBottom: "24px" }}>
                      <div className="flex-1">
                        <p className="font-bold text-neutral-900 text-sm">
                          Explore os dados em detalhes.
                        </p>
                        <p className="text-neutral-900 text-xs mt-4">
                          Utilize esta ferramenta para obter uma visão geral dos dados, aprender
                          mais sobre as diferentes colunas ou realizar filtros e classificações.
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
                        Explore os dados
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <Table desktopLayout="table">
                        <TableHeader>
                          <TableRow>
                            {tabularData.headers.map((header, i) => (
                              <TableHeaderCell key={i} sortType="string">
                                {header}
                              </TableHeaderCell>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tabularData.rows.map((row, i) => (
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
                    <p className="text-neutral-900 text-sm" style={{ marginTop: "24px" }}>
                      Última atualização da pré-visualização:{" "}
                      {tabularData.lastModified
                        ? new Date(tabularData.lastModified).toLocaleDateString("pt-PT", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : formatDate(resource.last_modified || resource.created_at)}{" "}
                      — {tabularData.totalCols} colunas — {tabularData.totalRows} linhas
                    </p>
                  </div>
                )}
              </div>
            </TabBody>
          </Tab>
          )}
          {isTabular && !isLoading && !error && tabularData && (
          <Tab>
            <TabHeader>Estrutura de dados</TabHeader>
            <TabBody>
              <div className="py-16">
                {isLoading ? (
                  <p className="text-neutral-900 text-sm">A carregar estrutura...</p>
                ) : error || !tabularData ? (
                  <p className="text-neutral-900 text-sm">
                    {error || "Estrutura de dados não disponível para este recurso."}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-24">
                    {tabularData.columns.map((col, i) => (
                      <div key={i}>
                        <p className="text-sm font-bold text-neutral-900 mb-4">{col.name}</p>
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
            <TabHeader>Metadados</TabHeader>
            <TabBody>
              <div className="py-16 space-y-32">
                <CopyField label="URL" value={resource.url} />
                {resource.latest && (
                  <CopyField label="URL estável" value={resource.latest} />
                )}
                <CopyField label="Identificador" value={resource.id} />
                {resource.checksum && (
                  <CopyField
                    label={resource.checksum.type}
                    value={resource.checksum.value}
                  />
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px 64px", paddingTop: "32px" }}>
                  <div>
                    <h5 className="font-bold text-sm text-neutral-900 mb-4">Criado em</h5>
                    <p className="text-neutral-900 text-sm">
                      {formatDate(resource.created_at)}
                    </p>
                  </div>
                  {resource.filesize !== undefined && resource.filesize > 0 && (
                    <div>
                      <h5 className="font-bold text-sm text-neutral-900 mb-4">Tamanho</h5>
                      <p className="text-neutral-900 text-sm">
                        {formatBytes(resource.filesize)}
                      </p>
                    </div>
                  )}
                  {resource.last_modified && (
                    <div>
                      <h5 className="font-bold text-sm text-neutral-900 mb-4">Modificado em</h5>
                      <p className="text-neutral-900 text-sm">
                        {formatDate(resource.last_modified)}
                      </p>
                    </div>
                  )}
                  {resource.type && (
                    <div>
                      <h5 className="font-bold text-sm text-neutral-900 mb-4">Tipo</h5>
                      <p className="text-neutral-900 text-sm">
                        {RESOURCE_TYPE_LABELS[resource.type] || resource.type}
                      </p>
                    </div>
                  )}
                  {resource.mime && (
                    <div>
                      <h5 className="font-bold text-sm text-neutral-900 mb-4">Tipo MIME</h5>
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
                            Recursos extras
                          </span>
                        }
                        headingLevel="h5"
                      >
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px 64px", padding: "16px" }}>
                          {Object.entries(resource.extras).map(([key, value]) => (
                            <div key={key}>
                              <h6 className="font-bold text-sm text-neutral-900 mb-8">
                                {translateExtrasKey(key)}
                              </h6>
                              <p className="text-neutral-900 text-sm break-all">
                                {translateExtrasValue(value)}
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
            <TabHeader>Downloads</TabHeader>
            <TabBody>
              <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: "24px" }}>
                <div>
                  <p className="text-sm text-neutral-900 font-bold" style={{ marginBottom: "12px" }}>
                    Formato original
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <a
                      href={downloadUrl(resource)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 text-sm hover:underline flex items-center"
                      style={{ gap: "8px" }}
                    >
                      <Icon name="agora-line-download" aria-hidden="true" />
                      Formato {(resource.format || "").toUpperCase()}
                      {resource.filesize !== undefined && resource.filesize > 0
                        ? ` - ${formatBytes(resource.filesize)}`
                        : ""}
                    </a>
                    <button
                      type="button"
                      className="text-primary-600 hover:text-primary-800 cursor-pointer shrink-0"
                      title="Copiar URL"
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

const ResourceCard: React.FC<{
  resource: Resource;
  isExpanded: boolean;
  onToggle: () => void;
  authorName?: string;
  authorUrl?: string;
  isOrganization?: boolean;
}> = ({ resource, isExpanded, onToggle, authorName, authorUrl, isOrganization }) => {
  return (
    <div className="bg-white flex flex-col mx-[136px] mt-16">
      <div className="flex flex-col gap-16 p-32">
        <h4 className="text-base font-bold text-neutral-900 inline-flex items-center gap-8">
          {resource.title}
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(resource.title)}
            className="text-primary-600 hover:text-primary-800 cursor-pointer shrink-0"
            aria-label="Copiar título"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: "20px", height: "20px", minWidth: "20px" }}
              aria-hidden="true"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        </h4>
        <p className="text-base text-neutral-900">
          Atualizado em {formatDate(resource.created_at)}
        </p>
        {authorName && (
          <p className="text-sm text-neutral-900">
            Por{" "}
            {authorUrl ? (
              <a href={authorUrl} className="text-primary-600 hover:underline">
                {authorName}
              </a>
            ) : (
              <span>{authorName}</span>
            )}
          </p>
        )}
        <div className="flex items-center">
          <a
            href={downloadUrl(resource)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-8 text-primary-600 hover:underline"
          >
            <Icon name="agora-line-document" className="w-6 h-6" />
            <span>
              Formato {resource.format || "Ficheiro"}{" "}
              {resource.filesize ? `(${formatBytes(resource.filesize)})` : ""}
            </span>
          </a>
          <a
            href={downloadUrl(resource)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Descarregar ${resource.title}`}
            className="ml-auto"
          >
            <Icon name="agora-line-arrow-down-circle" className="w-6 h-6 text-primary-600" />
          </a>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex items-center gap-8 text-primary-600 hover:underline cursor-pointer py-8"
        >
          <Icon
            name={isExpanded ? "agora-line-chevron-up" : "agora-line-chevron-down"}
            className="w-6 h-6"
          />
          <span>{isExpanded ? "Ver menos" : "Ver mais"}</span>
        </button>
      </div>
      {isExpanded && (
        <div className="px-32 pb-32">
          <ResourceExpandedContent resource={resource} />
        </div>
      )}
      <div className="h-px w-full bg-neutral-200" />
    </div>
  );
};

export const DatasetResourcesTable: React.FC<DatasetResourcesTableProps> = ({
  resources,
  communityResources,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const documentationFiles = resources.filter((r) => r.type === "documentation");
  const principalFiles = resources.filter((r) => r.type !== "documentation");

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getAuthorInfo = (cr: CommunityResource) => {
    if (cr.organization) {
      return {
        name: cr.organization.name,
        url: `/pages/organizations/${cr.organization.slug || cr.organization.id}`,
        isOrg: true,
      };
    }
    if (cr.owner) {
      const fullName = `${cr.owner.first_name} ${cr.owner.last_name}`.trim();
      return {
        name: fullName || cr.owner.slug,
        url: `/pages/users/${cr.owner.slug || cr.owner.id}`,
        isOrg: false,
      };
    }
    return null;
  };

  return (
    <div className="space-y-32">
      {principalFiles.length > 0 && (
        <div className="space-y-16">
          <h3 className="font-medium text-neutral-900 text-base">
            {principalFiles.length}{" "}
            {principalFiles.length === 1 ? "FICHEIRO PRINCIPAL" : "FICHEIROS PRINCIPAIS"}
          </h3>
          <div className="flex flex-col">
            {principalFiles.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                isExpanded={expandedId === resource.id}
                onToggle={() => handleToggle(resource.id)}
              />
            ))}
          </div>
        </div>
      )}

      {documentationFiles.length > 0 && (
        <div className="space-y-16 mt-16 mb-16">
          <h3 className="font-medium text-neutral-900 text-base">
            {documentationFiles.length} DOCUMENTAÇÃO
          </h3>
          <div className="flex flex-col">
            {documentationFiles.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                isExpanded={expandedId === resource.id}
                onToggle={() => handleToggle(resource.id)}
              />
            ))}
          </div>
        </div>
      )}

      {communityResources && communityResources.length > 0 && (
        <div className="flex flex-col">
          {communityResources.map((cr) => {
            const author = getAuthorInfo(cr);
            return (
              <ResourceCard
                key={cr.id}
                resource={cr as unknown as Resource}
                isExpanded={expandedId === cr.id}
                onToggle={() => handleToggle(cr.id)}
                authorName={author?.name}
                authorUrl={author?.url}
                isOrganization={author?.isOrg}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
