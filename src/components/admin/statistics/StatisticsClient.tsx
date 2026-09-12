"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  CardFrame,
  CardNoResults,
  InputSearchBar,
  Tabs,
  Tab,
  TabHeader,
  TabBody,
} from "@ama-pt/agora-design-system";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/components/Layout/AdminLayout";
import { buildUserAdminBreadcrumbItems } from "@/utils/adminBreadcrumbs";
import { fetchMyDataservices } from "@/service/api/dataservices";
import { fetchMyDatasets } from "@/service/api/datasets";
import { fetchMyReuses } from "@/service/api/reuses";
import { useDebouncedSearch } from "@/hooks/admin-lists/useDebouncedSearch";
import type { Dataset } from "@/service/types/dataset";
import type { Reuse } from "@/service/types/reuse";
import { DatasetMetricsTable } from "./DatasetMetricsTable";
import { ReuseMetricsTable } from "./ReuseMetricsTable";
import type { BoStatisticsPage } from "@/service/types/admin/statistics";
import type { AdminCard } from "@/service/types/admin/common";

const PAGE_SIZE = 10;

type SummaryCardValue = {
  isLoading?: boolean;
  value: number | string;
};

function getSummaryCardLabel(card: AdminCard, value?: SummaryCardValue) {
  if (value) return value.isLoading ? "..." : String(value.value);
  return card.bignumber?.number ?? card.subtitle ?? "0";
}

interface StatisticsClientProps {
  pageContent: BoStatisticsPage;
}

