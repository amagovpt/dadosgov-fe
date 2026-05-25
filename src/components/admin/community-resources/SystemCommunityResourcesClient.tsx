"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Breadcrumb,
  CardNoResults,
  Icon,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { fetchAllCommunityResources } from "@/services/api";
import { CommunityResource } from "@/types/api";
import CommunityResourceEditClient from "./CommunityResourceEditClient";
import TextLink from "@/components/Primitives/TextLink";
import AdminPaginatedTable from "@/components/admin/lists/AdminPaginatedTable";
import PublicationStateDot from "@/components/admin/lists/PublicationStateDot";
import {
  SortOrder,
  useClientTableState,
  useSortControls,
} from "@/components/admin/lists/useClientTableState";

type SortField = "title" | "format" | "created_at" | "last_modified";

const RESOURCE_SORTERS: Record<SortField, (resource: CommunityResource) => string | number> = {
  title: (resource) => resource.title || "",
  format: (resource) => resource.format || "",
  created_at: (resource) => new Date(resource.created_at).getTime(),
  last_modified: (resource) => new Date(resource.last_modified).getTime(),
};

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

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage
  );

  const { totalItems, paginatedItems: paginatedResources } = useClientTableState<
    CommunityResource,
    SortField
  >({
    items: resources,
    currentPage,
    pageSize,
    sortField,
    sortOrder,
    sorters: RESOURCE_SORTERS,
  });

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (resourceId) {
    return <CommunityResourceEditClient />;
  }

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: "Sistema", url: "#" },
            {
              label: "Recursos comunitários",
              url: "/pages/admin/system/community-resources",
            },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">Recursos comunitários</h1>
        <PublishDropdown />
      </div>

      <p className="text-sm mb-16 text-neutral-700">{resources.length} resultados</p>

      {isLoading ? (
        <p className="text-sm text-neutral-700">A carregar...</p>
      ) : resources.length > 0 ? (
        <AdminPaginatedTable
          pageSize={pageSize}
          totalItems={totalItems}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          setPageSize={setPageSize}
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
                    <PublicationStateDot
                      deleted={resource.deleted}
                      archived={resource.archived}
                      labels={{ deleted: "Eliminado", public: "Publicado" }}
                      variants={{ archived: "warning" }}
                    />
                  </TableCell>
                  <TableCell headerLabel="Formato">
                    {resource.format ? resource.format.toUpperCase() : "—"}
                  </TableCell>
                  <TableCell headerLabel="Criado em">{formatDate(resource.created_at)}</TableCell>
                  <TableCell headerLabel="Modificado em">
                    {formatDate(resource.last_modified)}
                  </TableCell>
                  <TableCell headerLabel="Ação">
                    <a href={`/pages/admin/system/community-resources?resource_id=${resource.id}`}>
                      <Icon name="agora-line-edit" className="h-[20px] w-[20px]" />
                    </a>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </AdminPaginatedTable>
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
    </div>
  );
}
