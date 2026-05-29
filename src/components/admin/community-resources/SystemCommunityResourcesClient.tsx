"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
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
import { fetchAllCommunityResources } from "@/app/api/community-resources";
import type { CommunityResource } from '@/service/types/community-resource';
import AdminLayout from "@/components/Layout/AdminLayout";
import CommunityResourceEditClient from "./CommunityResourceEditClient";
import TextLink from "@/components/Primitives/TextLink";
import { createPaginationProps } from "@/utils/createPaginationProps";
import ResultsCount from "../ResultsCount";
import TableActionsCell from "../TableActionsCell";

type SortOrder = "none" | "ascending" | "descending";
type SortField = "title" | "format" | "created_at" | "last_modified";

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

export default function SystemCommunityResourcesClient() {
  const searchParams = useSearchParams();
  const resourceId = searchParams.get("resource_id");

  const [resources, setResources] = useState<CommunityResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");

  const loadData = useCallback(async () => {
    if (resourceId) return;
    setIsLoading(true);
    try {
      const response = await fetchAllCommunityResources(1, 9999);
      setResources(response.data || []);
    } catch (error) {
      console.error("Error loading community resources:", error);
    } finally {
      setIsLoading(false);
    }
  }, [resourceId]);

  const handleSort = (field: SortField) => (newOrder: SortOrder) => {
    setSortField(field);
    setSortOrder(newOrder);
    setCurrentPage(1);
  };

  const getSortOrder = (field: SortField): SortOrder => {
    return sortField === field ? sortOrder : "none";
  };

  const sortedResources = useMemo(() => {
    if (sortOrder === "none") return resources;
    return [...resources].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "title":
          cmp = (a.title || "").localeCompare(b.title || "");
          break;
        case "format":
          cmp = (a.format || "").localeCompare(b.format || "");
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
    const start = (currentPage - 1) * pageSize;
    return sortedResources.slice(start, start + pageSize);
  }, [sortedResources, currentPage, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (resourceId) {
    return <CommunityResourceEditClient />;
  }

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: "Sistema", url: "#" },
        { label: "Recursos comunitários", url: "/pages/admin/system/community-resources" },
      ]}
      title="Recursos comunitários"
    >

      <ResultsCount count={resources.length} isLoading={isLoading} />

      {isLoading ? (
        <p className="text-sm text-neutral-700">A carregar...</p>
      ) : resources.length > 0 ? (
        <Table
          paginationProps={createPaginationProps(
            pageSize,
            resources.length,
            currentPage,
            setCurrentPage,
            setPageSize
          )}
        >
          <TableHeader>
            <TableRow>
              <TableHeaderCell
                sortType="date"
                sortOrder={getSortOrder("title")}
                onSortChange={handleSort("title")}
              >
                Título do recurso
              </TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell
                sortType="date"
                sortOrder={getSortOrder("format")}
                onSortChange={handleSort("format")}
              >
                Formato
              </TableHeaderCell>
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
                Modificado em
              </TableHeaderCell>
              <TableHeaderCell>Ação</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedResources.map((resource) => {
              const authorName = resource.organization
                ? resource.organization.name
                : resource.owner
                  ? `${resource.owner.first_name} ${resource.owner.last_name}`.trim()
                  : "—";

              return (
                <TableRow key={resource.id}>
                  <TableCell headerLabel="Título do recurso">
                    <div>
                      <span className="text-neutral-900">{resource.title}</span>
                      {resource.dataset && (
                        <div className="text-sm text-neutral-700">
                          <TextLink href={`/pages/datasets/${resource.dataset.id}`}>
                            {resource.dataset.title}
                          </TextLink>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell headerLabel="Estado">
                    <StatusDot
                      variant={
                        resource.deleted ? "danger" : resource.archived ? "warning" : "success"
                      }
                    >
                      {resource.deleted
                        ? "Eliminado"
                        : resource.archived
                          ? "Arquivado"
                          : "Publicado"}
                    </StatusDot>
                  </TableCell>
                  <TableCell headerLabel="Formato">
                    {resource.format ? resource.format.toUpperCase() : "—"}
                  </TableCell>
                  <TableCell headerLabel="Criado em">{formatDate(resource.created_at)}</TableCell>
                  <TableCell headerLabel="Modificado em">
                    {formatDate(resource.last_modified)}
                  </TableCell>
                  <TableCell headerLabel="Ação">
                    <TableActionsCell
                      editAction={{
                        href: `/pages/admin/system/community-resources?resource_id=${resource.id}`,
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <CardNoResults
          position="center"
          icon={
            <Icon name="agora-line-user-group" className="icon-xl h-12 w-12 text-primary-500" />
          }
          title="Sem recursos comunitários"
          description="Nenhum recurso comunitário encontrado."
          hasAnchor={false}
        />
      )}
    </AdminLayout>
  );
}
