"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Breadcrumb,
  CardNoResults,
  Icon,
  InputSearchBar,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import StatusDot from "@/components/admin/StatusDot";
import { fetchOrgCommunityResources } from "@/services/api";
import { CommunityResource } from "@/types/api";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { formatDateToDMY } from "@/utils/formatDate";
import { createPaginationProps } from "@/utils/createPaginationProps";
import AppIcon from "@/components/Primitives/AppIcon";
import AdminEmptyState from "../AdminEmptyState";

type SortOrder = "none" | "ascending" | "descending";
type SortField = "title" | "created_at" | "last_modified";

export default function OrgCommunityResourcesClient() {
  const params = useParams();
  const routeOrgId = params?.orgId as string | undefined;
  const { activeOrg, isLoading: isOrgLoading } = useActiveOrganization();
  const resolvedOrgId = routeOrgId || activeOrg?.id;
  const { user } = useAuth();
  const orgName = useViewedOrganizationName(resolvedOrgId, user?.organizations);

  const [resources, setResources] = useState<CommunityResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");

  const handleSort = (field: SortField) => (newOrder: SortOrder) => {
    setSortField(field);
    setSortOrder(newOrder);
    setCurrentPage(1);
  };

  const getSortOrder = (field: SortField): SortOrder => {
    return sortField === field ? sortOrder : "none";
  };

  useEffect(() => {
    if (!resolvedOrgId) {
      setIsLoading(false);
      return;
    }
    async function loadResources() {
      setIsLoading(true);
      try {
        const response = await fetchOrgCommunityResources(resolvedOrgId!, 1, 9999);
        setResources(response.data || []);
      } catch (error) {
        console.error("Error loading org community resources:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadResources();
  }, [resolvedOrgId]);

  const sortedResources = useMemo(() => {
    if (sortOrder === "none") return resources;
    return [...resources].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "title":
          cmp = (a.title || "").localeCompare(b.title || "");
          break;
        case "created_at":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "last_modified":
          cmp = new Date(a.last_modified).getTime() - new Date(b.last_modified).getTime();
          break;
      }
      return sortOrder === "descending" ? -cmp : cmp;
    });
  }, [resources, sortField, sortOrder]);

  const paginatedResources = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedResources.slice(start, start + itemsPerPage);
  }, [sortedResources, currentPage, itemsPerPage]);

  if (!isOrgLoading && !resolvedOrgId) {
    return (
      <AdminEmptyState
        icon="agora-line-buildings"
        description="Não pertence a nenhuma organização."
      />
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: orgName || "Organização", url: "#" },
            {
              label: "Recursos comunitários",
              url: "#",
            },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">Recursos comunitários</h1>
        <PublishDropdown />
      </div>

      <p className="text-sm mb-16 text-neutral-700">{resources.length} resultados</p>

      <div className="mb-24 flex items-end gap-16">
        <div className="admin-search-wrapper">
          <InputSearchBar
            hasVoiceActionButton={false}
            label="Pesquisar"
            placeholder="Pesquisar recursos comunitários"
            aria-label="Pesquisar recursos comunitários"
          />
        </div>
      </div>

      {isLoading ? (
        <p>A carregar...</p>
      ) : resources.length > 0 ? (
        <>
          <Table
            paginationProps={createPaginationProps(
              itemsPerPage,
              resources.length,
              currentPage,
              setCurrentPage,
              setItemsPerPage
            )}
          >
            <TableHeader>
              <TableRow>
                <TableHeaderCell
                  sortType="date"
                  sortOrder={getSortOrder("title")}
                  onSortChange={handleSort("title")}
                >
                  Título
                </TableHeaderCell>
                <TableHeaderCell>Estado</TableHeaderCell>
                <TableHeaderCell
                  sortType="date"
                  sortOrder={getSortOrder("created_at")}
                  onSortChange={handleSort("created_at")}
                >
                  Criado em
                </TableHeaderCell>
                <TableHeaderCell
                  sortType="date"
                  sortOrder={getSortOrder("last_modified")}
                  onSortChange={handleSort("last_modified")}
                >
                  Última modificação
                </TableHeaderCell>
                <TableHeaderCell>Ações</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedResources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell headerLabel="Título">
                    <span className="text-primary-600">{resource.title}</span>
                  </TableCell>
                  <TableCell headerLabel="Estado">
                    {resource.deleted ? (
                      <StatusDot variant="danger">Excluído</StatusDot>
                    ) : resource.archived ? (
                      <StatusDot variant="neutral">Arquivado</StatusDot>
                    ) : (
                      <StatusDot variant="success">Público</StatusDot>
                    )}
                  </TableCell>
                  <TableCell headerLabel="Criado em">
                    {formatDateToDMY(resource.created_at)}
                  </TableCell>
                  <TableCell headerLabel="Última modificação">
                    <div>
                      <div>{formatDateToDMY(resource.last_modified)}</div>
                      {resource.owner && (
                        <a
                          href={`/pages/users/${resource.owner.slug}`}
                          className="text-xs text-primary-600 underline"
                        >
                          {resource.owner.first_name} {resource.owner.last_name}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell headerLabel="Ações">
                    <div className="flex gap-8">
                      <Icon name="agora-line-eye" className="h-[20px] w-[20px]" />
                      <a href={`/pages/admin/community-resources/edit?resource_id=${resource.id}`}>
                        <Icon name="agora-line-edit" className="h-[20px] w-[20px]" />
                      </a>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      ) : (
        <AdminEmptyState
          icon="agora-line-buildings"
          title="Sem recursos comunitários"
          description="A organização ainda não tem recursos comunitários."
        />
      )}
    </div>
  );
}
