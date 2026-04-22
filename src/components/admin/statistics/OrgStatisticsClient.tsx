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
} from "@ama-pt/agora-design-system";
import { fetchOrgMetrics, fetchOrganization } from "@/services/api";
import { Organization, OrganizationMetrics } from "@/types/api";
import PublishDropdown from "@/components/admin/PublishDropdown";

interface OrgStatisticsClientProps {
  orgId: string;
}

export default function OrgStatisticsClient({ orgId }: OrgStatisticsClientProps) {
  const [org, setOrg] = useState<Organization | null>(null);
  const [metrics, setMetrics] = useState<OrganizationMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
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
        setIsLoading(false);
      }
    }
    loadData();
  }, [orgId]);

  if (!isLoading && !org) {
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

      <p className="text-neutral-700 text-sm leading-relaxed mb-[24px]">
        As estatísticas foram compiladas a partir de julho de 2022
        <br />
        e atualizadas esta manhã.
      </p>

      <Tabs>
        <Tab active>
          <TabHeader>Organização</TabHeader>
          <TabBody>
            <div className="mt-[48px]">
              <div className="flex justify-end mb-[24px]">
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
              <div className="flex gap-[24px] mb-[24px]">
                <div className="flex-1">
                  <CardFrame label={String(metrics?.datasets ?? 0)}>
                    <p className="text-neutral-700 text-base">Conjuntos de dados</p>
                  </CardFrame>
                </div>
                <div className="flex-1">
                  <CardFrame label={String(metrics?.dataservices ?? 0)}>
                    <p className="text-neutral-700 text-base">API</p>
                  </CardFrame>
                </div>
                <div className="flex-1">
                  <CardFrame label={String(metrics?.reuses ?? 0)}>
                    <p className="text-neutral-700 text-base">Reutilizações</p>
                  </CardFrame>
                </div>
              </div>
              <div className="flex gap-[24px]">
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
            <div className="mt-[24px]">
              <div className="flex items-end gap-[16px] mb-[24px]">
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
              <CardNoResults
                position="center"
                icon={
                  <Icon name="agora-line-edit" className="w-12 h-12 text-primary-500 icon-xl" />
                }
                title="Sem publicações"
                description="Você ainda não publicou um conjunto de dados."
                hasAnchor={false}
                extraDescription={
                  <div className="mt-24">
                    <Button
                      variant="primary"
                      appearance="outline"
                      onClick={() => window.location.href = "/pages/admin/datasets/new"}
                    >
                      Publique no portal
                    </Button>
                  </div>
                }
              />
            </div>
          </TabBody>
        </Tab>
        <Tab>
          <TabHeader>API</TabHeader>
          <TabBody>
            <div className="mt-[24px]">
              <div className="flex items-end gap-[16px] mb-[24px]">
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
              <CardNoResults
                position="center"
                icon={
                  <Icon name="agora-line-edit" className="w-12 h-12 text-primary-500 icon-xl" />
                }
                title="Sem publicações"
                description="Você ainda não publicou uma API."
                hasAnchor={false}
                extraDescription={
                  <div className="mt-24">
                    <Button
                      variant="primary"
                      appearance="outline"
                      onClick={() => window.location.href = "/pages/admin/dataservices/new"}
                    >
                      Publique no portal
                    </Button>
                  </div>
                }
              />
            </div>
          </TabBody>
        </Tab>
        <Tab>
          <TabHeader>Reutilizações</TabHeader>
          <TabBody>
            <div className="mt-[24px]">
              <div className="flex items-end gap-[16px] mb-[24px]">
                <div className="admin-search-wrapper">
                  <InputSearchBar
                    hasVoiceActionButton={false}
                    label="Pesquisar"
                    placeholder="Pesquise o nome da reutilização"
                    aria-label="Pesquisar reutilizações"
                  />
                </div>
              </div>
              <CardNoResults
                position="center"
                icon={
                  <Icon name="agora-line-edit" className="w-12 h-12 text-primary-500 icon-xl" />
                }
                title="Sem publicações"
                description="Você ainda não publicou uma reutilização."
                hasAnchor={false}
                extraDescription={
                  <div className="mt-24">
                    <Button
                      variant="primary"
                      appearance="outline"
                      onClick={() => window.location.href = "/pages/admin/reuses/new"}
                    >
                      Publique no portal
                    </Button>
                  </div>
                }
              />
            </div>
          </TabBody>
        </Tab>
      </Tabs>
    </div>
  );
}
