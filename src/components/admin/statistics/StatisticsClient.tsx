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
import { useCurrentUser } from "@/hooks/useCurrentUser";
import AdminLayout from "@/components/Layout/AdminLayout";
import { fetchMyDatasets, fetchMyReuses } from "@/services/api";
import { Dataset, Reuse } from "@/types/api";
import TextLink from "@/components/Primitives/TextLink";
import { createPaginationProps } from "@/utils/createPaginationProps";

const PAGE_SIZE = 10;

export default function StatisticsClient() {
  const { displayName } = useCurrentUser();

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [datasetsTotal, setDatasetsTotal] = useState(0);
  const [datasetsPage, setDatasetsPage] = useState(1);
  const [isDatasetsLoading, setIsDatasetsLoading] = useState(true);

  const [reuses, setReuses] = useState<Reuse[]>([]);
  const [reusesTotal, setReusesTotal] = useState(0);
  const [reusesPage, setReusesPage] = useState(1);
  const [isReusesLoading, setIsReusesLoading] = useState(true);

  useEffect(() => {
    async function loadDatasets() {
      setIsDatasetsLoading(true);
      try {
        const res = await fetchMyDatasets(datasetsPage, PAGE_SIZE);
        setDatasets(res.data);
        setDatasetsTotal(res.total);
      } catch (error) {
        console.error("Error loading datasets:", error);
      } finally {
        setIsDatasetsLoading(false);
      }
    }
    loadDatasets();
  }, [datasetsPage]);

  useEffect(() => {
    async function loadReuses() {
      setIsReusesLoading(true);
      try {
        const res = await fetchMyReuses(reusesPage, PAGE_SIZE);
        setReuses(res.data);
        setReusesTotal(res.total);
      } catch (error) {
        console.error("Error loading reuses:", error);
      } finally {
        setIsReusesLoading(false);
      }
    }
    loadReuses();
  }, [reusesPage]);

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: displayName || "...", url: "#" },
        { label: "Estatísticas", url: "/pages/admin/me/statistics" },
      ]}
      title="Estatísticas"
      headerAction={null}
    >

      <Tabs>
        <Tab active>
          <TabHeader>Utilizador</TabHeader>
          <TabBody>
            <div className="mt-48 flex gap-24">
              <div className="flex-1">
                <CardFrame label={isDatasetsLoading ? "..." : String(datasetsTotal)}>
                  <p className="text-base text-neutral-700">Conjuntos de dados</p>
                </CardFrame>
              </div>
              <div className="flex-1">
                <CardFrame label={isReusesLoading ? "..." : String(reusesTotal)}>
                  <p className="text-base text-neutral-700">Reutilizar</p>
                </CardFrame>
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
              </div>

              {isDatasetsLoading ? (
                <p className="text-sm text-neutral-500">A carregar...</p>
              ) : datasets.length === 0 ? (
                <CardNoResults
                  position="center"
                  icon={
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/Icons/reduce.svg" alt="" className="h-40 w-40" />
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
                  paginationProps={createPaginationProps(
                    PAGE_SIZE,
                    datasetsTotal,
                    datasetsPage,
                    setDatasetsPage
                  )}
                >
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>TÍTULO DO CONJUNTO DE DADOS</TableHeaderCell>
                      <TableHeaderCell>
                        <Icon name="agora-line-chat" className="h-16 w-16" />
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <Icon name="agora-line-eye" className="h-16 w-16" />
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <Icon name="agora-line-download" className="h-16 w-16" />
                      </TableHeaderCell>
                      <TableHeaderCell>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/Icons/bar_chart.svg" alt="Reutilizações" className="h-16 w-16" />
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <Icon name="agora-line-star" className="h-16 w-16" />
                      </TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {datasets.map((dataset) => (
                      <TableRow key={dataset.id}>
                        <TableCell headerLabel="Título">
                          <TextLink href={dataset.page}>{dataset.title}</TextLink>
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
          <TabHeader>Reutilizar</TabHeader>
          <TabBody>
            <div className="mt-24">
              {isReusesLoading ? (
                <p className="text-sm text-neutral-500">A carregar...</p>
              ) : reuses.length === 0 ? (
                <>
                  <p className="text-sm mb-16 text-neutral-700">0 resultados</p>
                  <CardNoResults
                    position="center"
                    icon={
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src="/Icons/bar_chart.svg" alt="" className="h-40 w-40" />
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
                </>
              ) : (
                <>
                  <p className="text-sm mb-16 text-neutral-700">{reusesTotal} resultados</p>
                  <Table
                  paginationProps={createPaginationProps(
                    PAGE_SIZE,
                    reusesTotal,
                    reusesPage,
                    setReusesPage
                  )}
                  >
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell>TÍTULO DA REUTILIZAÇÃO</TableHeaderCell>
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
                      {reuses.map((reuse) => (
                        <TableRow key={reuse.id}>
                          <TableCell headerLabel="Título">
                            <TextLink href={reuse.url}>{reuse.title}</TextLink>
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
                </>
              )}
            </div>
          </TabBody>
        </Tab>
      </Tabs>
    </AdminLayout>
  );
}
