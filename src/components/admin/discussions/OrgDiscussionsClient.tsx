"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { usePopupContext } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import {
  createDateSorter,
  createLocaleStringSorter,
  paginateItems,
  sortItems,
} from "@/utils/admin-lists/listHelpers";
import { useAdminListController } from "@/hooks/admin-lists/useAdminListController";
import { fetchOrgDiscussions } from "@/service/api/discussions-topics";
import { Discussion } from "@/service/types/discussion";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import DiscussionDetailPopup from "@/components/admin/discussions/DiscussionDetailPopup";
import AdminEmptyState from "../AdminEmptyState";
import {
  createOrgDiscussionColumns,
  DISCUSSIONS_FETCH_PAGE_SIZE,
  type DiscussionSortField,
} from "./discussionsListConfig";
import type { BoDiscussionsPage } from "@/service/types/admin/discussions";

const formatDate = (dateStr: string) => {
  try {
    return format(new Date(dateStr), "d 'de' MMMM 'de' yyyy HH:mm", { locale: pt });
  } catch {
    return dateStr;
  }
};

interface OrgDiscussionsClientProps {
  orgId: string;
  pageContent: BoDiscussionsPage;
}

export default function OrgDiscussionsClient({ orgId, pageContent }: OrgDiscussionsClientProps) {
  const { t } = useTranslation(["admin-common", "admin-discussions"]);
  const { user } = useAuth();
  const { show } = usePopupContext();
  const orgName = useViewedOrganizationName(orgId, user?.organizations);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sortField,
    sortOrder,
    handleSort,
    getSortOrder,
  } = useAdminListController<DiscussionSortField>({
    initialFilters: {},
  });

  useEffect(() => {
    async function loadDiscussions() {
      setIsLoading(true);
      try {
        const data = await fetchOrgDiscussions(orgId, 1, DISCUSSIONS_FETCH_PAGE_SIZE);
        setDiscussions(data.data ?? []);
      } catch (error) {
        console.error("Error loading discussions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadDiscussions();
  }, [orgId]);

  const sortedDiscussions = useMemo(
    () =>
      sortItems(discussions, sortField, sortOrder, {
        title: createLocaleStringSorter((discussion) => discussion.title),
        created: createDateSorter((discussion) => discussion.created),
        closed: createDateSorter((discussion) => discussion.closed),
      }),
    [discussions, sortField, sortOrder],
  );

  const paginatedDiscussions = useMemo(
    () => paginateItems(sortedDiscussions, currentPage, pageSize),
    [sortedDiscussions, currentPage, pageSize],
  );

  const openDiscussion = (discussion: Discussion) => {
    show(
      <DiscussionDetailPopup
        discussion={discussion}
        onUpdated={(updated) =>
          setDiscussions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        }
        onDeleted={() => setDiscussions((prev) => prev.filter((item) => item.id !== discussion.id))}
      />,
      {
        title: t("admin-discussions:popup.title"),
        closeAriaLabel: t("admin-common:deleteAccount.closeAriaLabel"),
        dimensions: "l",
      },
    );
  };

  const columns = useMemo(
    () =>
      createOrgDiscussionColumns({
        onOpenDiscussion: openDiscussion,
        formatDate,
        labels: {
          title: t("admin-discussions:columns.title"),
          author: t("admin-discussions:columns.author"),
          status: t("admin-discussions:columns.status"),
          date: t("admin-discussions:columns.date"),
          messages: t("admin-discussions:columns.messages"),
          createdAt: t("admin-discussions:columns.createdAt"),
          closedAt: t("admin-discussions:columns.closedAt"),
          open: t("admin-discussions:status.open"),
          closed: t("admin-discussions:status.closed"),
        },
      }),
    [t],
  );

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: orgName || t("admin-common:breadcrumbs.organization"), url: "#" },
        { label: t("admin-discussions:title") },
      ]}
      title={pageContent.orgHero?.title ?? ""}
      isLoading={isLoading}
      count={discussions.length}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      emptyState={
        <AdminEmptyState
          icon="agora-line-chat"
          title={pageContent.orgNoResults?.title ?? ""}
          description={pageContent.orgNoResults?.description ?? ""}
        />
      }
    >
      <AdminListTable
        items={paginatedDiscussions}
        columns={columns}
        getSortOrder={getSortOrder}
        handleSort={handleSort}
        getRowKey={(discussion) => discussion.id}
        getRowClassName={() => "cursor-pointer hover:bg-neutral-50"}
        onRowClick={openDiscussion}
      />
    </AdminListPage>
  );
}
