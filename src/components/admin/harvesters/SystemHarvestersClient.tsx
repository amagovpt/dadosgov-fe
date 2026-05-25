"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  CardNoResults,
  Icon,
  InputSearchBar,
  StatusCard,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import StatusDot from "@/components/admin/StatusDot";
import { fetchHarvesters, rejectHarvestSource, validateHarvestSource } from "@/services/api";
import type { HarvestSource } from "@/types/api";
import PublishDropdown from "@/components/admin/PublishDropdown";
import {
  ApproveHarvesterPopupContent,
  RejectHarvesterPopupContent,
} from "@/components/admin/harvesters/HarvesterValidationPopups";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import TextLink from "@/components/Primitives/TextLink";
import AdminPaginatedTable from "@/components/admin/lists/AdminPaginatedTable";
import { useDebouncedSearch } from "@/components/admin/lists/useDebouncedSearch";
import HarvestersStatusFilterSelect from "@/components/admin/lists/HarvestersStatusFilterSelect";
import HarvestersAcceptedStatusInfoCard from "@/components/admin/harvesters/HarvestersAcceptedStatusInfoCard";

const VALIDATION_STATUS: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "informative" }
> = {
  pending: { label: "Em espera de validação", variant: "warning" },
  accepted: { label: "Validado", variant: "success" },
  refused: { label: "Recusado", variant: "danger" },
};

const JOB_STATUS: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "informative" }
> = {
  pending: { label: "Pendente", variant: "informative" },
  initializing: { label: "A inicializar", variant: "informative" },
  initialized: { label: "Inicializado", variant: "informative" },
  processing: { label: "Em processamento", variant: "informative" },
  done: { label: "Terminado", variant: "success" },
  "done-errors": { label: "Terminado com erros", variant: "warning" },
  failed: { label: "Falhado", variant: "danger" },
};

function getStatus(source: HarvestSource) {
  if (source.validation?.state && source.validation.state !== "accepted") {
    return VALIDATION_STATUS[source.validation.state] || VALIDATION_STATUS.pending;
  }
  if (source.last_job?.status) {
    return (
      JOB_STATUS[source.last_job.status] || {
        label: "Sem tarefa de momento",
        variant: "informative" as const,
      }
    );
  }
  return { label: "Sem tarefa de momento", variant: "informative" as const };
}

