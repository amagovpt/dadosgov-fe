"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Breadcrumb,
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
import { fetchOrgDiscussions } from "@/api/discussions-topics/route";
import { Discussion } from "@/types/api";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { formatDateToDMY } from "@/utils/formatDate";

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

  const totalPages = Math.ceil(discussions.length / itemsPerPage);
  const paginatedDiscussions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return discussions.slice(start, start + itemsPerPage);
  }, [discussions, currentPage, itemsPerPage]);

  if (isOrgLoading || isLoading) {
    return <div className="admin-page">A carregar...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: activeOrg?.name || "Organização", url: "#" },
            { label: "Discussões", url: "/pages/admin/org/discussions" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">Discussões</h1>
        <PublishDropdown />
      </div>

      {discussions.length === 0 ? (
        <div className="datasets-page__body">
          <div className="datasets-page__content">
            <CardNoResults
              className="datasets-page__empty"
              position="center"
              icon={
                <Icon
                  name="agora-line-chat"
                  className="datasets-page__empty-icon"
                />
              }
              description="Ainda não há discussões sobre esta organização."
            />
          </div>
        </div>
      ) : (
        <>
          <p className="text-neutral-700 text-sm font-semibold uppercase mb-24">
            {discussions.length} {discussions.length === 1 ? "discussão" : "discussões"}
          </p>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell sortType="date" sortOrder="none">
                  Título
                </TableHeaderCell>
                <TableHeaderCell>Autor</TableHeaderCell>
                <TableHeaderCell>Estado</TableHeaderCell>
                <TableHeaderCell sortType="date" sortOrder="none">
                  Data
                </TableHeaderCell>
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
                          className="w-24 h-24 rounded-full"
                        />
                      ) : (
                        <Icon
                          name="agora-line-user"
                          className="w-24 h-24"
                        />
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
                  <TableCell headerLabel="Data">
                    {formatDateToDMY(discussion.created)}
                  </TableCell>
                  <TableCell headerLabel="Mensagens">
                    {discussion.discussion?.length || 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between mt-16 py-12 border-t border-neutral-200">
            <div className="flex items-center gap-8">
              <span className="text-sm text-neutral-600">Linhas por página</span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="border border-neutral-300 rounded px-8 py-4 text-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-8">
              <span className="text-sm text-neutral-600">
                {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, discussions.length)} de {discussions.length}
              </span>
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-4 text-primary-600 disabled:text-neutral-300" aria-label="Página anterior">
                <Icon name="agora-line-arrow-left" className="w-[20px] h-[20px]" />
              </button>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-4 text-primary-600 disabled:text-neutral-300" aria-label="Próxima página">
                <Icon name="agora-line-arrow-right" className="w-[20px] h-[20px]" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
