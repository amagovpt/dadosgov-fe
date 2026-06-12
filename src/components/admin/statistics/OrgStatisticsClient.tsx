"use client";

import { useEffect, useState } from "react";
import {
  Button,
  CardFrame,
  CardNoResults,
  Icon,
  InputSearchBar,
  Tabs,
  Tab,
  TabHeader,
  TabBody,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import { fetchOrgDataservices } from "@/service/api/dataservices";
import { fetchOrgDatasets, fetchOrgMetrics, fetchOrgReuses, fetchOrganization } from "@/service/api/organizations";
import type { Dataservice } from "@/service/types/dataservice";
import type { Dataset } from "@/service/types/dataset";
import type { Organization, OrganizationMetrics } from "@/service/types/identity";
import type { Reuse } from "@/service/types/reuse";
import AdminLayout from "@/components/Layout/AdminLayout";
import { createPaginationProps } from "@/utils/createPaginationProps";
import AdminEmptyState from "../AdminEmptyState";
import { DatasetMetricsTable } from "./DatasetMetricsTable";
import { ReuseMetricsTable } from "./ReuseMetricsTable";

interface OrgStatisticsClientProps {
  orgId: string;
}

const PAGE_SIZE = 10;

export default function OrgStatisticsClient({ orgId }: OrgStatisticsClientProps) {
  const [org, setOrg] = useState<Organization | null>(null);
  const [metrics, setMetrics] = useState<OrganizationMetrics | null>(null);
  const [isOrgLoading, setIsOrgLoading] = useState(true);

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [datasetsTotal, setDatasetsTotal] = useState(0);
  const [datasetsPage, setDatasetsPage] = useState(1);
  const [isDatasetsLoading, setIsDatasetsLoading] = useState(true);

  const [dataservices, setDataservices] = useState<Dataservice[]>([]);
  const [dataservicesTotal, setDataservicesTotal] = useState(0);
  const [dataservicesPage, setDataservicesPage] = useState(1);
  const [isDataservicesLoading, setIsDataservicesLoading] = useState(true);

  const [reuses, setReuses] = useState<Reuse[]>([]);
  const [reusesPage, setReusesPage] = useState(1);
  const [isReusesLoading, setIsReusesLoading] = useState(true);

  useEffect(() => {
    async function loadOrgData() {
      setIsOrgLoading(true);
      try {
        const [orgData, metricsData] = await Promise.all([
          fetchOrganization(orgId),
          fetchOrgMetrics(orgId),
        ]);
        setOrg(orgData);
        setMetrics(metricsData);
      } catch (error) {
        console.error("Error loading org statistics:", error);
      } finally {
        setIsOrgLoading(false);
      }
    }
    loadOrgData();
  }, [orgId]);

  useEffect(() => {
    async function loadDatasets() {
      setIsDatasetsLoading(true);
      try {
        const res = await fetchOrgDatasets(orgId, datasetsPage, PAGE_SIZE);
        setDatasets(res.data);
        setDatasetsTotal(res.total);
      } catch (error) {
        console.error("Error loading org datasets:", error);
      } finally {
        setIsDatasetsLoading(false);
      }
    }
    loadDatasets();
  }, [orgId, datasetsPage]);

  useEffect(() => {
    async function loadDataservices() {
      setIsDataservicesLoading(true);
      try {
        const res = await fetchOrgDataservices(orgId, dataservicesPage, PAGE_SIZE);
        setDataservices(res.data);
        setDataservicesTotal(res.total);
      } catch (error) {
        console.error("Error loading org dataservices:", error);
      } finally {
        setIsDataservicesLoading(false);
      }
    }
    loadDataservices();
  }, [orgId, dataservicesPage]);

  useEffect(() => {
    async function loadReuses() {
      setIsReusesLoading(true);
      try {
        const data = await fetchOrgReuses(orgId);
        setReuses(data);
      } catch (error) {
        console.error("Error loading org reuses:", error);
      } finally {
        setIsReusesLoading(false);
      }
    }
    loadReuses();
  }, [orgId]);

  const reusesPagedData = reuses.slice((reusesPage - 1) * PAGE_SIZE, reusesPage * PAGE_SIZE);

  if (!isOrgLoading && !org) {
    return (
      <AdminEmptyState
        icon="agora-line-buildings"
        title="Sem organizações"
        description="Não pertence a nenhuma organização."
      />
    );
  }

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: org?.name || "Organização", url: "#" },
        { label: "Estatísticas", url: "/pages/admin/org/statistics" },
      ]}
      title="Estatísticas"
    >

      <Tabs>
        <Tab active>
          <TabHeader>Organização</TabHeader>
          <TabBody>
            <div className="mt-48">
              <div className="mb-24 flex justify-end">
                <Button
                  variant="neutral"
                  appearance="outline"
                  hasIcon={true}
                  leadingIcon="agora-line-download"
                  leadingIconHover="agora-solid-download"
                >
                  Estatísticas agregadas
                </Button>
              </div>
              <div className="mb-24 flex gap-24">
                <div className="flex-1">
                  <CardFrame label={isDatasetsLoading ? "..." : String(datasetsTotal)}>
                    <p className="text-base text-neutral-700">Conjuntos de dados</p>
                  </CardFrame>
                </div>
                <div className="flex-1">
                  <CardFrame label={isDataservicesLoading ? "..." : String(dataservicesTotal)}>
                    <p className="text-base text-neutral-700">API</p>
                  </CardFrame>
                </div>
                <div className="flex-1">
                  <CardFrame label={isReusesLoading ? "..." : String(reuses.length)}>
                    <p className="text-base text-neutral-700">Reutilizações</p>
                  </CardFrame>
                </div>
              </div>
              <div className="flex gap-24">
                <div className="flex-1">
                  <CardFrame label={String(metrics?.views ?? 0)}>
                    <p className="text-base text-neutral-700">Visitas ao conjunto de dados</p>
                  </CardFrame>
                </div>
                <div className="flex-1">
                  <CardFrame label={String(metrics?.resource_downloads ?? 0)}>
                    <p className="text-base text-neutral-700">Downloads de dados</p>
                  </CardFrame>
                </div>
                <div className="flex-1">
                  <CardFrame label={String(metrics?.dataservice_views ?? 0)}>
                    <p className="text-base text-neutral-700">Passeios pela API</p>
                  </CardFrame>
                </div>
                <div className="flex-1">
                  <CardFrame label={String(metrics?.reuse_views ?? 0)}>
                    <p className="text-base text-neutral-700">Visitas a locais de reutilização</p>
                  </CardFrame>
                </div>
              </div>
            </div>
          </TabBody>
        </Tab>

        <Tab>
          <TabHeader>Conjuntos de dados</TabHeader>
          <TabBody>
            <div className="mt-24">
              <div className="mb-24 flex items-end gap-16">
                <div className="admin-search-wrapper">
                  <InputSearchBar
                    hasVoiceActionButton={false}
                    label="Pesquisar"
                    placeholder="Pesquise o nome do conjunto de dados"
                    aria-label="Pesquisar conjuntos de dados"
                  />
                </div>
                <Button
                  variant="primary"
                  appearance="outline"
                  hasIcon={true}
                  leadingIcon="agora-line-download"
                  leadingIconHover="agora-solid-download"
                >
                  Relatório
                </Button>
                <Button
                  variant="primary"
                  appearance="outline"
                  hasIcon={true}
                  leadingIcon="agora-line-download"
                  leadingIconHover="agora-solid-download"
                >
                  Catálogo
                </Button>
              </div>

              {isDatasetsLoading ? (
                <p className="text-sm text-neutral-500">A carregar...</p>
              ) : datasets.length === 0 ? (
                <CardNoResults
                  position="center"
                  icon={
                    <Icon name="agora-line-edit" className="icon-xl h-12 w-12 text-primary-500" />
                  }
                  title="Sem publicações"
                  description="Ainda não publicou um conjunto de dados."
                  hasAnchor={false}
                  extraDescription={
                    <div className="mt-24">
                      <Button
                        variant="primary"
                        appearance="outline"
                        onClick={() => (window.location.href = "/pages/admin/datasets/new")}
                      >
                        Publique no portal
                      </Button>
                    </div>
                  }
                />
              ) : (
                <DatasetMetricsTable
                  datasets={datasets}
                  total={datasetsTotal}
                  page={datasetsPage}
                  onPageChange={setDatasetsPage}
                />
              )}
            </div>
          </TabBody>
        </Tab>

        <Tab>
          <TabHeader>API</TabHeader>
          <TabBody>
            <div className="mt-24">
              <div className="mb-24 flex items-end gap-16">
                <div className="admin-search-wrapper">
                  <InputSearchBar
                    hasVoiceActionButton={false}
                    label="Pesquisar"
                    placeholder="Pesquise o nome da API"
                    aria-label="Pesquisar APIs"
                  />
                </div>
                <Button
                  variant="primary"
                  appearance="outline"
                  hasIcon={true}
                  leadingIcon="agora-line-download"
                  leadingIconHover="agora-solid-download"
                >
                  Catálogo
                </Button>
              </div>

              {isDataservicesLoading ? (
                <p className="text-sm text-neutral-500">A carregar...</p>
              ) : dataservices.length === 0 ? (
                <CardNoResults
                  position="center"
                  icon={
                    <Icon name="agora-line-edit" className="icon-xl h-12 w-12 text-primary-500" />
                  }
                  title="Sem publicações"
                  description="Ainda não publicou uma API."
                  hasAnchor={false}
                  extraDescription={
                    <div className="mt-24">
                      <Button
                        variant="primary"
                        appearance="outline"
                        onClick={() => (window.location.href = "/pages/admin/dataservices/new")}
                      >
                        Publique no portal
                      </Button>
                    </div>
                  }
                />
              ) : (
                <Table
                  paginationProps={createPaginationProps(
                    PAGE_SIZE,
                    dataservicesTotal,
                    dataservicesPage,
                    setDataservicesPage
                  )}
                >
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>TÍTULO DA API</TableHeaderCell>
                      <TableHeaderCell>
                        <Icon name="agora-line-eye" className="h-16 w-16" />
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <Icon name="agora-line-star" className="h-16 w-16" />
                      </TableHeaderCell>
                      <TableHeaderCell>ESTADO</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataservices.map((ds) => (
                      <TableRow key={ds.id}>
                        <TableCell headerLabel="Título">
                          <span className="text-primary-600">{ds.title}</span>
                        </TableCell>
                        <TableCell headerLabel="Visualizações">{ds.metrics?.views ?? 0}</TableCell>
                        <TableCell headerLabel="Favoritos">{ds.metrics?.followers ?? 0}</TableCell>
                        <TableCell headerLabel="Estado">
                          {ds.private ? "Privado" : ds.archived ? "Arquivado" : "Público"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabBody>
        </Tab>

        <Tab>
          <TabHeader>Reutilizações</TabHeader>
          <TabBody>
            <div className="mt-24">
              <div className="mb-24 flex items-end gap-16">
                <div className="admin-search-wrapper">
                  <InputSearchBar
                    hasVoiceActionButton={false}
                    label="Pesquisar"
                    placeholder="Pesquise o nome da reutilização"
                    aria-label="Pesquisar reutilizações"
                  />
                </div>
              </div>

              {isReusesLoading ? (
                <p className="text-sm text-neutral-500">A carregar...</p>
              ) : reuses.length === 0 ? (
                <CardNoResults
                  position="center"
                  icon={
                    <Icon name="agora-line-edit" className="icon-xl h-12 w-12 text-primary-500" />
                  }
                  title="Sem publicações"
                  description="Ainda não publicou uma reutilização."
                  hasAnchor={false}
                  extraDescription={
                    <div className="mt-24">
                      <Button
                        variant="primary"
                        appearance="outline"
                        onClick={() => (window.location.href = "/pages/admin/reuses/new")}
                      >
                        Publique no portal
                      </Button>
                    </div>
                  }
                />
              ) : (
                <ReuseMetricsTable
                  reuses={reusesPagedData}
                  total={reuses.length}
                  page={reusesPage}
                  onPageChange={setReusesPage}
                />
              )}
            </div>
          </TabBody>
        </Tab>
      </Tabs>
    </AdminLayout>
  );
}
