"use client";

import { useEffect, useMemo, useState } from "react";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import { paginateItems } from "@/components/admin/lists/listHelpers";
import { useAdminListController } from "@/components/admin/lists/useAdminListController";
import { fetchOrgDiscussions } from "@/services/api";
import type { Discussion } from "@/types/api";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import AdminEmptyState from "../AdminEmptyState";
import { createDiscussionColumns } from "./discussionsListConfig";

export default function DiscussionsClient() {
  const { activeOrg, isLoading: isOrgLoading } = useActiveOrganization();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentPage, setCurrentPage, pageSize, setPageSize } = useAdminListController({
    initialFilters: {},
  });

  useEffect(() => {
    if (!activeOrg) {
      setIsLoading(false);
      return;
    }
    const orgId = activeOrg.id;

    async function loadDiscussions() {
      try {
        const { data } = await fetchOrgDiscussions(orgId);
        if (data) setDiscussions(data);
      } catch (error) {
        console.error("Error loading discussions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadDiscussions();
  }, [activeOrg]);

  const columns = useMemo(() => createDiscussionColumns(), []);
  const paginatedDiscussions = useMemo(
    () => paginateItems(discussions, currentPage, pageSize),
    [discussions, currentPage, pageSize]
  );

  if (isOrgLoading || isLoading) {
    return <div className="admin-page">A carregar...</div>;
  }

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: activeOrg?.name || "Organização", url: "#" },
        { label: "Discussões", url: "/pages/admin/org/discussions" },
      ]}
      title="Discussões"
      isLoading={false}
      count={discussions.length}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      emptyState={
        <AdminEmptyState
          icon="agora-line-chat"
          description="Ainda não há discussões sobre esta organização."
        />
      }
    >
      <AdminListTable
        items={paginatedDiscussions}
        columns={columns}
        getRowKey={(discussion) => discussion.id}
      />
    </AdminListPage>
  );
}
