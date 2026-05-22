"use client";

import { useEffect, useState, useMemo } from "react";
import {
  CardNoResults,
  Icon,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import StatusDot from "@/components/admin/StatusDot";
import { fetchOrgDiscussions } from "@/services/api";
import type { Discussion } from "@/types/api";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import AdminLayout from "@/components/Layout/AdminLayout";
import { formatDateToDMY } from "@/utils/formatDate";
import { createPaginationProps } from "@/utils/createPaginationProps";

export default function DiscussionsClient() {
  const { activeOrg, isLoading: isOrgLoading } = useActiveOrganization();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (!activeOrg) {
      setIsLoading(false);
      return;
    }

    async function loadDiscussions() {
      try {
        const { data } = await fetchOrgDiscussions(activeOrg!.id);
        if (data) setDiscussions(data);
      } catch (error) {
        console.error("Error loading discussions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDiscussions();
  }, [activeOrg]);

  const paginatedDiscussions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return discussions.slice(start, start + itemsPerPage);
  }, [discussions, currentPage, itemsPerPage]);

  if (isOrgLoading || isLoading) {
    return <div className="admin-page">A carregar...</div>;
  }

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: activeOrg?.name || "Organização", url: "#" },
        { label: "Discussões", url: "/pages/admin/org/discussions" },
      ]}
      title="Discussões"
    >

      {discussions.length === 0 ? (
        <div className="datasets-page__body">
          <div className="datasets-page__content">
            <CardNoResults
              className="datasets-page__empty"
              position="center"
              icon={<Icon name="agora-line-chat" className="datasets-page__empty-icon" />}
              description="Ainda não há discussões sobre esta organização."
            />
          </div>
        </div>
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
                <TableHeaderCell sortType="date" sortOrder="none">Título</TableHeaderCell>
                <TableHeaderCell>Autor</TableHeaderCell>
                <TableHeaderCell>Estado</TableHeaderCell>
                <TableHeaderCell sortType="date" sortOrder="none" >Data</TableHeaderCell>
                <TableHeaderCell>Mensagens</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDiscussions.map((discussion) => (
                <TableRow key={discussion.id}>
                  <TableCell headerLabel="Título">
                    <span className="font-medium">{discussion.title}</span>
                  </TableCell>
                  <TableCell headerLabel="Autor">
                    <div className="flex items-center gap-8">
                      {discussion.user?.avatar_thumbnail ? (
                        <img
                          src={discussion.user.avatar_thumbnail}
                          alt={`${discussion.user.first_name} ${discussion.user.last_name}`}
                          className="h-24 w-24 rounded-full"
                        />
                      ) : (
                        <Icon name="agora-line-user" className="h-24 w-24" />
                      )}
                      <span>
                        {discussion.user?.first_name} {discussion.user?.last_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell headerLabel="Estado">
                    {discussion.closed ? (
                      <StatusDot variant="success">FECHADA</StatusDot>
                    ) : (
                      <StatusDot variant="informative">ABERTA</StatusDot>
                    )}
                  </TableCell>
                  <TableCell headerLabel="Data">{formatDateToDMY(discussion.created)}</TableCell>
                  <TableCell headerLabel="Mensagens">
                    {discussion.discussion?.length || 0}
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
