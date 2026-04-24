"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Breadcrumb,
  CardNoResults,
  Icon,
  InputSelect,
  InputSearchBar,
  DropdownSection,
  DropdownOption,
  StatusCard,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import StatusDot from "@/components/admin/StatusDot";
import { fetchOrgHarvesters } from "@/services/api";
import { HarvestSource } from "@/types/api";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import PublishDropdown from "@/components/admin/PublishDropdown";

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

type StatusInfo = {
  label: string;
  variant: "informative" | "success" | "danger" | "warning";
};

const VALIDATION_STATUS: Record<string, StatusInfo> = {
  pending: { label: "Em espera de validação", variant: "warning" },
  refused: { label: "Recusado", variant: "danger" },
};

const JOB_STATUS: Record<string, StatusInfo> = {
  done: { label: "Terminado", variant: "success" },
  failed: { label: "Falhado", variant: "danger" },
  started: { label: "Em execução", variant: "warning" },
};

const getStatus = (source: HarvestSource): StatusInfo => {
  // Show validation state when it isn't "accepted" — matches the
  // dropdown filter options (Pendente / Validado / Recusado).
  if (source.validation?.state && source.validation.state !== "accepted") {
    return (
      VALIDATION_STATUS[source.validation.state] || VALIDATION_STATUS.pending
    );
  }
  // Otherwise show the latest job execution status.
  if (source.last_job?.status) {
    return (
      JOB_STATUS[source.last_job.status] || {
        label: "Sem tarefa de momento",
        variant: "informative",
      }
    );
  }
  return { label: "Sem execução", variant: "informative" };
};

