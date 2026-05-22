"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Breadcrumb,
  CardNoResults,
  Icon,
  InputSelect,
  InputSearchBar,
  DropdownSection,
  DropdownOption,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Button,
} from "@ama-pt/agora-design-system";
import StatusDot from "@/components/admin/StatusDot";
import { fetchOrgDataservices } from "@/services/api";
import { Dataservice } from "@/types/api";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { formatDateToDMY } from "@/utils/formatDate";
import TextLink from "@/components/Primitives/TextLink";
import { filterByStatus } from "@/utils/filterByStatus";
import AdminPaginatedTable from "@/components/admin/lists/AdminPaginatedTable";
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

export default function OrgDataservicesClient() {
  const params = useParams();
  const routeOrgId = params?.orgId as string | undefined;
  const { activeOrg, isLoading: isOrgLoading } = useActiveOrganization();
  const resolvedOrgId = routeOrgId || activeOrg?.id;
  const { user } = useAuth();
  const orgName = useViewedOrganizationName(resolvedOrgId, user?.organizations);

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
            { label: "API", url: "#" },
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
        <InputSelect
          label=""
          hideLabel
          placeholder="Filtrar por estado"
          id="filter-status"
          onChange={(options) => {
            setStatusFilter(options.length > 0 ? (options[0].value as string) : "");
            setCurrentPage(1);
          }}
        >
          <DropdownSection name="status">
            <DropdownOption value="" selected={statusFilter === ""}>
              Todos
            </DropdownOption>
            <DropdownOption value="public" selected={statusFilter === "public"}>
              Público
            </DropdownOption>
            <DropdownOption value="archived" selected={statusFilter === "archived"}>
              Arquivado
            </DropdownOption>
            <DropdownOption value="draft" selected={statusFilter === "draft"}>
              Rascunho
            </DropdownOption>
            <DropdownOption value="deleted" selected={statusFilter === "deleted"}>
              Excluído
            </DropdownOption>
          </DropdownSection>
        </InputSelect>
      </div>

      {isLoading ? (
        <p>A carregar...</p>
      ) : filteredApis.length > 0 ? (
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
                  {api.deleted ? (
                    <StatusDot variant="danger">Excluído</StatusDot>
                  ) : api.archived ? (
                    <StatusDot variant="neutral">Arquivado</StatusDot>
                  ) : api.private ? (
                    <StatusDot variant="warning">Rascunho</StatusDot>
                  ) : (
                    <StatusDot variant="success">Público</StatusDot>
                  )}
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
              description="A organização ainda não publicou uma API."
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
