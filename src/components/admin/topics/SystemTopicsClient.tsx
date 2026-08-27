"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CardNoResults, Icon } from "@ama-pt/agora-design-system";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import { useAdminListController } from "@/hooks/admin-lists/useAdminListController";
import {
  createTopicColumns,
  topicSortFieldMap,
  type TopicSortField,
} from "./topicsListConfig";
import { fetchTopics } from "@/service/api/discussions-topics";
import { Topic } from "@/service/types/topic";
import type { BoTopicsPage } from "@/service/types/admin/topics";

interface SystemTopicsClientProps {
  pageContent: BoTopicsPage;
}

export default function SystemTopicsClient({ pageContent }: SystemTopicsClientProps) {
  const { t } = useTranslation(["admin-common", "admin-topics"]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sortParam,
    getSortOrder,
    handleSort,
  } = useAdminListController<TopicSortField>({
    initialFilters: {},
    sortFieldMap: topicSortFieldMap,
  });

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      try {
        const response = await fetchTopics(currentPage, pageSize, sortParam);
        if (!isActive) return;
        setTopics(response.data || []);
        setTotalItems(response.total || 0);
      } catch (error) {
        if (!isActive) return;
        console.error("Error loading topics:", error);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      isActive = false;
    };
  }, [currentPage, pageSize, sortParam]);

  const columns = useMemo(
    () =>
      createTopicColumns({
        name: t("admin-topics:columns.name"),
        createdAt: t("admin-topics:columns.createdAt"),
        datasets: t("admin-topics:columns.datasets"),
        reuses: t("admin-topics:columns.reuses"),
      }),
    [t]
  );

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: t("admin-common:breadcrumbs.system"), url: "#" },
        { label: t("admin-topics:title"), url: "/admin/system/topics" },
      ]}
      title={pageContent.systemHero?.title ?? ""}
      isLoading={isLoading}
      count={totalItems}
      hasItems={topics.length > 0}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      emptyState={
        <CardNoResults
          position="center"
          icon={<Icon name="agora-line-tag" className="icon-xl h-12 w-12 text-primary-500" />}
          title={pageContent.systemNoResults?.title ?? ""}
          description={pageContent.systemNoResults?.description ?? ""}
          hasAnchor={false}
        />
      }
    >
      <AdminListTable
        items={topics}
        columns={columns}
        getRowKey={(topic) => topic.id}
        getSortOrder={getSortOrder}
        handleSort={handleSort}
      />
    </AdminListPage>
  );
}
