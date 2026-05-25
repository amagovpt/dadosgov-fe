"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  Icon,
  InputSearchBar,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import { fetchMyCommunityResources } from "@/services/api";
import { CommunityResource } from "@/types/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { formatDateToDMY } from "@/utils/formatDate";
import TextLink from "@/components/Primitives/TextLink";
import { createPaginationProps } from "@/utils/createPaginationProps";
import AdminEmptyState from "../AdminEmptyState";
import ResultsCount from "../ResultsCount";
import TableActionsCell from "../TableActionsCell";

type SortOrder = "none" | "ascending" | "descending";
type SortField = "title" | "format" | "created_at" | "last_modified";

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

  const sortedResources = useMemo(() => {
    if (sortOrder === "none") return filteredResources;

    return [...filteredResources].sort((a, b) => {
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
  }, [filteredResources, sortField, sortOrder]);

  const totalItems = sortedResources.length;
  const start = (currentPage - 1) * pageSize;
  const resources = sortedResources.slice(start, start + pageSize);

  const handleSort = (field: SortField) => (newOrder: SortOrder) => {
    setSortField(field);
    setSortOrder(newOrder);
    setCurrentPage(1);
  };

  const getSortOrder = (field: SortField): SortOrder => {
    return sortField === field ? sortOrder : "none";
  };

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

      <ResultsCount count={totalItems} isLoading={isLoading} />

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
        <Table
          paginationProps={createPaginationProps(
            pageSize,
            totalItems,
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
                  <ResourceStatusBadge item={resource} />
                </TableCell>
                <TableCell headerLabel="Formato">{resource.format || "—"}</TableCell>
                <TableCell headerLabel="Criado em">
                  {formatDateToDMY(resource.created_at)}
                </TableCell>
                <TableCell headerLabel="Modificado em">
                  {formatDateToDMY(resource.last_modified)}
                </TableCell>
                <TableCell headerLabel="Ação">
                  <TableActionsCell
                    editAction={{
                      href: `/pages/admin/me/community-resources/edit?id=${resource.id}`,
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <AdminEmptyState
          icon="agora-line-user-group"
          description="Ainda não publicou um recurso comunitário."
          createUrl="/pages/admin/community-resources/new"
        />
      )}
    </div>
  );
}
