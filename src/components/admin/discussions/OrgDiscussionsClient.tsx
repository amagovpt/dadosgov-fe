"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Breadcrumb,
  CardNoResults,
  Icon,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import { fetchOrgDiscussions } from "@/services/api";
import { Discussion } from "@/types/api";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import DiscussionDetailPopup from "@/components/admin/discussions/DiscussionDetailPopup";
import AdminPaginatedTable from "@/components/admin/lists/AdminPaginatedTable";
import {
  useClientTableState,
  useSortControls,
} from "@/components/admin/lists/useClientTableState";
import type { SortOrder } from "@/components/admin/lists/useClientTableState";

const formatDate = (dateStr: string) => {
  try {
    return format(new Date(dateStr), "d 'de' MMMM 'de' yyyy HH:mm", { locale: pt });
  } catch {
    return dateStr;
  }
};

type DiscussionSortField = "created" | "closed";

const DISCUSSION_SORTERS: Record<DiscussionSortField, (discussion: Discussion) => number> = {
  created: (discussion) => (discussion.created ? Date.parse(discussion.created) : 0),
  closed: (discussion) => (discussion.closed ? Date.parse(discussion.closed) : 0),
};

interface OrgDiscussionsClientProps {
  orgId: string;
}

export default function OrgDiscussionsClient({ orgId }: OrgDiscussionsClientProps) {
  const { user } = useAuth();
  const { show } = usePopupContext();
  const orgName = useViewedOrganizationName(orgId, user?.organizations);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<DiscussionSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage
  );

  useEffect(() => {
    async function loadDiscussions() {
      setIsLoading(true);
      try {
        const data = await fetchOrgDiscussions(orgId);
        setDiscussions(data.data ?? []);
      } catch (error) {
        console.error("Error loading discussions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDiscussions();
  }, [orgId]);

  const { totalItems, paginatedItems: paginatedDiscussions } = useClientTableState<
    Discussion,
    DiscussionSortField
  >({
    items: discussions,
    currentPage,
    pageSize: itemsPerPage,
    sortField,
    sortOrder,
    sorters: DISCUSSION_SORTERS,
  });

  const openDiscussion = (discussion: Discussion) => {
    show(
      <DiscussionDetailPopup
        discussion={discussion}
        onUpdated={(updated) =>
          setDiscussions((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
        }
        onDeleted={() => setDiscussions((prev) => prev.filter((d) => d.id !== discussion.id))}
      />,
      { title: "Discussão", closeAriaLabel: "Fechar", dimensions: "l" }
    );
  };

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: orgName || "Organização", url: "#" },
            { label: "Discussões", url: "#" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">Discussões</h1>
        <PublishDropdown />
      </div>

      {isLoading ? (
        <p>A carregar...</p>
      ) : discussions.length === 0 ? (
        <div className="datasets-page__body">
          <div className="datasets-page__content">
            <CardNoResults
              className="datasets-page__empty"
              position="center"
              icon={
                <Icon
                  name="agora-line-chat"
                  className="w-12 h-12 text-primary-500 icon-xl"
                />
              }
              title="Sem discussões"
              description="Ainda não há discussões sobre esta organização."
              hasAnchor={false}
            />
          </div>
        </div>
      ) : (
        <>
          <p className="text-neutral-700 text-sm font-semibold uppercase mb-24">
            {discussions.length} {discussions.length === 1 ? "discussão" : "discussões"}
          </p>

          <AdminPaginatedTable
            pageSize={itemsPerPage}
            totalItems={totalItems}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            setPageSize={setItemsPerPage}
          >
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Título</TableHeaderCell>
                <TableHeaderCell
                  sortType="date"
                  sortOrder={getSortOrder("created")}
                  onSortChange={handleSort("created")}
                >
                  Criado em
                </TableHeaderCell>
                <TableHeaderCell
                  sortType="date"
                  sortOrder={getSortOrder("closed")}
                  onSortChange={handleSort("closed")}
                >
                  Fechado em
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDiscussions.map((discussion) => (
                <TableRow
                  key={discussion.id}
                  className="cursor-pointer hover:bg-neutral-50"
                  onClick={() => openDiscussion(discussion)}
                >
                  <TableCell headerLabel="Título">
                    <button
                      className="text-primary-600 underline text-left"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDiscussion(discussion);
                      }}
                    >
                      {discussion.title}
                    </button>
                  </TableCell>
                  <TableCell headerLabel="Criado em">
                    {formatDate(discussion.created)}
                  </TableCell>
                  <TableCell headerLabel="Fechado em">
                    {discussion.closed ? formatDate(discussion.closed) : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </AdminPaginatedTable>

        </>
      )}
    </div>
  );
}
