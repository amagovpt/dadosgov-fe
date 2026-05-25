"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  Button,
} from "@ama-pt/agora-design-system";
import { fetchMyCommunityResources } from "@/services/api";
import { CommunityResource } from "@/types/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { formatDateToDMY } from "@/utils/formatDate";
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

export default function CommunityResourcesClient() {
  const { displayName } = useCurrentUser();
  const router = useRouter();

  const [allResources, setAllResources] = useState<CommunityResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadResources() {
      setIsLoading(true);
      try {
        const response = await fetchMyCommunityResources(1, 9999);
        setAllResources(response.data || []);
      } catch (error) {
        console.error("Error loading community resources:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadResources();
  }, []);

  const filteredResources = useMemo(() => {
    let result = allResources;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (r) => r.title.toLowerCase().includes(q) || (r.format && r.format.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allResources, searchQuery]);

  const { totalItems, paginatedItems: resources } = useClientTableState<
    CommunityResource,
    SortField
  >({
    items: filteredResources,
    currentPage,
    pageSize,
    sortField,
    sortOrder,
    sorters: RESOURCE_SORTERS,
  });

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage
  );

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: displayName || "...", url: "#" },
            { label: "Recursos comunitários", url: "/pages/admin/me/community-resources" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">Recursos comunitários</h1>
        <PublishDropdown />
      </div>

      <p className="text-sm mb-16 text-neutral-700">
        {isLoading ? "A carregar..." : `${totalItems} resultados`}
      </p>

      <div className="mb-24 flex items-end gap-16">
        <div className="admin-search-wrapper">
          <InputSearchBar
            hasVoiceActionButton={false}
            label="Pesquisar"
            placeholder="Pesquisar recursos comunitários"
            aria-label="Pesquisar recursos comunitários"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {!isLoading && resources.length > 0 ? (
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
                Título
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
            {resources.map((resource) => (
              <TableRow key={resource.id}>
                <TableCell headerLabel="Título">
                  <span className="text-neutral-900">{resource.title}</span>
                  {resource.dataset && (
                    <>
                      <br />
                      <TextLink href={`/pages/datasets/${resource.dataset.id}`} className="text-sm">
                        {resource.dataset.title}
                      </TextLink>
                    </>
                  )}
                </TableCell>
                <TableCell headerLabel="Estado">
                  <PublicationStateDot
                    deleted={resource.deleted}
                    archived={resource.archived}
                  />
                </TableCell>
                <TableCell headerLabel="Formato">{resource.format || "—"}</TableCell>
                <TableCell headerLabel="Criado em">
                  {formatDateToDMY(resource.created_at)}
                </TableCell>
                <TableCell headerLabel="Modificado em">
                  {formatDateToDMY(resource.last_modified)}
                </TableCell>
                <TableCell headerLabel="Ação">
                  <a href={`/pages/admin/me/community-resources/edit?id=${resource.id}`}>
                    <Icon name="agora-line-edit" className="h-[20px] w-[20px]" />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </AdminPaginatedTable>
      ) : (
        <div className="datasets-page__body">
          <div className="datasets-page__content">
            <CardNoResults
              className="datasets-page__empty"
              position="center"
              icon={
                <Icon name="agora-line-user-group" className="icon-xl h-12 w-12 text-primary-500" />
              }
              title="Sem publicações"
              description="Ainda não publicou um recurso comunitário."
              hasAnchor={false}
              extraDescription={
                <div className="mt-24">
                  <Button
                    variant="primary"
                    appearance="outline"
                    onClick={() => router.push("/pages/admin/community-resources/new")}
                  >
                    Publique no portal
                  </Button>
                </div>
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
