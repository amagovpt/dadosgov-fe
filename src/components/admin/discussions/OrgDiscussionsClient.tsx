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
import { fetchOrgDiscussions } from "@/services/api";
import { Discussion } from "@/types/api";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { useOrganizationName } from "@/hooks/useOrganizationName";
import { useAuth } from "@/context/AuthContext";

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

interface OrgDiscussionsClientProps {
  orgId: string;
}

export default function OrgDiscussionsClient({ orgId }: OrgDiscussionsClientProps) {
  const { user } = useAuth();
  const orgName = useOrganizationName(orgId, user?.organizations);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  const totalPages = Math.ceil(discussions.length / itemsPerPage);
  const paginatedDiscussions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return discussions.slice(start, start + itemsPerPage);
  }, [discussions, currentPage, itemsPerPage]);

  if (isLoading) {
    return <div className="admin-page">A carregar...</div>;
  }

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

      {discussions.length === 0 ? (
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
          <p className="text-neutral-700 text-sm font-semibold uppercase mb-[24px]">
            {discussions.length} {discussions.length === 1 ? "discussão" : "discussões"}
          </p>

          <Table
            paginationProps={{
              itemsPerPageLabel: "Linhas por página",
              itemsPerPage: itemsPerPage,
              totalItems: discussions.length,
              availablePageSizes: [5, 10, 20],
              currentPage: currentPage - 1,
              buttonDropdownAriaLabel: "Selecionar linhas por página",
              dropdownListAriaLabel: "Opções de linhas por página",
              prevButtonAriaLabel: "Página anterior",
              nextButtonAriaLabel: "Próxima página",
              onPageChange: (page: number) => setCurrentPage(page + 1),
              onPageSizeChange: (size: number) => {
                setItemsPerPage(size);
                setCurrentPage(1);
              },
            }}
          >
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
                    <div className="flex items-center gap-[8px]">
                      {discussion.user?.avatar_thumbnail ? (
                        <img
                          src={discussion.user.avatar_thumbnail}
                          alt={`${discussion.user.first_name} ${discussion.user.last_name}`}
                          className="w-[24px] h-[24px] rounded-full"
                        />
                      ) : (
                        <Icon
                          name="agora-line-user"
                          className="w-[24px] h-[24px]"
                        />
                      )}
                      <span>
                        {discussion.user?.first_name} {discussion.user?.last_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell headerLabel="Estado">
                    {discussion.closed ? (
                      <StatusDot variant="success">Fechada</StatusDot>
                    ) : (
                      <StatusDot variant="informative">Aberta</StatusDot>
                    )}
                  </TableCell>
                  <TableCell headerLabel="Data">
                    {formatDate(discussion.created)}
                  </TableCell>
                  <TableCell headerLabel="Mensagens">
                    {discussion.discussion?.length || 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

        </>
      )}
    </div>
  );
}
