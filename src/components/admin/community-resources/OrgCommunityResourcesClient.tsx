"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { fetchOrgCommunityResources } from "@/services/api";
import { CommunityResource } from "@/types/api";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import { formatDateToDMY } from "@/utils/formatDate";
import AdminEmptyState from "../AdminEmptyState";
import TableActionsCell from "../TableActionsCell";
import { SortOrder, useSortControls } from "@/components/admin/lists/useClientTableState";

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

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage
  );

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
    <AdminListPage
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: orgName || "Organização", url: "#" },
        { label: "Recursos comunitários" },
      ]}
      title="Recursos comunitários"
      isLoading={isLoading}
      count={resources.length}
      currentPage={currentPage}
      pageSize={itemsPerPage}
      setCurrentPage={setCurrentPage}
      setPageSize={setItemsPerPage}
      search={{
        placeholder: "Pesquisar recursos comunitários",
        ariaLabel: "Pesquisar recursos comunitários",
      }}
      emptyState={
        <AdminEmptyState
          icon="agora-line-buildings"
          title="Sem recursos comunitários"
          description="A organização ainda não tem recursos comunitários."
        />
      }
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
              <ResourceStatusBadge item={resource} />
            </TableCell>
            <TableCell headerLabel="Criado em">{formatDateToDMY(resource.created_at)}</TableCell>
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
              <TableActionsCell
                editAction={{
                  href: `/pages/admin/community-resources/edit?resource_id=${resource.id}`,
                }}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </AdminListPage>
  );
}
