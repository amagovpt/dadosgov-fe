"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["admin-common", "admin-statistics"]);
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
        title={t("admin-statistics:states.noOrganizations")}
        description={t("admin-statistics:states.noOrganizationDescription")}
      />
    );
  }

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: org?.name || t("admin-statistics:tabs.organization"), url: "#" },
        { label: t("admin-statistics:breadcrumbs.organization"), url: "/admin/org/statistics" },
      ]}
      title={t("admin-statistics:title")}
    >
      <Tabs>
        <Tab active>
          <TabHeader>{t("admin-statistics:tabs.organization")}</TabHeader>
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
                  {t("admin-statistics:actions.aggregatedStatistics")}
                </Button>
              </div>
              <div className="mb-24 flex gap-24">
                <div className="flex-1">
                  <CardFrame label={isDatasetsLoading ? "..." : String(datasetsTotal)}>
                    <p className="text-base text-neutral-700">{t("admin-statistics:cards.datasets")}</p>
                  </CardFrame>
                </div>
                <div className="flex-1">
                  <CardFrame label={isDataservicesLoading ? "..." : String(dataservicesTotal)}>
                    <p className="text-base text-neutral-700">{t("admin-statistics:cards.dataservices")}</p>
                  </CardFrame>
                </div>
                <div className="flex-1">
                  <CardFrame label={isReusesLoading ? "..." : String(reuses.length)}>
                    <p className="text-base text-neutral-700">{t("admin-statistics:cards.reuses")}</p>
                  </CardFrame>
                </div>
              </div>
              <div className="flex gap-24">
                <div className="flex-1">
                  <CardFrame label={String(metrics?.views ?? 0)}>
                    <p className="text-base text-neutral-700">{t("admin-statistics:cards.datasetViews")}</p>
                  </CardFrame>
                </div>
                <div className="flex-1">
                  <CardFrame label={String(metrics?.resource_downloads ?? 0)}>
                    <p className="text-base text-neutral-700">{t("admin-statistics:cards.resourceDownloads")}</p>
                  </CardFrame>
                </div>
                <div className="flex-1">
                  <CardFrame label={String(metrics?.dataservice_views ?? 0)}>
                    <p className="text-base text-neutral-700">{t("admin-statistics:cards.dataserviceViews")}</p>
                  </CardFrame>
                </div>
                <div className="flex-1">
                  <CardFrame label={String(metrics?.reuse_views ?? 0)}>
                    <p className="text-base text-neutral-700">{t("admin-statistics:cards.reuseViews")}</p>
                  </CardFrame>
                </div>
              </div>
            </div>
          </TabBody>
        </Tab>

        <Tab>
          <TabHeader>{t("admin-statistics:tabs.datasets")}</TabHeader>
          <TabBody>
            <div className="mt-24">
              <div className="mb-24 flex items-end gap-16">
                <div className="admin-search-wrapper">
                  <InputSearchBar
                    hasVoiceActionButton={false}
                    label={t("admin-statistics:search.label")}
                    placeholder={t("admin-statistics:search.datasetsPlaceholder")}
                    aria-label={t("admin-statistics:search.datasetsAriaLabel")}
                  />
                </div>
                <Button
                  variant="primary"
                  appearance="outline"
                  hasIcon={true}
                  leadingIcon="agora-line-download"
                  leadingIconHover="agora-solid-download"
                >
                  {t("admin-statistics:actions.report")}
                </Button>
                <Button
                  variant="primary"
                  appearance="outline"
                  hasIcon={true}
                  leadingIcon="agora-line-download"
                  leadingIconHover="agora-solid-download"
                >
                  {t("admin-statistics:actions.catalog")}
                </Button>
              </div>

              {isDatasetsLoading ? (
                <p className="text-sm text-neutral-500">{t("admin-statistics:states.loading")}</p>
              ) : datasets.length === 0 ? (
                <CardNoResults
                  position="center"
                  icon={
                    <Icon name="agora-line-edit" className="icon-xl h-12 w-12 text-primary-500" />
                  }
                  title={t("admin-statistics:states.noPublications")}
                  description={t("admin-statistics:states.noDatasetsDescription")}
                  hasAnchor={false}
                  extraDescription={
                    <div className="mt-24">
                      <Button
                        variant="primary"
                        appearance="outline"
                        onClick={() => (window.location.href = "/admin/datasets/new")}
                      >
                        {t("admin-statistics:actions.publishOnPortal")}
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
          <TabHeader>{t("admin-statistics:tabs.dataservices")}</TabHeader>
          <TabBody>
            <div className="mt-24">
              <div className="mb-24 flex items-end gap-16">
                <div className="admin-search-wrapper">
                  <InputSearchBar
                    hasVoiceActionButton={false}
                    label={t("admin-statistics:search.label")}
                    placeholder={t("admin-statistics:search.dataservicesPlaceholder")}
                    aria-label={t("admin-statistics:search.dataservicesAriaLabel")}
                  />
                </div>
                <Button
                  variant="primary"
                  appearance="outline"
                  hasIcon={true}
                  leadingIcon="agora-line-download"
                  leadingIconHover="agora-solid-download"
                >
                  {t("admin-statistics:actions.catalog")}
                </Button>
              </div>

              {isDataservicesLoading ? (
                <p className="text-sm text-neutral-500">{t("admin-statistics:states.loading")}</p>
              ) : dataservices.length === 0 ? (
                <CardNoResults
                  position="center"
                  icon={
                    <Icon name="agora-line-edit" className="icon-xl h-12 w-12 text-primary-500" />
                  }
                  title={t("admin-statistics:states.noPublications")}
                  description={t("admin-statistics:states.noDataservicesDescription")}
                  hasAnchor={false}
                  extraDescription={
                    <div className="mt-24">
                      <Button
                        variant="primary"
                        appearance="outline"
                        onClick={() => (window.location.href = "/admin/dataservices/new")}
                      >
                        {t("admin-statistics:actions.publishOnPortal")}
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
                      <TableHeaderCell>{t("admin-statistics:table.dataserviceTitle")}</TableHeaderCell>
                      <TableHeaderCell>
                        <Icon name="agora-line-eye" className="h-16 w-16" />
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <Icon name="agora-line-star" className="h-16 w-16" />
                      </TableHeaderCell>
                      <TableHeaderCell>{t("admin-statistics:table.status")}</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataservices.map((ds) => (
                      <TableRow key={ds.id}>
                        <TableCell headerLabel={t("admin-statistics:table.title")}>
                          <span className="text-primary-600">{ds.title}</span>
                        </TableCell>
                        <TableCell headerLabel={t("admin-statistics:table.views")}>{ds.metrics?.views ?? 0}</TableCell>
                        <TableCell headerLabel={t("admin-statistics:table.favorites")}>
                          {ds.metrics?.followers ?? 0}
                        </TableCell>
                        <TableCell headerLabel={t("admin-statistics:table.status")}>
                          {ds.private
                            ? t("admin-statistics:status.private")
                            : ds.archived_at
                              ? t("admin-statistics:status.archived")
                              : t("admin-statistics:status.public")}
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
          <TabHeader>{t("admin-statistics:tabs.reuses")}</TabHeader>
          <TabBody>
            <div className="mt-24">
              <div className="mb-24 flex items-end gap-16">
                <div className="admin-search-wrapper">
                  <InputSearchBar
                    hasVoiceActionButton={false}
                    label={t("admin-statistics:search.label")}
                    placeholder={t("admin-statistics:search.reusesPlaceholder")}
                    aria-label={t("admin-statistics:search.reusesAriaLabel")}
                  />
                </div>
              </div>

              {isReusesLoading ? (
                <p className="text-sm text-neutral-500">{t("admin-statistics:states.loading")}</p>
              ) : reuses.length === 0 ? (
                <CardNoResults
                  position="center"
                  icon={
                    <Icon name="agora-line-edit" className="icon-xl h-12 w-12 text-primary-500" />
                  }
                  title={t("admin-statistics:states.noPublications")}
                  description={t("admin-statistics:states.noReusesDescription")}
                  hasAnchor={false}
                  extraDescription={
                    <div className="mt-24">
                      <Button
                        variant="primary"
                        appearance="outline"
                        onClick={() => (window.location.href = "/admin/reuses/new")}
                      >
                        {t("admin-statistics:actions.publishOnPortal")}
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
