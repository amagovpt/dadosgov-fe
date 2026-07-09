"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Tabs,
  Tab,
  TabHeader,
  CardLinks,
  CardNoResults,
  CardFrame,
  Avatar,
  Icon,
} from "@ama-pt/agora-design-system";
import { TabBodyWrapper } from "@/components/Shared/Wrappers/TabBodyWrapper";
import { TabPagination } from "@/components/Shared/TabPagination";
import { ReuseCardLinks } from "@/components/Shared/ReuseCardLinks";
import { Dataset } from "@/service/types/dataset";
import { Organization } from "@/service/types/identity";
import { Reuse } from "@/service/types/reuse";
import { Dataservice } from "@/service/types/dataservice";
import { APIResponse } from "@/service/types/shared";
import { fetchOrgDatasets, fetchOrgReuses } from "@/service/api/organizations";
import { fetchOrgDataservices } from "@/service/api/dataservices";
import { formatMetricValue } from "@/utils/formatNumber";
import { sanitizeUserMarkdown } from "@/utils/sanitizeUserMarkdown";
import { DiscussionSection } from "@/components/discussions/DiscussionSection";
import { ExpandableMarkdownDescription } from "@/components/Shared/ExpandableMarkdownDescription";
import { DataserviceCardLinks } from "@/components/Shared/DataserviceCardLinks";

interface OrganizationTabsProps {
  organization: Organization;
}

