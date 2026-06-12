"use client";

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  CardNoResults,
  Icon,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import { fetchOrgDiscussions } from "@/service/api/discussions-topics";
import { createPaginationProps } from "@/utils/createPaginationProps";
import { Discussion } from "@/service/types/discussion";
import AdminLayout from "@/components/Layout/AdminLayout";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import DiscussionDetailPopup from "@/components/admin/discussions/DiscussionDetailPopup";
import AdminEmptyState from "../AdminEmptyState";

const formatDate = (dateStr: string) => {
  try {
    return format(new Date(dateStr), "d 'de' MMMM 'de' yyyy HH:mm", { locale: pt });
  } catch {
    return dateStr;
  }
};

type SortOrder = "none" | "ascending" | "descending";
type DiscussionSortField = "created" | "closed";

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

  const handleSort = (field: DiscussionSortField) => (newOrder: SortOrder) => {
    setSortField(newOrder === "none" ? null : field);
    setSortOrder(newOrder);
    setCurrentPage(1);
  };

  const getSortOrder = (field: DiscussionSortField): SortOrder =>
    sortField === field ? sortOrder : "none";

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

  const sortedDiscussions = useMemo(() => {
    if (!sortField || sortOrder === "none") return discussions;
    const dir = sortOrder === "ascending" ? 1 : -1;
    return [...discussions].sort((a, b) => {
      const av = sortField === "created" ? a.created : a.closed;
      const bv = sortField === "created" ? b.created : b.closed;
      const at = av ? Date.parse(av) : 0;
      const bt = bv ? Date.parse(bv) : 0;
      return (at - bt) * dir;
    });
  }, [discussions, sortField, sortOrder]);

  const paginatedDiscussions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedDiscussions.slice(start, start + itemsPerPage);
  }, [sortedDiscussions, currentPage, itemsPerPage]);

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
    <AdminLayout
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: orgName || "Organização", url: "#" },
        { label: "Discussões" },
      ]}
      title="Discussões"
    >

      {isLoading ? (
        <p>A carregar...</p>
      ) : discussions.length === 0 ? (
        <AdminEmptyState
          icon="agora-line-chat"
          title="Sem discussões"
          description="Ainda não há discussões sobre esta organização."
        />
      ) : (
        <>
          <p className="text-sm mb-24 font-semibold uppercase text-neutral-700">
            {discussions.length} {discussions.length === 1 ? "discussão" : "discussões"}
          </p>

          <Table
            paginationProps={createPaginationProps(
              itemsPerPage,
              discussions.length,
              currentPage,
              setCurrentPage,
              setItemsPerPage
            )}
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
                      className="text-left text-primary-600 underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDiscussion(discussion);
                      }}
                    >
                      {discussion.title}
                    </button>
                  </TableCell>
                  <TableCell headerLabel="Criado em">{formatDate(discussion.created)}</TableCell>
                  <TableCell headerLabel="Fechado em">
                    {discussion.closed ? formatDate(discussion.closed) : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </AdminLayout>
  );
}
