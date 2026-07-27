"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["admin-common", "admin-discussions"]);
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

  const columns = useMemo(
    () =>
      createDiscussionColumns({
        title: t("admin-discussions:columns.title"),
        author: t("admin-discussions:columns.author"),
        status: t("admin-discussions:columns.status"),
        date: t("admin-discussions:columns.date"),
        messages: t("admin-discussions:columns.messages"),
        createdAt: t("admin-discussions:columns.createdAt"),
        closedAt: t("admin-discussions:columns.closedAt"),
        open: t("admin-discussions:status.open"),
        closed: t("admin-discussions:status.closed"),
      }),
    [t],
  );
  const paginatedDiscussions = useMemo(
    () => paginateItems(discussions, currentPage, pageSize),
    [discussions, currentPage, pageSize],
  );

  if (isOrgLoading || isLoading) {
    return <div className="admin-page">{t("admin-common:loading")}</div>;
  }

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: activeOrg?.name || t("admin-common:breadcrumbs.organization"), url: "#" },
        { label: t("admin-discussions:title"), url: "/admin/org/discussions" },
      ]}
      title={t("admin-discussions:title")}
      isLoading={false}
      count={discussions.length}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      emptyState={
        <AdminEmptyState
          icon="agora-line-chat"
          description={t("admin-discussions:empty.descriptionOrganization")}
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
