"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { fetchMyCommunityResources } from "@/services/api";
import { CommunityResource } from "@/types/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatDateToDMY } from "@/utils/formatDate";
import TextLink from "@/components/Primitives/TextLink";
import AdminEmptyState from "../AdminEmptyState";
import TableActionsCell from "../TableActionsCell";
import { SortOrder, useSortControls } from "@/components/admin/lists/useClientTableState";

type SortField = "title" | "format" | "created_at" | "last_modified";

export default function CommunityResourcesClient() {
  const { displayName } = useCurrentUser();

  const [allResources, setAllResources] = useState<CommunityResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const [searchQuery, setSearchQuery] = useState("");

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage
  );

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

  const resources = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedResources.slice(start, start + pageSize);
  }, [sortedResources, currentPage, pageSize]);

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: displayName || "...", url: "#" },
        { label: "Recursos comunitários", url: "/pages/admin/me/community-resources" },
      ]}
      title="Recursos comunitários"
      isLoading={isLoading}
      count={sortedResources.length}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      search={{
        placeholder: "Pesquisar recursos comunitários",
        ariaLabel: "Pesquisar recursos comunitários",
        onChange: (value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        },
      }}
      emptyState={
        <AdminEmptyState
          icon="agora-line-user-group"
          description="Ainda não publicou um recurso comunitário."
          createUrl="/pages/admin/community-resources/new"
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
            <TableCell headerLabel="Criado em">{formatDateToDMY(resource.created_at)}</TableCell>
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
    </AdminListPage>
  );
}
