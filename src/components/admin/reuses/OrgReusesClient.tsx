"use client";

import { useEffect, useState, useMemo } from "react";
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
  Button,
} from "@ama-pt/agora-design-system";
import { fetchOrgReuses } from "@/services/api";
import { Reuse } from "@/types/api";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { formatDateToDMY } from "@/utils/formatDate";
import TextLink from "@/components/Primitives/TextLink";
import { filterByStatus } from "@/utils/filterByStatus";
import AdminPaginatedTable from "@/components/admin/lists/AdminPaginatedTable";
import PublicationStatusFilterSelect from "@/components/admin/lists/PublicationStatusFilterSelect";
import PublicationStateDot from "@/components/admin/lists/PublicationStateDot";
import {
  SortOrder,
  useClientTableState,
  useSortControls,
} from "@/components/admin/lists/useClientTableState";

type ReuseSortField = "title" | "created_at" | "datasets";

const REUSE_SORTERS: Record<ReuseSortField, (reuse: Reuse) => string | number> = {
  title: (reuse) => reuse.title ?? "",
  created_at: (reuse) => (reuse.created_at ? Date.parse(reuse.created_at) : 0),
  datasets: (reuse) => reuse.datasets?.length ?? 0,
};

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

  const { totalItems, paginatedItems: paginatedReuses } = useClientTableState<
    Reuse,
    ReuseSortField
  >({
    items: filteredReuses,
    currentPage,
    pageSize: itemsPerPage,
    sortField,
    sortOrder,
    sorters: REUSE_SORTERS,
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
            { label: "Reutilizações", url: "#" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">Reutilizações</h1>
        <PublishDropdown />
      </div>

      <p className="text-sm mb-16 text-neutral-700">{reuses.length} resultados</p>

      <div className="mb-24 flex items-end gap-16">
        <div className="admin-search-wrapper">
          <InputSearchBar
            hasVoiceActionButton={false}
            label="Pesquisar"
            placeholder="Pesquise o nome da reutilização"
            aria-label="Pesquisar reutilizações"
          />
        </div>
        <PublicationStatusFilterSelect
          statusFilter={statusFilter}
          onChange={(nextStatus) => {
            setStatusFilter(nextStatus);
            setCurrentPage(1);
          }}
        />
      </div>

      {isLoading ? (
        <p>A carregar...</p>
      ) : reuses.length > 0 ? (
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
                    <TextLink href={`/pages/reuses/${reuse.slug}`}>{reuse.title}</TextLink>
                  </TableCell>
                  <TableCell headerLabel="Estado">
                    <PublicationStateDot
                      deleted={reuse.deleted}
                      archived={reuse.archived}
                      isPrivate={reuse.private}
                    />
                  </TableCell>
                  <TableCell headerLabel="Criado em">
                    {formatDateToDMY(reuse.created_at)}
                  </TableCell>
                  <TableCell headerLabel="Conjuntos de dados">
                    {reuse.datasets?.length ?? 0}
                  </TableCell>
                  <TableCell headerLabel="Ações">
                    <div className="flex gap-8">
                      <a href={`/pages/reuses/${reuse.slug}`}>
                        <Icon name="agora-line-eye" className="w-[20px] h-[20px]" />
                      </a>
                      <a href={`/pages/admin/org/reuses/edit?slug=${reuse.slug}`}>
                        <Icon name="agora-line-edit" className="w-[20px] h-[20px]" />
                      </a>
                    </div>
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
              icon={<Icon name="agora-line-edit" className="icon-xl h-12 w-12 text-primary-500" />}
              title="Sem publicações"
              description="A organização ainda não publicou uma reutilização."
              hasAnchor={false}
              extraDescription={
                <div className="mt-24">
                  <Button
                    variant="primary"
                    appearance="outline"
                    onClick={() => (window.location.href = "/pages/admin/reuses/new")}
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
