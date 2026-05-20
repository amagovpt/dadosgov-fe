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
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Button,
} from "@ama-pt/agora-design-system";
import StatusDot from "@/components/admin/StatusDot";
import { fetchOrgDataservices } from "@/api/dataservices/route";
import { Dataservice } from "@/types/api";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { formatDateToDMY } from "@/utils/formatDate";

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

  const filteredApis = useMemo(() => {
    if (!statusFilter) return apis;
    return apis.filter((a) => {
      switch (statusFilter) {
        case "public":
          return !a.private && !a.archived && !a.deleted;
        case "draft":
          return a.private && !a.archived && !a.deleted;
        case "archived":
          return !!a.archived && !a.deleted;
        case "deleted":
          return !!a.deleted;
        default:
          return true;
      }
    });
  }, [apis, statusFilter]);

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

  if (!isOrgLoading && !resolvedOrgId) {
    return (
      <div className="admin-page">
        <CardNoResults
          className="datasets-page__empty"
          position="center"
          icon={
            <Icon name="agora-line-buildings" className="w-12 h-12 text-primary-500 icon-xl" />
          }
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

      <p className="text-neutral-700 text-sm mb-16">
        {filteredApis.length} resultados
      </p>

      <div className="flex items-end gap-16 mb-24">
        <div className="admin-search-wrapper">
          <InputSearchBar hasVoiceActionButton={false}
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
          }}
        >
          <DropdownSection name="status">
            <DropdownOption value="" selected={statusFilter === ""}>Todos</DropdownOption>
            <DropdownOption value="public" selected={statusFilter === "public"}>Público</DropdownOption>
            <DropdownOption value="archived" selected={statusFilter === "archived"}>Arquivado</DropdownOption>
            <DropdownOption value="draft" selected={statusFilter === "draft"}>Rascunho</DropdownOption>
            <DropdownOption value="deleted" selected={statusFilter === "deleted"}>Excluído</DropdownOption>
          </DropdownSection>
        </InputSelect>
      </div>

      {isLoading ? (
        <p>A carregar...</p>
      ) : filteredApis.length > 0 ? (
        <Table
          paginationProps={{
            itemsPerPageLabel: "Linhas por página",
            itemsPerPage: 5,
            totalItems: filteredApis.length,
            availablePageSizes: [5, 10, 20],
            currentPage: 0,
            buttonDropdownAriaLabel: "Selecionar linhas por página",
            dropdownListAriaLabel: "Opções de linhas por página",
            prevButtonAriaLabel: "Página anterior",
            nextButtonAriaLabel: "Próxima página",
          }}
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
                  <a
                    href={`/pages/dataservices/${api.slug}`}
                    className="text-primary-600 underline"
                  >
                    {api.title}
                  </a>
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
                <TableCell headerLabel="Criado em">
                  {formatDateToDMY(api.created_at)}
                </TableCell>
                <TableCell headerLabel="Modificado em">
                  {formatDateToDMY(api.last_modified)}
                  <br />
                  <span className="text-sm text-neutral-500">
                    sobre{" "}
                    <span className="text-success-600">●</span>{" "}
                    {api.owner
                      ? `${api.owner.first_name} ${api.owner.last_name}`
                      : "—"}
                  </span>
                </TableCell>
                <TableCell headerLabel="Ações">
                  <div className="flex gap-8">
                    <a href={`/pages/dataservices/${api.slug}`}>
                      <Icon name="agora-line-eye" className="w-[20px] h-[20px]" />
                    </a>
                    <a href={`/pages/admin/dataservices/edit?slug=${api.slug}`}>
                      <Icon name="agora-line-edit" className="w-[20px] h-[20px]" />
                    </a>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="datasets-page__body">
          <div className="datasets-page__content">
            <CardNoResults
              className="datasets-page__empty"
              position="center"
              icon={
                <Icon name="agora-line-edit" className="w-12 h-12 text-primary-500 icon-xl" />
              }
              title="Sem publicações"
              description="A organização ainda não publicou uma API."
              hasAnchor={false}
              extraDescription={
                <div className="mt-24">
                  <Button
                    variant="primary"
                    appearance="outline"
                    onClick={() => window.location.href = '/pages/admin/dataservices/new'}
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
