"use client";

import { useEffect, useState } from "react";
import {
  Breadcrumb,
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
import {
  fetchOrgDatasets,
  fetchOrgDataservices,
  fetchOrgMetrics,
  fetchOrgReuses,
  fetchOrganization,
} from "@/services/api";
import { Dataset, Dataservice, Organization, OrganizationMetrics, Reuse } from "@/types/api";
import PublishDropdown from "@/components/admin/PublishDropdown";

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
      <div className="admin-page">
        <CardNoResults
          className="datasets-page__empty"
          position="center"
          icon={
            <Icon name="agora-line-buildings" className="w-12 h-12 text-primary-500 icon-xl" />
          }
          title="Sem organizações"
          description="Não pertence a nenhuma organização."
          hasAnchor={false}
        />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: org?.name || "Organização", url: "#" },
            { label: "Estatísticas", url: "/pages/admin/org/statistics" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">Estatísticas</h1>
        <PublishDropdown />
      </div>

      <Tabs>
        <Tab active>
          <TabHeader>Organização</TabHeader>
          <TabBody>
            <div className="mt-48">
              <div className="flex justify-end mb-24">
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
              <div className="flex gap-24 mb-24">
                <div className="flex-1">
                  <CardFrame label={isDatasetsLoading ? "..." : String(datasetsTotal)}>
                    <p className="text-neutral-700 text-base">Conjuntos de dados</p>
                  </CardFrame>
                </div>
                <div className="flex-1">
                  <CardFrame label={isDataservicesLoading ? "..." : String(dataservicesTotal)}>
                    <p className="text-neutral-700 text-base">API</p>
                  </CardFrame>
                </div>
                <div className="flex-1">
                  <CardFrame label={isReusesLoading ? "..." : String(reuses.length)}>
                    <p className="text-neutral-700 text-base">Reutilizações</p>
                  </CardFrame>
                </div>
              </div>
              <div className="flex gap-24">
                <div className="flex-1">
                  <CardFrame label={String(metrics?.views ?? 0)}>
                    <p className="text-neutral-700 text-base">Visitas ao conjunto de dados</p>
                  </CardFrame>
                </div>
                <div className="flex-1">
                  <CardFrame label={String(metrics?.resource_downloads ?? 0)}>
                    <p className="text-neutral-700 text-base">Downloads de dados</p>
                  </CardFrame>
                </div>
                <div className="flex-1">
                  <CardFrame label={String(metrics?.dataservice_views ?? 0)}>
                    <p className="text-neutral-700 text-base">Passeios pela API</p>
                  </CardFrame>
                </div>
                <div className="flex-1">
                  <CardFrame label={String(metrics?.reuse_views ?? 0)}>
                    <p className="text-neutral-700 text-base">Visitas a locais de reutilização</p>
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
              <div className="flex items-end gap-16 mb-24">
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
                <p className="text-neutral-500 text-sm">A carregar...</p>
              ) : datasets.length === 0 ? (
                <CardNoResults
                  position="center"
                  icon={
                    <Icon name="agora-line-edit" className="w-12 h-12 text-primary-500 icon-xl" />
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
                <Table
                  paginationProps={{
                    itemsPerPageLabel: "Itens por página",
                    itemsPerPage: PAGE_SIZE,
                    totalItems: datasetsTotal,
                    availablePageSizes: [5, 10, 20],
                    currentPage: datasetsPage - 1,
                    buttonDropdownAriaLabel: "Selecionar itens por página",
                    dropdownListAriaLabel: "Opções de itens por página",
                    prevButtonAriaLabel: "Página anterior",
                    nextButtonAriaLabel: "Próxima página",
                    onPageChange: (page: number) => setDatasetsPage(page + 1),
                  }}
                >
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>TÍTULO DO CONJUNTO DE DADOS</TableHeaderCell>
                      <TableHeaderCell>
                        <Icon name="agora-line-chat" className="w-16 h-16" />
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <Icon name="agora-line-eye" className="w-16 h-16" />
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <Icon name="agora-line-download" className="w-16 h-16" />
                      </TableHeaderCell>
                      <TableHeaderCell>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/Icons/bar_chart.svg" alt="Reutilizações" className="w-16 h-16" />
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <Icon name="agora-line-star" className="w-16 h-16" />
                      </TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {datasets.map((dataset) => (
                      <TableRow key={dataset.id}>
                        <TableCell headerLabel="Título">
                          <a href={dataset.page} className="text-primary-600 underline">
                            {dataset.title}
                          </a>
                        </TableCell>
                        <TableCell headerLabel="Discussões">
                          {dataset.metrics?.discussions ?? 0}
                        </TableCell>
                        <TableCell headerLabel="Visualizações">
                          {dataset.metrics?.views ?? 0}
                        </TableCell>
                        <TableCell headerLabel="Downloads">
                          {dataset.metrics?.resources_downloads ?? 0}
                        </TableCell>
                        <TableCell headerLabel="Reutilizações">
                          {dataset.metrics?.reuses ?? 0}
                        </TableCell>
                        <TableCell headerLabel="Favoritos">
                          {dataset.metrics?.followers ?? 0}
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
          <TabHeader>API</TabHeader>
          <TabBody>
            <div className="mt-24">
              <div className="flex items-end gap-16 mb-24">
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
                <p className="text-neutral-500 text-sm">A carregar...</p>
              ) : dataservices.length === 0 ? (
                <CardNoResults
                  position="center"
                  icon={
                    <Icon name="agora-line-edit" className="w-12 h-12 text-primary-500 icon-xl" />
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
                  paginationProps={{
                    itemsPerPageLabel: "Itens por página",
                    itemsPerPage: PAGE_SIZE,
                    totalItems: dataservicesTotal,
                    availablePageSizes: [5, 10, 20],
                    currentPage: dataservicesPage - 1,
                    buttonDropdownAriaLabel: "Selecionar itens por página",
                    dropdownListAriaLabel: "Opções de itens por página",
                    prevButtonAriaLabel: "Página anterior",
                    nextButtonAriaLabel: "Próxima página",
                    onPageChange: (page: number) => setDataservicesPage(page + 1),
                  }}
                >
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>TÍTULO DA API</TableHeaderCell>
                      <TableHeaderCell>
                        <Icon name="agora-line-eye" className="w-16 h-16" />
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <Icon name="agora-line-star" className="w-16 h-16" />
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
                        <TableCell headerLabel="Visualizações">
                          {ds.metrics?.views ?? 0}
                        </TableCell>
                        <TableCell headerLabel="Favoritos">
                          {ds.metrics?.followers ?? 0}
                        </TableCell>
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
              <div className="flex items-end gap-16 mb-24">
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
                <p className="text-neutral-500 text-sm">A carregar...</p>
              ) : reuses.length === 0 ? (
                <CardNoResults
                  position="center"
                  icon={
                    <Icon name="agora-line-edit" className="w-12 h-12 text-primary-500 icon-xl" />
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
                <Table
                  paginationProps={{
                    itemsPerPageLabel: "Itens por página",
                    itemsPerPage: PAGE_SIZE,
                    totalItems: reuses.length,
                    availablePageSizes: [5, 10, 20],
                    currentPage: reusesPage - 1,
                    buttonDropdownAriaLabel: "Selecionar itens por página",
                    dropdownListAriaLabel: "Opções de itens por página",
                    prevButtonAriaLabel: "Página anterior",
                    nextButtonAriaLabel: "Próxima página",
                    onPageChange: (page: number) => setReusesPage(page + 1),
                  }}
                >
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>TÍTULO DA REUTILIZAÇÃO</TableHeaderCell>
                      <TableHeaderCell>
                        <Icon name="agora-line-eye" className="w-16 h-16" />
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <Icon name="agora-line-star" className="w-16 h-16" />
                      </TableHeaderCell>
                      <TableHeaderCell>ESTADO</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reusesPagedData.map((reuse) => (
                      <TableRow key={reuse.id}>
                        <TableCell headerLabel="Título">
                          <a href={reuse.url} className="text-primary-600 underline">
                            {reuse.title}
                          </a>
                        </TableCell>
                        <TableCell headerLabel="Visualizações">
                          {reuse.metrics?.views ?? 0}
                        </TableCell>
                        <TableCell headerLabel="Favoritos">
                          {reuse.metrics?.followers ?? 0}
                        </TableCell>
                        <TableCell headerLabel="Estado">
                          {reuse.private ? "Privado" : reuse.archived ? "Arquivado" : "Público"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabBody>
        </Tab>
      </Tabs>
    </div>
  );
}
