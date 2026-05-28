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
import { fetchOrgDataservices } from "@/services/api";
import { Dataservice } from "@/types/api";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import { formatDateToDMY } from "@/utils/formatDate";
import TextLink from "@/components/Primitives/TextLink";
import { filterByStatus } from "@/utils/filterByStatus";
import { SortOrder, useSortControls } from "@/components/admin/lists/useClientTableState";
import AdminEmptyState from "../AdminEmptyState";
import StatusFilterSelect from "../StatusFilterSelect";
import TableActionsCell from "../TableActionsCell";

type DataserviceSortField = "title" | "created_at" | "last_modified";

export default function OrgDataservicesClient() {
  const params = useParams();
  const routeOrgId = params?.orgId as string | undefined;
  const { activeOrg } = useActiveOrganization();
  const resolvedOrgId = routeOrgId || activeOrg?.id;
  const { user } = useAuth();
  const orgName = useViewedOrganizationName(resolvedOrgId, user?.organizations);

  const [apis, setApis] = useState<Dataservice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<DataserviceSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage
  );

  const filteredApis = useMemo(() => filterByStatus(apis, statusFilter), [apis, statusFilter]);

  const sortedApis = useMemo(() => {
    if (!sortField || sortOrder === "none") return filteredApis;
    const dir = sortOrder === "ascending" ? 1 : -1;
    const collator = new Intl.Collator("pt", { sensitivity: "base" });
    return [...filteredApis].sort((a, b) => {
      if (sortField === "title") {
        return collator.compare(a.title ?? "", b.title ?? "") * dir;
      }
      const av = sortField === "created_at" ? a.created_at : a.last_modified;
      const bv = sortField === "created_at" ? b.created_at : b.last_modified;
      const at = av ? Date.parse(av) : 0;
      const bt = bv ? Date.parse(bv) : 0;
      return (at - bt) * dir;
    });
  }, [filteredApis, sortField, sortOrder]);

  const paginatedApis = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedApis.slice(start, start + pageSize);
  }, [sortedApis, currentPage, pageSize]);

  useEffect(() => {
    if (!resolvedOrgId) {
      setIsLoading(false);
      return;
    }
    async function loadDataservices() {
      setIsLoading(true);
      try {
        const response = await fetchOrgDataservices(resolvedOrgId!, 1, 9999);
        setApis(response.data || []);
      } catch (error) {
        console.error("Error loading org dataservices:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDataservices();
  }, [resolvedOrgId]);

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: orgName || "Organização", url: "#" },
        { label: "API" },
      ]}
      title="API"
      isLoading={isLoading}
      count={filteredApis.length}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      search={{
        placeholder: "Pesquise o nome da API",
        ariaLabel: "Pesquisar APIs",
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
        <AdminEmptyState
          icon="agora-line-edit"
          title="Sem publicações"
          description="A organização ainda não publicou uma API."
          createUrl="/pages/admin/dataservices/new"
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
        {paginatedApis.map((api) => (
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
              <br />
              <span className="text-sm text-neutral-500">
                sobre <span className="text-success-600">●</span>{" "}
                {api.owner ? `${api.owner.first_name} ${api.owner.last_name}` : "—"}
              </span>
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
