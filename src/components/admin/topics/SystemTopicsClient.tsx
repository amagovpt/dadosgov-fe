"use client";

import { useEffect, useMemo, useState } from "react";
import { CardNoResults, Icon } from "@ama-pt/agora-design-system";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import { useAdminListController } from "@/hooks/admin-lists/useAdminListController";
import { createTopicColumns } from "./topicsListConfig";
import { fetchTopics } from "@/service/api/discussions-topics";
import { Topic } from "@/service/types/topic";

export default function SystemTopicsClient() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { currentPage, setCurrentPage, pageSize, setPageSize } = useAdminListController({
    initialFilters: {},
  });

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      try {
        const response = await fetchTopics(currentPage, pageSize);
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
  }, [currentPage, pageSize]);

  const columns = useMemo(() => createTopicColumns(), []);

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: "Administração", url: "/admin" },
        { label: "Sistema", url: "#" },
        { label: "Temas", url: "/admin/system/topics" },
      ]}
      title="Temas"
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
          title="Sem temas"
          description="Nenhum tema encontrado."
          hasAnchor={false}
        />
      }
    >
      <AdminListTable items={topics} columns={columns} getRowKey={(topic) => topic.id} />
    </AdminListPage>
  );
}