export const OrganizationTabs: React.FC<OrganizationTabsProps> = ({ organization }) => {
  const router = useRouter();

  const [datasetsResponse, setDatasetsResponse] = useState<APIResponse<Dataset> | null>(null);
  const [datasetsPage, setDatasetsPage] = useState(1);
  const [reuses, setReuses] = useState<Reuse[]>([]);
  const [dataservices, setDataservices] = useState<Dataservice[]>([]);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true);
  const [isLoadingReuses, setIsLoadingReuses] = useState(true);
  const [isLoadingDataservices, setIsLoadingDataservices] = useState(true);

  useEffect(() => {
    async function loadDatasets() {
      if (!datasetsResponse) setIsLoadingDatasets(true);
      try {
        const response = await fetchOrgDatasets(organization.slug, datasetsPage, 20, undefined, true);
        setDatasetsResponse(response);
      } catch (error) {
        console.error("Error loading organization datasets:", error);
      } finally {
        setIsLoadingDatasets(false);
      }
    }
    loadDatasets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization.slug, datasetsPage]);

  useEffect(() => {
    async function loadReuses() {
      try {
        const response = await fetchOrgReuses(organization.slug);
        setReuses(response);
      } catch (error) {
        console.error("Error loading organization reuses:", error);
      } finally {
        setIsLoadingReuses(false);
      }
    }
    loadReuses();
  }, [organization.slug]);

  useEffect(() => {
    async function loadDataservices() {
      try {
        const response = await fetchOrgDataservices(organization.id, 1, 20);
        setDataservices(response.data);
      } catch (error) {
        console.error("Error loading organization dataservices:", error);
      } finally {
        setIsLoadingDataservices(false);
      }
    }
    loadDataservices();
  }, [organization.id]);

  const datasets = datasetsResponse?.data || [];

  return (
    <div className="w-full">
      <Tabs>
        {/* Tab 1: Descrição */}
        <Tab>
          <TabHeader>Descrição</TabHeader>
          <TabBodyWrapper>
            <div className="mt-6 grid gap-32 xl:grid-cols-12">
              {/* Main Content */}
              <div className="max-w-ch xl:col-span-8">
                <div className="prose prose-lg relative max-w-none leading-relaxed text-neutral-700">
                  <h2 className="mb-32 text-base font-medium uppercase text-neutral-900">
                    Descrição
                  </h2>
                  {organization.description ? (
                    <>
                      <ExpandableMarkdownDescription
                        variant="fixedClamp"
                        markdown={organization.description}
                        maxHeightPx={400}
                      />
                    </>
                  ) : (
                    <p className="text-neutral-500">Esta organização não possui descrição.</p>
                  )}
                </div>
              </div>

              {/* Sidebar Metadata */}
              <aside className="flex flex-col gap-16 md:pt-64 xl:col-span-4 xl:block">
                <div className="rounded-4 bg-white p-32">
                  <h3 className="text-sm mb-8 font-bold tracking-wider">Data de criação</h3>
                  <p className="font-medium text-neutral-900">
                    {organization.created_at
                      ? format(new Date(organization.created_at), "d 'de' MMMM 'de' yyyy", {
                          locale: pt,
                        })
                      : "—"}
                  </p>
                </div>
              </aside>
            </div>
          </TabBodyWrapper>
        </Tab>

        {/* Tab 2: Conjuntos de dados */}
        <Tab>
          <TabHeader>
            {" "}
            Conjuntos de dados ({datasetsResponse?.total ?? organization.metrics?.datasets ?? 0})
          </TabHeader>
          <TabBodyWrapper>
            <div>
              <h3 className="mb-24 text-base font-medium text-neutral-900">
                {datasetsResponse?.total || 0}{" "}
                {(datasetsResponse?.total || 0) === 1 ? "CONJUNTO DE DADOS" : "CONJUNTOS DE DADOS"}
              </h3>
              {!isLoadingDatasets && datasets.length > 0 ? (
                <>
                  <div className="agora-card-links-datasets grid grid-cols-1 gap-32 md:grid-cols-2">
                    {datasets.map((dataset) => (
                      <div key={dataset.id} className="h-full">
                        <CardLinks
                          onClick={() => router.push(`/datasets/${dataset.slug}`)}
                          className="cursor-pointer text-neutral-900"
                          variant="white"
                          image={{
                            src:
                              dataset.organization?.logo || "/images/placeholders/organization.png",
                            alt: dataset.organization?.name || "Organização sem logo",
                          }}
                          category={dataset.organization?.name}
                          title={sanitizeUserMarkdown(dataset.title)}
                          description={
                            <div className="flex flex-col gap-12">
                              <p className="text-sm mt-8 line-clamp-3 max-w-[592px] leading-relaxed text-neutral-900">
                                {sanitizeUserMarkdown(dataset.description)}
                              </p>
                              <div className="text-xs mt-16 flex flex-wrap items-center gap-32 text-[#034AD8]">
                                <div className="flex items-center gap-8" title="Visualizações">
                                  <Icon name="agora-line-eye" aria-hidden="true" />
                                  <span>{formatMetricValue(dataset.metrics?.views, 0)}</span>
                                </div>
                                <div className="flex items-center gap-8" title="Downloads">
                                  <Icon name="agora-line-download" aria-hidden="true" />
                                  <span>
                                    {formatMetricValue(dataset.metrics?.resources_downloads, 0)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-8" title="Reutilizações">
                                  <div className="icon-bar-chart-blue" />
                                  <span>{dataset.metrics?.reuses || 0}</span>
                                </div>
                                <div className="flex items-center gap-8" title="Favoritos">
                                  <Icon name="agora-line-star" aria-hidden="true" />
                                  <span>{dataset.metrics?.followers || 0}</span>
                                </div>
                              </div>
                            </div>
                          }
                          date={
                            <span className="font-[300]">
                              {dataset.last_modified &&
                              !isNaN(new Date(dataset.last_modified).getTime())
                                ? `Atualizado há ${formatDistanceToNow(new Date(dataset.last_modified), { locale: pt })}`
                                : "Data indisponível"}
                            </span>
                          }
                          mainLink={
                            <Link href={`/datasets/${dataset.slug}`}>
                              <span className="underline">
                                {sanitizeUserMarkdown(dataset.title)}
                              </span>
                            </Link>
                          }
                          blockedLink={true}
                        />
                      </div>
                    ))}
                  </div>
                  {datasetsResponse && (
                    <TabPagination
                      total={datasetsResponse.total}
                      pageSize={datasetsResponse.page_size}
                      onChange={setDatasetsPage}
                    />
                  )}
                </>
              ) : (
                <CardNoResults
                  position="center"
                  icon={
                    <Icon name="agora-line-file" className="icon-xl h-40 w-40 text-primary-500" />
                  }
                  title="Sem conjuntos de dados"
                  description="Esta organização não possui conjuntos de dados publicados."
                  hasAnchor={false}
                />
              )}
            </div>
          </TabBodyWrapper>
        </Tab>

        {/* Tab 3: Reutilizações e APIs */}
        <Tab>
          <TabHeader>
            Reutilizações e APIs (
            {(organization.metrics?.reuses || 0) + (organization.metrics?.dataservices || 0)})
          </TabHeader>

          <TabBodyWrapper>
            {!isLoadingDataservices && dataservices.length > 0 && (
              <div className="mb-40">
                <h3 className="mb-16 text-base font-medium text-neutral-900">
                  {dataservices.length} {dataservices.length === 1 ? "API" : "APIS"}
                </h3>
                <div className="agora-card-links-datasets-px0 grid grid-cols-1 gap-32 md:grid-cols-2">
                  {dataservices.map((dataservice) => (
                    <DataserviceCardLinks key={dataservice.id} dataservice={dataservice} />
                  ))}
                </div>
              </div>
            )}
            <div>
              <h3 className="mb-16 text-base font-medium text-neutral-900">
                {reuses.length} {reuses.length === 1 ? "REUTILIZAÇÃO" : "REUTILIZAÇÕES"}
              </h3>
              {!isLoadingReuses && reuses.length > 0 ? (
                <div className="agora-card-links-datasets-px0 grid grid-cols-1 gap-32 md:grid-cols-2">
                  {reuses.map((reuse) => (
                    <ReuseCardLinks key={reuse.id} reuse={reuse} />
                  ))}
                </div>
              ) : (
                <CardNoResults
                  position="center"
                  icon={
                    <Icon name="agora-line-file" className="icon-xl h-40 w-40 text-primary-500" />
                  }
                  title="Sem reutilizações"
                  description="Nenhuma reutilização associada a esta organização."
                  hasAnchor={false}
                />
              )}
            </div>
          </TabBodyWrapper>
        </Tab>


        {/* Tab 5: Discussões */}
        <Tab>
          <TabHeader>Discussões</TabHeader>
          <TabBodyWrapper>
            <DiscussionSection entityId={organization.id} entityClass="Organization" />
          </TabBodyWrapper>
        </Tab>
        {/* Tab 6: Informações (Statistics, Members, Technical Info) */}
        <Tab>
          <TabHeader>Informações</TabHeader>
          <TabBodyWrapper>
            <div className="rounded-8 bg-white p-32">
              {/* Statistics Section */}
              <div>
                <h3 className="mb-16 text-base font-medium uppercase text-neutral-900">
                  Estatísticas
                </h3>
                <div className="flex gap-24 pb-48">
                  <div className="flex-1">
                    <CardFrame label={String(organization.metrics?.datasets || 0)}>
                      <p className="text-base">Conjuntos de dados</p>
                    </CardFrame>
                  </div>
                  <div className="flex-1">
                    <CardFrame label={String(organization.metrics?.reuses || 0)}>
                      <p className="text-base">Reutilizações</p>
                    </CardFrame>
                  </div>
                  <div className="flex-1">
                    <CardFrame label={String(organization.metrics?.followers || 0)}>
                      <p className="text-base">Seguidores</p>
                    </CardFrame>
                  </div>
                </div>
              </div>

              {/* Members Section */}
              {organization.members?.length > 0 && (
                <div style={{ marginTop: "64px" }}>
                  <h3 className="mb-16 text-base font-medium uppercase text-neutral-900">
                    Membros
                  </h3>
                  <div className="grid grid-cols-1 gap-24 md:grid-cols-3">
                    {organization.members.map((member, index) => (
                      <div key={member.user?.id || index} className="flex items-center gap-16">
                        <div className="flex-shrink-0">
                          <Avatar
                            avatarType={member.user?.avatar_thumbnail ? "image" : "initials"}
                            srcPath={
                              (member.user?.avatar_thumbnail ||
                                `${(member.user?.first_name || "")[0] || ""}${(member.user?.last_name || "")[0] || ""}`.toUpperCase()) as unknown as undefined
                            }
                            alt={`${member.user?.first_name} ${member.user?.last_name}`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate font-bold">
                            {member.user?.first_name} {member.user?.last_name}
                          </p>
                          <span className="text-xs mt-4 block font-medium text-primary-600">
                            {member.role === "admin" ? "Administrador" : "Editor"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Information Section */}
              <div className="mt-32">
                <h3 className="mb-16 text-base font-medium uppercase text-neutral-900">
                  Informações técnicas
                </h3>
                <div className="grid grid-cols-3 gap-24">
                  <div>
                    <p className="text-sm mb-8 font-bold">Atualização dos metadados</p>
                    <span className="text-sm">
                      {organization.last_modified
                        ? format(new Date(organization.last_modified), "d 'de' MMMM 'de' yyyy", {
                            locale: pt,
                          })
                        : "—"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm mb-8 font-bold">Identificador</p>
                    <span className="text-sm">{organization.id}</span>
                  </div>
                  <div>
                    <p className="text-sm mb-8 font-bold">Data de criação</p>
                    <span className="text-sm">
                      {organization.created_at
                        ? format(new Date(organization.created_at), "d 'de' MMMM 'de' yyyy", {
                            locale: pt,
                          })
                        : "—"}
                    </span>
                  </div>
                  {organization.url && (
                    <div>
                      <p className="text-sm mb-8 font-bold">Website</p>
                      <a
                        href={organization.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:underline"
                      >
                        {organization.url}
                      </a>
                    </div>
                  )}
                  {organization.business_number_id && (
                    <div>
                      <p className="text-sm mb-8 font-bold">NIF / Identificação fiscal</p>
                      <span className="text-sm">{organization.business_number_id}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabBodyWrapper>
        </Tab>
      </Tabs>
    </div>
  );
};
