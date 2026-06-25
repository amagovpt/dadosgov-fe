"use client";

import { useEffect, useMemo, useState } from "react";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import { paginateItems } from "@/utils/admin-lists/listHelpers";
import { useAdminListController } from "@/hooks/admin-lists/useAdminListController";
import { fetchOrgDiscussions } from "@/service/api/discussions-topics";
import type { Discussion } from "@/service/types/discussion";
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
    let frameId: number | null = null;
    let isCancelled = false;

    if (!activeOrg) {
      frameId = requestAnimationFrame(() => {
        setIsLoading(false);
      });
      return () => {
        isCancelled = true;
        if (frameId !== null) cancelAnimationFrame(frameId);
      };
    }
    const orgId = activeOrg.id;

    async function loadDiscussions() {
      try {
        const { data } = await fetchOrgDiscussions(orgId);
        if (!isCancelled && data) setDiscussions(data);
      } catch (error) {
        console.error("Error loading discussions:", error);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    void loadDiscussions();

    return () => {
      isCancelled = true;
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
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

