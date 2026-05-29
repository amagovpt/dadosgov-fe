"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  InputSearchBar,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import { fetchOrgDataservices } from "@/app/api/dataservices";
import type { Dataservice } from '@/service/types/dataservice';
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/components/Layout/AdminLayout";
import { formatDateToDMY } from "@/utils/formatDate";
import TextLink from "@/components/Primitives/TextLink";
import { createPaginationProps } from "@/utils/createPaginationProps";
import { filterByStatus } from "@/utils/filterByStatus";
import AdminEmptyState from "../AdminEmptyState";
import ResultsCount from "../ResultsCount";
import StatusFilterSelect from "../StatusFilterSelect";
import TableActionsCell from "../TableActionsCell";

type SortOrder = "none" | "ascending" | "descending";
type DataserviceSortField = "title" | "created_at" | "last_modified";

export default function OrgDataservicesClient() {
  const params = useParams();
  const routeOrgId = params?.orgId as string | undefined;
  const { activeOrg, isLoading: isOrgLoading } = useActiveOrganization();
  const resolvedOrgId = routeOrgId || activeOrg?.id;
  const { user } = useAuth();
  const orgName = useViewedOrganizationName(resolvedOrgId, user?.organizations);

  const [apis, setApis] = useState<Dataservice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<DataserviceSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");

  const handleSort = (field: DataserviceSortField) => (newOrder: SortOrder) => {
    setSortField(newOrder === "none" ? null : field);
    setSortOrder(newOrder);
  };

  const getSortOrder = (field: DataserviceSortField): SortOrder =>
    sortField === field ? sortOrder : "none";

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
    <AdminLayout
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: orgName || "Organização", url: "#" },
        { label: "API" },
      ]}
      title="API"
    >

      <ResultsCount count={filteredApis.length} isLoading={isLoading} />

      <div className="mb-24 flex items-end gap-16">
        <div className="admin-search-wrapper">
          <InputSearchBar
            hasVoiceActionButton={false}
            label="Pesquisar"
            placeholder="Pesquise o nome da API"
            aria-label="Pesquisar APIs"
          />
        </div>
        <StatusFilterSelect value={statusFilter} onChange={(v) => setStatusFilter(v)} />
      </div>

      {isLoading ? (
        <p>A carregar...</p>
      ) : filteredApis.length > 0 ? (
        <Table
          paginationProps={createPaginationProps(5, filteredApis.length, 0, undefined, undefined, {
            currentPageIsZeroBased: true,
          })}
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
            {sortedApis.map((api, index) => (
              <TableRow key={index}>
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
        </Table>
      ) : (
        <AdminEmptyState
          icon="agora-line-edit"
          title="Sem publicações"
          description="A organização ainda não publicou uma API."
          createUrl="/pages/admin/dataservices/new"
        />
      )}
    </AdminLayout>
  );
}