export default function OrgHarvestersClient() {
  const params = useParams();
  const orgIdFromUrl = params?.orgId as string | undefined;
  const { activeOrg, isLoading: isOrgLoading, selectOrganization } = useActiveOrganization();

  const orgId = orgIdFromUrl || activeOrg?.id;
  const { user } = useAuth();
  const orgName = useViewedOrganizationName(orgId, user?.organizations);

  const [harvesters, setHarvesters] = useState<HarvestSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (orgIdFromUrl && activeOrg?.id !== orgIdFromUrl) {
      selectOrganization(orgIdFromUrl);
    }
  }, [orgIdFromUrl, activeOrg?.id, selectOrganization]);

  useEffect(() => {
    if (!orgId) {
      setIsLoading(false);
      return;
    }
    async function loadHarvesters() {
      setIsLoading(true);
      try {
        const response = await fetchOrgHarvesters(orgId!, 1, 9999);
        setHarvesters(response.data || []);
      } catch (error) {
        console.error("Error loading org harvesters:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadHarvesters();
  }, [orgId]);

  const filteredHarvesters = useMemo(() => {
    if (!statusFilter) return harvesters;
    return harvesters.filter((h) => {
      if (statusFilter === "failed") {
        return h.last_job?.status === "failed";
      }
      if (statusFilter === "done") {
        return h.last_job?.status === "done";
      }
      const state = h.validation?.state ?? "pending";
      return state === statusFilter;
    });
  }, [harvesters, statusFilter]);

  const paginatedHarvesters = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredHarvesters.slice(start, start + itemsPerPage);
  }, [filteredHarvesters, currentPage, itemsPerPage]);

  if (!isOrgLoading && !orgId) {
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
            { label: "Harvesters", url: "/pages/admin/org/harvesters" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">Harvesters</h1>
        <PublishDropdown />
      </div>

      <p className="text-neutral-700 text-sm mb-[16px]">
        {harvesters.length} resultados
      </p>

      <div className="flex items-end gap-[16px] mb-[24px]">
        <div className="admin-search-wrapper">
          <InputSearchBar hasVoiceActionButton={false}
            label="Pesquisar"
            placeholder="Pesquise o nome do harvester"
            aria-label="Pesquisar harvesters"
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
            <DropdownOption value="" selected={statusFilter === ""}>Todos</DropdownOption>
            <DropdownOption value="pending" selected={statusFilter === "pending"}>Em espera de validação</DropdownOption>
            <DropdownOption value="accepted" selected={statusFilter === "accepted"}>Validado</DropdownOption>
            <DropdownOption value="refused" selected={statusFilter === "refused"}>Recusado</DropdownOption>
            <DropdownOption value="done" selected={statusFilter === "done"}>Terminado</DropdownOption>
            <DropdownOption value="failed" selected={statusFilter === "failed"}>Falhado</DropdownOption>
          </DropdownSection>
        </InputSelect>
      </div>

      {statusFilter === "accepted" && (
        <div className="mb-[24px]">
          <StatusCard
            type="info"
            description="O estado 'Validado' refere-se ao processo de aprovação do harvester e é independente da última execução — a lista pode incluir harvesters com última execução 'Terminado' ou 'Falhado'."
          />
        </div>
      )}

      {isLoading ? (
        <p>A carregar...</p>
      ) : harvesters.length > 0 ? (
        <>
          <Table
            paginationProps={{
              itemsPerPageLabel: "Linhas por página",
              itemsPerPage,
              totalItems: harvesters.length,
              availablePageSizes: [5, 10, 20],
              currentPage: currentPage - 1,
              buttonDropdownAriaLabel: "Selecionar linhas por página",
              dropdownListAriaLabel: "Opções de linhas por página",
              prevButtonAriaLabel: "Página anterior",
              nextButtonAriaLabel: "Próxima página",
              onPageChange: (page: number) => setCurrentPage(page + 1),
              onItemsPerPageChange: (size: number) => {
                setItemsPerPage(size);
                setCurrentPage(1);
              },
            }}
          >
            <TableHeader>
              <TableRow>
                <TableHeaderCell sortType="date" sortOrder="none">
                  Nome
                </TableHeaderCell>
                <TableHeaderCell>Estado</TableHeaderCell>
                <TableHeaderCell>Implementação</TableHeaderCell>
                <TableHeaderCell sortType="date" sortOrder="none">
                  Criado em
                </TableHeaderCell>
                <TableHeaderCell sortType="date" sortOrder="none">
                  Última execução
                </TableHeaderCell>
                <TableHeaderCell>Conjuntos de dados</TableHeaderCell>
                <TableHeaderCell>API</TableHeaderCell>
                <TableHeaderCell>Ações</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedHarvesters.map((harvester, index) => (
                <TableRow key={index}>
                  <TableCell headerLabel="Nome">
                    <a
                      href={`/pages/admin/org/harvesters/${harvester.id}`}
                      className="text-primary-600 underline"
                    >
                      {harvester.name}
                    </a>
                  </TableCell>
                  <TableCell headerLabel="Estado">
                    {(() => {
                      const status = getStatus(harvester);
                      return (
                        <StatusDot variant={status.variant}>
                          {status.label}
                        </StatusDot>
                      );
                    })()}
                  </TableCell>
                  <TableCell headerLabel="Implementação">
                    {harvester.backend}
                  </TableCell>
                  <TableCell headerLabel="Criado em">
                    {formatDate(harvester.created_at)}
                  </TableCell>
                  <TableCell headerLabel="Última execução">
                    {harvester.last_job
                      ? formatDate(harvester.last_job.started ?? harvester.last_job.ended ?? "")
                      : "Ainda não"}
                  </TableCell>
                  <TableCell headerLabel="Conjuntos de dados">
                    {harvester.datasets_count ?? 0}
                  </TableCell>
                  <TableCell headerLabel="API">
                    {harvester.backend}
                  </TableCell>
                  <TableCell headerLabel="Ações">
                    <a href={`/pages/admin/harvesters/${harvester.id}`}>
                      <Icon name="agora-line-edit" className="w-[20px] h-[20px]" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      ) : (
        <div className="datasets-page__body">
          <div className="datasets-page__content">
            <CardNoResults
              className="datasets-page__empty"
              position="center"
              icon={
                <Icon name="agora-line-buildings" className="w-12 h-12 text-primary-500 icon-xl" />
              }
              title="Sem harvesters"
              description="A organização ainda não tem harvesters."
              hasAnchor={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
