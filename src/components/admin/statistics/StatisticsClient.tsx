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
import { useCurrentUser } from "@/hooks/useCurrentUser";
import AdminLayout from "@/components/Layout/AdminLayout";
import { fetchMyDatasets } from "@/service/api/datasets";
import { fetchMyReuses } from "@/service/api/reuses";
import type { Dataset } from "@/service/types/dataset";
import type { Reuse } from "@/service/types/reuse";
import { DatasetMetricsTable } from "./DatasetMetricsTable";
import { ReuseMetricsTable } from "./ReuseMetricsTable";

const PAGE_SIZE = 10;

export default function StatisticsClient() {
  const { t } = useTranslation(["admin-common", "admin-statistics"]);
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
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: displayName || "...", url: "#" },
        { label: t("admin-statistics:breadcrumbs.user"), url: "/admin/me/statistics" },
      ]}
      title={t("admin-statistics:title")}
      headerAction={null}
    >
      <Tabs>
        <Tab active>
          <TabHeader>{t("admin-statistics:tabs.user")}</TabHeader>
          <TabBody>
            <div className="mt-48 flex gap-24">
              <div className="flex-1">
                <CardFrame label={isDatasetsLoading ? "..." : String(datasetsTotal)}>
                  <p className="text-base text-neutral-700">{t("admin-statistics:cards.datasets")}</p>
                </CardFrame>
              </div>
              <div className="flex-1">
                <CardFrame label={isReusesLoading ? "..." : String(reusesTotal)}>
                  <p className="text-base text-neutral-700">{t("admin-statistics:cards.reuses")}</p>
                </CardFrame>
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
              </div>

              {isDatasetsLoading ? (
                <p className="text-sm text-neutral-500">{t("admin-statistics:states.loading")}</p>
              ) : datasets.length === 0 ? (
                <CardNoResults
                  position="center"
                  icon={
                    <img src="/Icons/reduce.svg" alt="" className="h-40 w-40" />
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
          <TabHeader>{t("admin-statistics:tabs.reuses")}</TabHeader>
          <TabBody>
            <div className="mt-24">
              {isReusesLoading ? (
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