export default function SystemHarvestersClient() {
  const [harvesters, setHarvesters] = useState<HarvestSource[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [feedback, setFeedback] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { show, hide } = usePopupContext();

  const applyValidationUpdate = useCallback((updated: HarvestSource) => {
    setHarvesters((prev) =>
      prev.map((h) =>
        h.id === updated.id ? { ...h, validation: updated.validation ?? h.validation } : h
      )
    );
  }, []);

  const handleApprove = useCallback(
    async (harvester: HarvestSource, comment: string) => {
      const updated = await validateHarvestSource(harvester.id, comment || undefined);
      applyValidationUpdate(updated);
      hide();
      setFeedback({
        variant: "success",
        message: `Harvester "${harvester.name}" aprovado.`,
      });
    },
    [applyValidationUpdate, hide]
  );

  const handleReject = useCallback(
    async (harvester: HarvestSource, comment: string) => {
      const updated = await rejectHarvestSource(harvester.id, comment);
      applyValidationUpdate(updated);
      hide();
      setFeedback({
        variant: "success",
        message: `Harvester "${harvester.name}" rejeitado.`,
      });
    },
    [applyValidationUpdate, hide]
  );

  const openApprovePopup = useCallback(
    (harvester: HarvestSource) => {
      show(
        <ApproveHarvesterPopupContent
          harvester={harvester}
          onClose={hide}
          onConfirm={(c) => handleApprove(harvester, c)}
        />,
        {
          title: "Aprovar harvester",
          closeAriaLabel: "Fechar",
          dimensions: "m",
        }
      );
    },
    [show, hide, handleApprove]
  );

  const openRejectPopup = useCallback(
    (harvester: HarvestSource) => {
      show(
        <RejectHarvesterPopupContent
          harvester={harvester}
          onClose={hide}
          onConfirm={(c) => handleReject(harvester, c)}
        />,
        {
          title: "Rejeitar harvester",
          closeAriaLabel: "Fechar",
          dimensions: "m",
        }
      );
    },
    [show, hide, handleReject]
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchHarvesters(currentPage, pageSize);
      setHarvesters(res.data || []);
      setTotalItems(res.total || 0);
    } catch (error) {
      console.error("Error loading harvesters:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = useDebouncedSearch((value: string) => {
      setSearchQuery(value);
      setCurrentPage(1);
    });

  const filtered = useMemo(() => {
    let result = harvesters;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((h) => h.name.toLowerCase().includes(q));
    }
    if (statusFilter) {
      result = result.filter((h) => {
        if (statusFilter === "failed") {
          return h.last_job?.status === "failed";
        }
        if (statusFilter === "done") {
          return h.last_job?.status === "done";
        }
        const valState = h.validation?.state;
        return valState === statusFilter;
      });
    }
    return result;
  }, [harvesters, searchQuery, statusFilter]);

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: "Sistema", url: "#" },
            { label: "Harvesters", url: "/pages/admin/system/harvesters" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">Harvesters</h1>
        <PublishDropdown />
      </div>

      <p className="text-sm mb-16 text-neutral-700">
        {isLoading ? "A carregar..." : `${totalItems} resultados`}
      </p>

      <div className="mb-24 flex items-end gap-16">
        <div className="admin-search-wrapper">
          <InputSearchBar
            hasVoiceActionButton={false}
            label="Pesquisar"
            placeholder="Pesquise o nome do harvester"
            aria-label="Pesquisar harvesters"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              handleSearch(e.target.value);
            }}
          />
        </div>
        <HarvestersStatusFilterSelect
          statusFilter={statusFilter}
          onChange={(nextStatus) => {
            setStatusFilter(nextStatus);
          }}
        />
      </div>

      {statusFilter === "accepted" && <HarvestersAcceptedStatusInfoCard />}

      {feedback && (
        <div className="mb-[24px]">
          <StatusCard variant={feedback.variant} showIcon description={feedback.message} />
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-neutral-700">A carregar...</p>
      ) : filtered.length > 0 ? (
        <AdminPaginatedTable
          pageSize={pageSize}
          totalItems={totalItems}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          setPageSize={setPageSize}
        >
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Nome</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell>Implementação</TableHeaderCell>
              <TableHeaderCell>Criado em</TableHeaderCell>
              <TableHeaderCell>Última execução</TableHeaderCell>
              <TableHeaderCell>Conjuntos de dados</TableHeaderCell>
              <TableHeaderCell>API</TableHeaderCell>
              <TableHeaderCell>Ações</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((harvester) => {
              const status = getStatus(harvester);
              return (
                <TableRow
                  key={harvester.id}
                  onClick={() => router.push(`/pages/admin/harvesters/${harvester.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <TableCell headerLabel="Nome">
                    <TextLink href={`/pages/admin/harvesters/${harvester.id}`}>
                      {harvester.name}
                    </TextLink>
                  </TableCell>
                  <TableCell headerLabel="Estado">
                    <StatusDot variant={status.variant}>{status.label}</StatusDot>
                  </TableCell>
                  <TableCell headerLabel="Implementação">{harvester.backend}</TableCell>
                  <TableCell headerLabel="Criado em">
                    {format(new Date(harvester.created_at), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell headerLabel="Última execução">
                    {harvester.last_job?.ended
                      ? format(new Date(harvester.last_job.ended), "dd/MM/yyyy")
                      : "Ainda não"}
                  </TableCell>
                  <TableCell headerLabel="Conjuntos de dados">
                    {harvester.datasets_count ?? 0}
                  </TableCell>
                  <TableCell headerLabel="API">0</TableCell>
                  <TableCell headerLabel="Ações">
                    <div className="flex items-center gap-[12px]">
                      {isAdmin && harvester.validation?.state === "pending" && (
                        <>
                          <button
                            type="button"
                            aria-label={`Aprovar harvester ${harvester.name}`}
                            title="Aprovar harvester"
                            onClick={(e) => {
                              e.stopPropagation();
                              openApprovePopup(harvester);
                            }}
                          >
                            <Icon
                              name="agora-line-check-circle"
                              className="h-[20px] w-[20px] text-success-600"
                            />
                          </button>
                          <button
                            type="button"
                            aria-label={`Rejeitar harvester ${harvester.name}`}
                            title="Rejeitar harvester"
                            onClick={(e) => {
                              e.stopPropagation();
                              openRejectPopup(harvester);
                            }}
                          >
                            <Icon
                              name="agora-line-x-circle"
                              className="h-[20px] w-[20px] text-danger-600"
                            />
                          </button>
                        </>
                      )}
                      <a
                        href={`/pages/admin/harvesters/${harvester.id}?tab=config`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Icon name="agora-line-edit" className="h-[20px] w-[20px]" />
                      </a>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </AdminPaginatedTable>
      ) : (
        <CardNoResults
          position="center"
          icon={<Icon name="agora-line-download" className="icon-xl h-12 w-12 text-primary-500" />}
          title="Sem harvesters"
          description="Nenhum harvester encontrado."
          hasAnchor={false}
        />
      )}
    </div>
  );
}
