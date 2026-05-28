"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CardNoResults,
  Icon,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { fetchDataservices } from "@/services/api";
import { Dataservice } from "@/types/api";
import { formatDateToDMY } from "@/utils/formatDate";
import TextLink from "@/components/Primitives/TextLink";
import { filterByStatus } from "@/utils/filterByStatus";
import { SortOrder, useSortControls } from "@/components/admin/lists/useClientTableState";
import { useDebouncedSearch } from "@/components/admin/lists/useDebouncedSearch";
import StatusFilterSelect from "../StatusFilterSelect";
import TableActionsCell from "../TableActionsCell";

type DataserviceSortField = "title" | "created_at" | "last_modified";

const SORT_FIELD_MAP: Record<DataserviceSortField, string> = {
  title: "title",
  created_at: "created",
  last_modified: "last_modified",
};

export default function SystemDataservicesClient() {
  const [apis, setApis] = useState<Dataservice[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<DataserviceSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");

  const sortParam = useMemo(() => {
    if (!sortField || sortOrder === "none") return undefined;
    const apiField = SORT_FIELD_MAP[sortField];
    return `${sortOrder === "descending" ? "-" : ""}${apiField}`;
  }, [sortField, sortOrder]);

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchDataservices(currentPage, pageSize, {
        q: searchQuery.trim() || undefined,
        sort: sortParam,
      });
      setApis(response.data || []);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error("Error loading dataservices:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, sortParam]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = useDebouncedSearch((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  });

  const filteredApis = useMemo(() => filterByStatus(apis, statusFilter), [apis, statusFilter]);

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: "Sistema", url: "#" },
        { label: "API", url: "/pages/admin/system/dataservices" },
      ]}
      title="API"
      isLoading={isLoading}
      count={totalItems}
      hasItems={filteredApis.length > 0}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      search={{
        placeholder: "Pesquise o nome da API",
        ariaLabel: "Pesquisar APIs",
        onChange: handleSearch,
      }}
      filters={
        <StatusFilterSelect
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        />
      }
      emptyState={
        <CardNoResults
          position="center"
          icon={<Icon name="agora-line-code" className="icon-xl h-12 w-12 text-primary-500" />}
          title="Sem APIs"
          description="Nenhuma API encontrada."
          hasAnchor={false}
        />
      }
    >
      <TableHeader>
        <TableRow>
          <TableHeaderCell
            sortType="numeric"
            sortOrder={getSortOrder("title")}
            onSortChange={handleSort("title")}
          >
            Título da API
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
            Modificado em
          </TableHeaderCell>
          <TableHeaderCell>Ações</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredApis.map((api) => (
          <TableRow key={api.id}>
            <TableCell headerLabel="Título">
              <TextLink href={`/pages/dataservices/${api.slug}`}>{api.title}</TextLink>
            </TableCell>
            <TableCell headerLabel="Estado">
              <ResourceStatusBadge item={api} />
            </TableCell>
            <TableCell headerLabel="Criado em">{formatDateToDMY(api.created_at)}</TableCell>
            <TableCell headerLabel="Modificado em">
              {formatDateToDMY(api.last_modified)}
              {api.owner && (
                <>
                  <br />
                  <span className="text-sm text-neutral-500">
                    por {api.owner.first_name} {api.owner.last_name}
                  </span>
                </>
              )}
            </TableCell>
            <TableCell headerLabel="Ações">
              <TableActionsCell
                viewAction={{
                  href: `/pages/dataservices/${api.slug}`,
                }}
                editAction={{
                  href: `/pages/admin/dataservices/edit?slug=${api.slug}`,
                }}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </AdminListPage>
  );
}
