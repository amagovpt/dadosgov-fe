"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Breadcrumb,
  CardNoResults,
  Icon,
  InputSearchBar,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import { fetchOrgCommunityResources } from "@/services/api";
import { CommunityResource } from "@/types/api";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { formatDateToDMY } from "@/utils/formatDate";
import AdminPaginatedTable from "@/components/admin/lists/AdminPaginatedTable";
import PublicationStateDot from "@/components/admin/lists/PublicationStateDot";
import {
  SortOrder,
  useClientTableState,
  useSortControls,
} from "@/components/admin/lists/useClientTableState";

type SortField = "title" | "created_at" | "last_modified";

const RESOURCE_SORTERS: Record<SortField, (resource: CommunityResource) => string | number> = {
  title: (resource) => resource.title || "",
  created_at: (resource) => new Date(resource.created_at).getTime(),
  last_modified: (resource) => new Date(resource.last_modified).getTime(),
};

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

  const { totalItems, paginatedItems: paginatedResources } = useClientTableState<
    CommunityResource,
    SortField
  >({
    items: resources,
    currentPage,
    pageSize: itemsPerPage,
    sortField,
    sortOrder,
    sorters: RESOURCE_SORTERS,
  });

  if (!isOrgLoading && !resolvedOrgId) {
    return (
      <div className="admin-page">
        <CardNoResults
          className="datasets-page__empty"
          position="center"
          icon={<Icon name="agora-line-buildings" className="icon-xl h-12 w-12 text-primary-500" />}
          title="Sem organizações"
          description="Não pertence a nenhuma organização."
          hasAnchor={false}
        />
      </div>
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
          <AdminPaginatedTable
            pageSize={itemsPerPage}
            totalItems={totalItems}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            setPageSize={setItemsPerPage}
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
                    <PublicationStateDot
                      deleted={resource.deleted}
                      archived={resource.archived}
                    />
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
                      <Icon name="agora-line-eye" className="w-[20px] h-[20px]" />
                      <a href={`/pages/admin/community-resources/edit?resource_id=${resource.id}`}>
                        <Icon name="agora-line-edit" className="w-[20px] h-[20px]" />
                      </a>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </AdminPaginatedTable>
        </>
      ) : (
        <div className="datasets-page__body">
          <div className="datasets-page__content">
            <CardNoResults
              className="datasets-page__empty"
              position="center"
              icon={
                <Icon name="agora-line-buildings" className="icon-xl h-12 w-12 text-primary-500" />
              }
              title="Sem recursos comunitários"
              description="A organização ainda não tem recursos comunitários."
              hasAnchor={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
