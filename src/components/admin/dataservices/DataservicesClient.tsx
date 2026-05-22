"use client";

import { useEffect, useMemo, useState } from "react";
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
import StatusDot from "@/components/admin/StatusDot";
import { fetchMyDataservices } from "@/services/api";
import { Dataservice } from "@/types/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { formatDateToDMY } from "@/utils/formatDate";
import TextLink from "@/components/Primitives/TextLink";
import { filterByStatus } from "@/utils/filterByStatus";
import AdminPaginatedTable from "@/components/admin/lists/AdminPaginatedTable";
import PublicationStatusFilterSelect from "@/components/admin/lists/PublicationStatusFilterSelect";
import {
  SortOrder,
  useClientTableState,
  useSortControls,
} from "@/components/admin/lists/useClientTableState";

type DataserviceSortField = "title" | "created_at" | "last_modified";

const DATASERVICE_SORTERS: Record<DataserviceSortField, (api: Dataservice) => string | number> = {
  title: (api) => api.title ?? "",
  created_at: (api) => (api.created_at ? Date.parse(api.created_at) : 0),
  last_modified: (api) => (api.last_modified ? Date.parse(api.last_modified) : 0),
};

export default function DataservicesClient() {
  const { displayName } = useCurrentUser();

  const [apis, setApis] = useState<Dataservice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<DataserviceSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");

  const filteredApis = useMemo(
    () => filterByStatus(apis, statusFilter),
    [apis, statusFilter]
  );

  const { totalItems, paginatedItems: paginatedApis } = useClientTableState<
    Dataservice,
    DataserviceSortField
  >({
    items: filteredApis,
    currentPage,
    pageSize,
    sortField,
    sortOrder,
    sorters: DATASERVICE_SORTERS,
  });

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage
  );

  useEffect(() => {
    async function loadDataservices() {
      setIsLoading(true);
      try {
        const response = await fetchMyDataservices(1, 9999);
        setApis(response.data || []);
      } catch (error) {
        console.error("Error loading dataservices:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDataservices();
  }, []);

  const getStatusLabel = (api: Dataservice) => {
    if (api.deleted) return "Excluído";
    if (api.archived) return "Arquivado";
    if (api.private) return "Rascunho";
    return "Público";
  };

  const getStatusVariant = (api: Dataservice) => {
    if (api.deleted) return "danger" as const;
    if (api.archived) return "neutral" as const;
    if (api.private) return "warning" as const;
    return "success" as const;
  };

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: displayName || "...", url: "#" },
            { label: "API", url: "/pages/admin/dataservices" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">API</h1>
        <PublishDropdown />
      </div>

      <p className="text-sm mb-16 text-neutral-700">{filteredApis.length} resultados</p>

      <div className="mb-24 flex items-end gap-16">
        <div className="admin-search-wrapper">
          <InputSearchBar
            hasVoiceActionButton={false}
            label="Pesquisar"
            placeholder="Pesquise o nome da API"
            aria-label="Pesquisar APIs"
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

      {!isLoading && filteredApis.length > 0 ? (
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
                  <StatusDot variant={getStatusVariant(api)}>{getStatusLabel(api)}</StatusDot>
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
                  <div className="flex gap-8">
                    <a href={`/pages/dataservices/${api.slug}`}>
                      <Icon name="agora-line-eye" className="h-[20px] w-[20px]" />
                    </a>
                    <a href={`/pages/admin/dataservices/edit?slug=${api.slug}`}>
                      <Icon name="agora-line-edit" className="h-[20px] w-[20px]" />
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
              description="Ainda não publicou uma API."
              hasAnchor={false}
              extraDescription={
                <div className="mt-24">
                  <Button
                    variant="primary"
                    appearance="outline"
                    onClick={() => (window.location.href = "/pages/admin/dataservices/new")}
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
