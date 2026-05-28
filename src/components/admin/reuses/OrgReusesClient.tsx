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
import { fetchOrgReuses } from "@/services/api";
import { Reuse } from "@/types/api";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import { formatDateToDMY } from "@/utils/formatDate";
import { filterByStatus } from "@/utils/filterByStatus";
import { SortOrder, useSortControls } from "@/components/admin/lists/useClientTableState";
import AdminEmptyState from "../AdminEmptyState";
import { StatusFilterSelect } from "@/components/admin/StatusFilterSelect";
import TableActionsCell from "../TableActionsCell";

type ReuseSortField = "title" | "created_at" | "datasets";

export default function OrgReusesClient() {
  const params = useParams();
  const routeOrgId = (params?.orgId as string | undefined) ?? undefined;
  const { activeOrg, isLoading: isOrgLoading } = useActiveOrganization();
  const resolvedOrgId = routeOrgId ?? activeOrg?.id;
  const { user } = useAuth();
  const orgName = useViewedOrganizationName(resolvedOrgId, user?.organizations);

  const [reuses, setReuses] = useState<Reuse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<ReuseSortField | null>(null);
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
      return;
    }

    let isCancelled = false;
    const timeoutId = setTimeout(() => {
      setIsLoading(true);
      void fetchOrgReuses(resolvedOrgId)
        .then((data) => {
          if (!isCancelled) setReuses(data || []);
        })
        .catch((error) => {
          console.error("Error loading org reuses:", error);
        })
        .finally(() => {
          if (!isCancelled) setIsLoading(false);
        });
    }, 0);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [resolvedOrgId]);

  const filteredReuses = useMemo(
    () => filterByStatus(reuses, statusFilter),
    [reuses, statusFilter]
  );

  const sortedReuses = useMemo(() => {
    if (!sortField || sortOrder === "none") return filteredReuses;
    const dir = sortOrder === "ascending" ? 1 : -1;
    const collator = new Intl.Collator("pt", { sensitivity: "base" });
    return [...filteredReuses].sort((a, b) => {
      if (sortField === "title") {
        return collator.compare(a.title ?? "", b.title ?? "") * dir;
      }
      if (sortField === "created_at") {
        const at = a.created_at ? Date.parse(a.created_at) : 0;
        const bt = b.created_at ? Date.parse(b.created_at) : 0;
        return (at - bt) * dir;
      }
      const ad = a.datasets?.length ?? 0;
      const bd = b.datasets?.length ?? 0;
      return (ad - bd) * dir;
    });
  }, [filteredReuses, sortField, sortOrder]);

  const paginatedReuses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedReuses.slice(start, start + itemsPerPage);
  }, [sortedReuses, currentPage, itemsPerPage]);

  if (!isOrgLoading && !resolvedOrgId) {
    return (
      <AdminEmptyState
        icon="agora-line-user-buildings"
        title="Sem organizações"
        description="Não pertence a nenhuma organização."
      />
    );
  }

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: orgName || "Organização", url: "#" },
        { label: "Reutilizações", url: "#" },
      ]}
      title="Reutilizações"
      isLoading={isLoading}
      count={filteredReuses.length}
      currentPage={currentPage}
      pageSize={itemsPerPage}
      setCurrentPage={setCurrentPage}
      setPageSize={setItemsPerPage}
      search={{
        placeholder: "Pesquise o nome da reutilização",
        ariaLabel: "Pesquisar reutilizações",
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
          description="A organização ainda não publicou uma reutilização."
          createUrl="/pages/admin/reuses/new"
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
            Título da reutilização
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
            sortType="numeric"
            sortOrder={getSortOrder("datasets")}
            onSortChange={handleSort("datasets")}
          >
            Conjuntos de dados
          </TableHeaderCell>
          <TableHeaderCell>Ações</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginatedReuses.map((reuse) => (
          <TableRow key={reuse.id}>
            <TableCell headerLabel="Título">
              <a href={`/pages/reuses/${reuse.slug}`} className="text-primary-600 underline">
                {reuse.title}
              </a>
            </TableCell>
            <TableCell headerLabel="Estado">
              <ResourceStatusBadge item={reuse} />
            </TableCell>
            <TableCell headerLabel="Criado em">{formatDateToDMY(reuse.created_at)}</TableCell>
            <TableCell headerLabel="Conjuntos de dados">{reuse.datasets?.length ?? 0}</TableCell>
            <TableCell headerLabel="Ações">
              <TableActionsCell
                viewAction={{
                  href: `/pages/reuses/${reuse.slug}`,
                }}
                editAction={{
                  href: `/pages/admin/org/reuses/edit?slug=${reuse.slug}`,
                }}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </AdminListPage>
  );
}
