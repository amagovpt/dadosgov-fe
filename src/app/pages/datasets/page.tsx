import { fetchDatasets, fetchSiteInfo } from '@/services/api';
import { DatasetFilters } from '@/types/api';
import DatasetsClient from '@/components/datasets/DatasetsClient';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const page = Number(resolved?.page) || 1;

  const filters: DatasetFilters = {};
  if (resolved?.q) filters.q = String(resolved.q);
  if (resolved?.tag) filters.tag = resolved.tag;
  if (resolved?.license) filters.license = resolved.license;
  if (resolved?.format) filters.format = resolved.format;
  if (resolved?.schema) filters.schema = String(resolved.schema);
  if (resolved?.geozone) filters.geozone = String(resolved.geozone);
  if (resolved?.granularity) filters.granularity = String(resolved.granularity);
  if (resolved?.organization) filters.organization = resolved.organization;
  if (resolved?.badge) filters.badge = resolved.badge;
  if (resolved?.sort) filters.sort = String(resolved.sort);
  if (resolved?.featured) filters.featured = resolved.featured === 'true';

  // Relevance sort: when no search query, fall back to default (most recent first)
  const apiFilters = { ...filters };
  if (!apiFilters.sort && !apiFilters.q) {
    apiFilters.sort = '-created';
  }

  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const d12m = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().slice(0, 10);
  const d3y = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate()).toISOString().slice(0, 10);

  const [
    initialData, siteInfo,
    totalRes, tabularRes, structuredRes, geoRes, docsRes,
    hvdRes, d30Res, d12mRes, d3yRes,
  ] = await Promise.all([
    fetchDatasets(page, 20, apiFilters),
    fetchSiteInfo(),
    fetchDatasets(1, 1),
    fetchDatasets(1, 1, { format: ["csv", "xls", "xlsx", "ods", "parquet", "tsv"] }),
    fetchDatasets(1, 1, { format: ["json", "rdf", "xml", "sql", "ndjson", "jsonl"] }),
    fetchDatasets(1, 1, { format: ["geojson", "shp", "kml", "kmz", "gpx", "wfs", "wms"] }),
    fetchDatasets(1, 1, { format: ["pdf", "doc", "docx", "md", "txt", "odt", "rtf"] }),
    fetchDatasets(1, 1, { tag: "hvd" }),
    fetchDatasets(1, 1, { modified_since: d30 }),
    fetchDatasets(1, 1, { modified_since: d12m }),
    fetchDatasets(1, 1, { modified_since: d3y }),
  ]);

  const filterCounts: Record<string, number> = {
    formato_all: totalRes.total,
    formato_tabular: tabularRes.total,
    formato_structured: structuredRes.total,
    formato_geographic: geoRes.total,
    formato_documents: docsRes.total,
    atualizacao_all: totalRes.total,
    atualizacao_30_days: d30Res.total,
    atualizacao_12_months: d12mRes.total,
    atualizacao_3_years: d3yRes.total,
    rotulo_all: totalRes.total,
    rotulo_high_value: hvdRes.total,
  };

  return (
    <DatasetsClient
      initialData={initialData}
      currentPage={page}
      siteMetrics={siteInfo.metrics}
      initialFilters={filters}
      filterCounts={filterCounts}
    />
  );
}
