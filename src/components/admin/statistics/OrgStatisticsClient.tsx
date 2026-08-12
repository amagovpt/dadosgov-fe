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
import type { BoStatisticsPage } from "@/service/types/admin/statistics";
import type { AdminCard } from "@/service/types/admin/common";

interface OrgStatisticsClientProps {
  orgId: string;
  pageContent: BoStatisticsPage;
}

const PAGE_SIZE = 10;

type SummaryCardValue = {
  isLoading?: boolean;
  value: number | string;
};

function getSummaryCardLabel(card: AdminCard, value?: SummaryCardValue) {
  if (value) return value.isLoading ? "..." : String(value.value);
  return card.bignumber?.number ?? card.subtitle ?? "0";
}

export default function OrgStatisticsClient({ orgId, pageContent }: OrgStatisticsClientProps) {
  const { t } = useTranslation(["admin-common", "admin-statistics"]);
  const orgCards = pageContent.orgSummaryCards ?? [];
  const [org, setOrg] = useState<Organization | null>(null);
  const [metrics, setMetrics] = useState<OrganizationMetrics | null>(null);
  const [isOrgLoading, setIsOrgLoading] = useState(true);

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [datasetsTotal, setDatasetsTotal] = useState(0);
  const [datasetsPage, setDatasetsPage] = useState(1);
  const [datasetsPageSize, setDatasetsPageSize] = useState(PAGE_SIZE);
  const [isDatasetsLoading, setIsDatasetsLoading] = useState(true);

  const [dataservices, setDataservices] = useState<Dataservice[]>([]);
  const [dataservicesTotal, setDataservicesTotal] = useState(0);
  const [dataservicesPage, setDataservicesPage] = useState(1);
  const [dataservicesPageSize, setDataservicesPageSize] = useState(PAGE_SIZE);
  const [isDataservicesLoading, setIsDataservicesLoading] = useState(true);

  const [reuses, setReuses] = useState<Reuse[]>([]);
  const [reusesPage, setReusesPage] = useState(1);
  const [reusesPageSize, setReusesPageSize] = useState(PAGE_SIZE);
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
        const res = await fetchOrgDatasets(orgId, datasetsPage, datasetsPageSize);
        setDatasets(res.data);
        setDatasetsTotal(res.total);
      } catch (error) {
        console.error("Error loading org datasets:", error);
      } finally {
        setIsDatasetsLoading(false);
      }
    }
    loadDatasets();
  }, [orgId, datasetsPage, datasetsPageSize]);

  useEffect(() => {
    async function loadDataservices() {
      setIsDataservicesLoading(true);
      try {
        const res = await fetchOrgDataservices(orgId, dataservicesPage, dataservicesPageSize);
        setDataservices(res.data);
        setDataservicesTotal(res.total);
      } catch (error) {
        console.error("Error loading org dataservices:", error);
      } finally {
        setIsDataservicesLoading(false);
      }
    }
    loadDataservices();
  }, [orgId, dataservicesPage, dataservicesPageSize]);

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

  const reusesPagedData = reuses.slice(
    (reusesPage - 1) * reusesPageSize,
    reusesPage * reusesPageSize
  );
  const orgSummaryCardValues = [
    { isLoading: isDatasetsLoading, value: datasetsTotal },
    { isLoading: isDataservicesLoading, value: dataservicesTotal },
    { isLoading: isReusesLoading, value: reuses.length },
    { value: metrics?.views ?? 0 },
    { value: metrics?.resource_downloads ?? 0 },
    { value: metrics?.dataservice_views ?? 0 },
    { value: metrics?.reuse_views ?? 0 },
  ];

  if (!isOrgLoading && !org) {
    return (
      <AdminEmptyState
        icon="agora-line-buildings"
        title={pageContent.noOrganizations?.title ?? ""}
        description={pageContent.noOrganizations?.description ?? ""}
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
      title={pageContent.orgHero?.title ?? ""}
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
              <div className="flex flex-wrap gap-24">
                {orgCards.map((card, index) => (
                  <div key={`${card.title}-${index}`} className="min-w-[220px] flex-1">
                    <CardFrame label={getSummaryCardLabel(card, orgSummaryCardValues[index])}>
                      <p className="text-base text-neutral-700">{card.title}</p>
                    </CardFrame>
                  </div>
                ))}
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
                    label={pageContent.datasetsSearch?.label ?? ""}
                    placeholder={pageContent.datasetsSearch?.placeholder ?? ""}
                    aria-label={pageContent.datasetsSearch?.label ?? ""}
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
                  title={pageContent.datasetsNoResults?.title ?? ""}
                  description={pageContent.datasetsNoResults?.description ?? ""}
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
                  pageSize={datasetsPageSize}
                  onPageSizeChange={setDatasetsPageSize}
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
                    label={pageContent.dataservicesSearch?.label ?? ""}
                    placeholder={pageContent.dataservicesSearch?.placeholder ?? ""}
                    aria-label={pageContent.dataservicesSearch?.label ?? ""}
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
                  title={pageContent.dataservicesNoResults?.title ?? ""}
                  description={pageContent.dataservicesNoResults?.description ?? ""}
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
                    dataservicesPageSize,
                    dataservicesTotal,
                    dataservicesPage,
                    setDataservicesPage,
                    setDataservicesPageSize,
                    {
                      itemsPerPageLabel: t("admin-common:pagination.itemsPerPage"),
                      buttonDropdownAriaLabel: t("admin-common:pagination.selectItemsPerPage"),
                      dropdownListAriaLabel: t("admin-common:pagination.itemsPerPageOptions"),
                      prevButtonAriaLabel: t("admin-common:pagination.previous"),
                      nextButtonAriaLabel: t("admin-common:pagination.next"),
                    }
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
                    label={pageContent.reusesSearch?.label ?? ""}
                    placeholder={pageContent.reusesSearch?.placeholder ?? ""}
                    aria-label={pageContent.reusesSearch?.label ?? ""}
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
                  title={pageContent.reusesNoResults?.title ?? ""}
                  description={pageContent.reusesNoResults?.description ?? ""}
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
                  pageSize={reusesPageSize}
                  onPageSizeChange={setReusesPageSize}
                />
              )}
            </div>
          </TabBody>
        </Tab>
      </Tabs>
    </AdminLayout>
  );
}