export default function StatisticsClient({ pageContent }: StatisticsClientProps) {
  const { t } = useTranslation(["admin-common", "admin-statistics"]);
  const { user, isLoading: isUserLoading } = useAuth();
  const displayName = user ? `${user.first_name} ${user.last_name}` : "";
  const userCards = pageContent.userSummaryCards ?? [];
  const [activeTab, setActiveTab] = useState(0);

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [datasetsTotal, setDatasetsTotal] = useState(0);
  const [datasetsPage, setDatasetsPage] = useState(1);
  const [datasetsPageSize, setDatasetsPageSize] = useState(PAGE_SIZE);
  const [isDatasetsLoading, setIsDatasetsLoading] = useState(true);
  const [datasetsSearch, setDatasetsSearch] = useState("");

  const [dataservicesTotal, setDataservicesTotal] = useState(0);
  const [isDataservicesLoading, setIsDataservicesLoading] = useState(true);

  const [reuses, setReuses] = useState<Reuse[]>([]);
  const [reusesTotal, setReusesTotal] = useState(0);
  const [reusesPage, setReusesPage] = useState(1);
  const [reusesPageSize, setReusesPageSize] = useState(PAGE_SIZE);
  const [isReusesLoading, setIsReusesLoading] = useState(true);
  const [reusesSearch, setReusesSearch] = useState("");

  const userSummaryCardValues = [
    { isLoading: isDatasetsLoading, value: datasetsTotal },
    { isLoading: isDataservicesLoading, value: dataservicesTotal },
    { isLoading: isReusesLoading, value: reusesTotal },
  ];

  useEffect(() => {
    async function loadDatasets() {
      if (isUserLoading) return;
      if (!user?.id) {
        setDatasets([]);
        setDatasetsTotal(0);
        setIsDatasetsLoading(false);
        return;
      }
      setIsDatasetsLoading(true);
      try {
        const result = await fetchMyDatasets(
          datasetsPage,
          datasetsPageSize,
          datasetsSearch,
        );
        setDatasets(result.data);
        setDatasetsTotal(result.total);
      } catch (error) {
        console.error("Error loading dataset statistics:", error);
      } finally {
        setIsDatasetsLoading(false);
      }
    }
    void loadDatasets();
  }, [datasetsPage, datasetsPageSize, datasetsSearch, isUserLoading, user]);

  useEffect(() => {
    async function loadReuses() {
      if (isUserLoading) return;
      if (!user?.id) {
        setReuses([]);
        setReusesTotal(0);
        setIsReusesLoading(false);
        return;
      }
      setIsReusesLoading(true);
      try {
        const result = await fetchMyReuses(
          reusesPage,
          reusesPageSize,
          reusesSearch
        );
        setReuses(result.data);
        setReusesTotal(result.total);
      } catch (error) {
        console.error("Error loading reuse statistics:", error);
      } finally {
        setIsReusesLoading(false);
      }
    }
    void loadReuses();
  }, [isUserLoading, reusesPage, reusesPageSize, reusesSearch, user]);
  useEffect(() => {
    async function loadDataservicesTotal() {
      setIsDataservicesLoading(true);
      try {
        const result = await fetchMyDataservices(1, 1);
        setDataservicesTotal(result.total);
      } catch (error) {
        console.error("Error loading dataservice statistics:", error);
      } finally {
        setIsDataservicesLoading(false);
      }
    }
    void loadDataservicesTotal();
  }, []);

  const handleDatasetsSearch = useDebouncedSearch((value: string) => {
    setDatasetsSearch(value);
    setDatasetsPage(1);
  });
  const handleReusesSearch = useDebouncedSearch((value: string) => {
    setReusesSearch(value);
    setReusesPage(1);
  });

  return (
    <AdminLayout
      breadcrumbItems={buildUserAdminBreadcrumbItems({
        t,
        userLabel: displayName,
        sectionLabel: t("admin-statistics:breadcrumbs.user"),
      })}
      title={pageContent.userHero?.title ?? ""}
      headerAction={null}
    >
      <Tabs onTabActivation={setActiveTab}>
        <Tab active={activeTab === 0}>
          <TabHeader>{t("admin-statistics:tabs.user")}</TabHeader>
          <TabBody>
            <div className="mt-48 flex flex-wrap gap-24">
              {userCards.map((card, index) => (
                <div key={`${card.title}-${index}`} className="min-w-[220px] flex-1">
                  <CardFrame label={getSummaryCardLabel(card, userSummaryCardValues[index])}>
                    <p className="text-base text-neutral-700">{card.title}</p>
                  </CardFrame>
                </div>
              ))}
            </div>
          </TabBody>
        </Tab>

        <Tab active={activeTab === 1}>
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
                    onChange={(event) => handleDatasetsSearch(event.target.value)}
                  />
                </div>
              </div>

              {isDatasetsLoading && datasets.length === 0 ? (
                <p className="text-sm text-neutral-500">{t("admin-statistics:states.loading")}</p>
              ) : datasets.length === 0 ? (
                <CardNoResults
                  position="center"
                  icon={
                    <img src="/Icons/reduce.svg" alt="" className="h-40 w-40" />
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

        <Tab active={activeTab === 2}>
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
                    onChange={(event) => handleReusesSearch(event.target.value)}
                  />
                </div>
              </div>
              {isReusesLoading && reuses.length === 0 ? (
                <p className="text-sm text-neutral-500">{t("admin-statistics:states.loading")}</p>
              ) : reuses.length === 0 ? (
                <>
                  <p className="text-sm mb-16 text-neutral-700">
                    {t("admin-statistics:states.results", { count: 0 })}
                  </p>
                  <CardNoResults
                    position="center"
                    icon={
                      <img src="/Icons/bar_chart.svg" alt="" className="h-40 w-40" />
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
                </>
              ) : (
                <>
                  <p className="text-sm mb-16 text-neutral-700">
                    {t("admin-statistics:states.results", { count: reusesTotal })}
                  </p>
                  <ReuseMetricsTable
                    reuses={reuses}
                    total={reusesTotal}
                    page={reusesPage}
                    onPageChange={setReusesPage}
                    pageSize={reusesPageSize}
                    onPageSizeChange={setReusesPageSize}
                  />
                </>
              )}
            </div>
          </TabBody>
        </Tab>
      </Tabs>
    </AdminLayout>
  );
}
