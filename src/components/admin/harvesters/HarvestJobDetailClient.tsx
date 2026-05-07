"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Breadcrumb,
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
  CardNoResults,
  StatusCard,
} from "@ama-pt/agora-design-system";
import StatusDot from "@/components/admin/StatusDot";
import { fetchHarvestJob, fetchHarvester } from "@/services/api";
import type { HarvestJob, HarvestItem, HarvestSource } from "@/types/api";

interface HarvestJobDetailClientProps {
  slug: string;
  jobId: string;
}

const JOB_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  initializing: "A inicializar",
  initialized: "Inicializado",
  started: "Iniciado",
  processing: "Em processamento",
  done: "Concluído",
  "done-errors": "Falhado",
  failed: "Falhado",
};

const ITEM_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  started: "Iniciado",
  done: "Concluído",
  failed: "Falhado",
  skipped: "Ignorado",
  archived: "Arquivado",
};

const ITEM_STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "danger" | "informative"
> = {
  pending: "informative",
  started: "informative",
  done: "success",
  failed: "danger",
  skipped: "warning",
  archived: "informative",
};

export default function HarvestJobDetailClient({
  slug,
  jobId,
}: HarvestJobDetailClientProps) {
  const [job, setJob] = useState<HarvestJob | null>(null);
  const [source, setSource] = useState<HarvestSource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [jobData, sourceData] = await Promise.all([
          fetchHarvestJob(jobId),
          fetchHarvester(slug),
        ]);
        setJob(jobData);
        setSource(sourceData);
      } catch (error) {
        console.error("Error loading harvest job:", error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [jobId, slug]);

  const handleSearch = (value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 400);
  };

  const items = job?.items || [];

  const doneCount = items.filter((i) => i.status === "done").length;
  const skippedCount = items.filter((i) => i.status === "skipped").length;
  const archivedCount = items.filter((i) => i.status === "archived").length;
  const failedCount = items.filter((i) => i.status === "failed").length;

  const filteredItems = useMemo(() => {
    let result = items;
    if (statusFilter) {
      result = result.filter((i) => i.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (i) =>
          i.remote_id.toLowerCase().includes(q) ||
          (i.dataset?.title && i.dataset.title.toLowerCase().includes(q))
      );
    }
    return result;
  }, [items, statusFilter, searchQuery]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  if (isLoading) {
    return (
      <div className="admin-page">
        <p className="text-neutral-700">A carregar...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="admin-page">
        <StatusCard variant="danger" showIcon description="Trabalho não encontrado." />
      </div>
    );
  }

  const statusLabel = JOB_STATUS_LABELS[job.status] || job.status;
  const statusVariant =
    job.status === "done"
      ? "success"
      : job.status === "failed" || job.status === "done-errors"
        ? "danger"
        : "informative";

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: "Reapers", url: "/pages/admin/system/harvesters" },
            {
              label: source?.name || "Harvester",
              url: `/pages/admin/harvesters/${slug}`,
            },
            { label: job.id.toUpperCase(), url: "#" },
          ]}
        />
      </div>

      <h1 className="text-2xl font-bold text-neutral-900 mt-16 mb-16">
        {job.id.toUpperCase()}
      </h1>

      {/* Metadata */}
      <div className="flex flex-col gap-8 text-sm text-neutral-800 mb-[24px]">
        <div className="flex items-center gap-8">
          <Icon name="agora-line-calendar" className="w-[16px] h-[16px]" />
          <span>
            <strong>Começou em:</strong>{" "}
            {job.started
              ? new Date(job.started).toLocaleString("pt-PT", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </span>
        </div>
        <div className="flex items-center gap-8">
          <Icon name="agora-line-calendar" className="w-[16px] h-[16px]" />
          <span>
            <strong>Terminou em:</strong>{" "}
            {job.ended
              ? new Date(job.ended).toLocaleString("pt-PT", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </span>
        </div>
        <div className="flex items-center gap-8">
          <Icon name="agora-line-info-mark" className="w-[16px] h-[16px]" />
          <span>
            <strong>Status:</strong>{" "}
            <span
              className={`font-bold ${
                statusVariant === "success"
                  ? "text-green-600"
                  : statusVariant === "danger"
                    ? "text-red-600"
                    : "text-neutral-700"
              }`}
            >
              {statusLabel.toUpperCase()}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-8">
          <Icon name="agora-line-info-mark" className="w-[16px] h-[16px]" />
          <span>
            <strong>Elementos:</strong>{" "}
            <Icon name="agora-line-check" className="w-[14px] h-[14px] inline" />{" "}
            {doneCount}{" "}
            <Icon name="agora-line-eye-off" className="w-[14px] h-[14px] inline" />{" "}
            {skippedCount}{" "}
            <img
              src="/Icons/box.svg"
              alt="Arquivados"
              className="w-[14px] h-[14px] inline"
            />{" "}
            {archivedCount}{" "}
            <Icon name="agora-line-x" className="w-[14px] h-[14px] inline" />{" "}
            {failedCount}{" "}
            ({items.length} no total)
          </span>
        </div>
      </div>

      {/* Items table */}
      <div className="flex items-center justify-between mb-16">
        <h2 className="text-lg font-bold text-neutral-900">
          {filteredItems.length} ITENS
        </h2>
        <div className="flex items-end gap-[16px]">
          <div className="admin-search-wrapper">
            <InputSearchBar
              hasVoiceActionButton={false}
              label="Pesquisar"
              placeholder="Pesquisar por ID"
              aria-label="Pesquisar itens"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                handleSearch(e.target.value);
              }}
            />
          </div>
          <InputSelect
            label=""
            hideLabel
            placeholder="Filtrar por status"
            id="filter-item-status"
            onChange={(options) => {
              setStatusFilter(
                options.length > 0 ? (options[0].value as string) : ""
              );
              setCurrentPage(1);
            }}
          >
            <DropdownSection name="status">
              <DropdownOption value="" selected={statusFilter === ""}>Todos</DropdownOption>
              <DropdownOption value="done" selected={statusFilter === "done"}>Concluído</DropdownOption>
              <DropdownOption value="failed" selected={statusFilter === "failed"}>Falhado</DropdownOption>
              <DropdownOption value="skipped" selected={statusFilter === "skipped"}>Ignorado</DropdownOption>
              <DropdownOption value="archived" selected={statusFilter === "archived"}>Arquivado</DropdownOption>
              <DropdownOption value="pending" selected={statusFilter === "pending"}>Pendente</DropdownOption>
            </DropdownSection>
          </InputSelect>
        </div>
      </div>

      {paginatedItems.length > 0 ? (
        <Table
          paginationProps={{
            itemsPerPageLabel: "Linhas por página",
            itemsPerPage: pageSize,
            totalItems: filteredItems.length,
            availablePageSizes: [5, 10, 20, 50],
            currentPage,
            buttonDropdownAriaLabel: "Selecionar linhas por página",
            dropdownListAriaLabel: "Opções de linhas por página",
            prevButtonAriaLabel: "Página anterior",
            nextButtonAriaLabel: "Próxima página",
            onPageChange: (page: number) => setCurrentPage(page),
            onPageSizeChange: (size: number) => {
              setPageSize(size);
              setCurrentPage(1);
            },
          }}
        >
          <TableHeader>
            <TableRow>
              <TableHeaderCell>ID</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Link dados.gov.pt</TableHeaderCell>
              <TableHeaderCell>Link fonte</TableHeaderCell>
              <TableHeaderCell>
                <Icon name="agora-line-alert-triangle" className="w-[16px] h-[16px]" />
              </TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((item: HarvestItem, index: number) => (
              <TableRow key={`${item.remote_id}-${index}`}>
                <TableCell headerLabel="ID">{item.remote_id}</TableCell>
                <TableCell headerLabel="Status">
                  <StatusDot variant={ITEM_STATUS_VARIANT[item.status] || "informative"}>
                    {ITEM_STATUS_LABELS[item.status] || item.status}
                  </StatusDot>
                </TableCell>
                <TableCell headerLabel="Link dados.gov.pt">
                  {item.dataset ? (
                    <a
                      href={`/pages/datasets/${item.dataset.id}`}
                      className="text-primary-600 underline flex items-center gap-4"
                    >
                      <Icon
                        name="agora-line-globe"
                        className="w-[14px] h-[14px]"
                      />
                      {item.dataset.title}
                    </a>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell headerLabel="Link fonte">
                  {item.remote_url ? (
                    <a
                      href={item.remote_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 underline"
                    >
                      {item.remote_url.length > 60
                        ? `${item.remote_url.slice(0, 60)}...`
                        : item.remote_url}
                    </a>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell headerLabel="Avisos">
                  {item.errors?.length > 0 ? item.errors.length : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <CardNoResults
          position="center"
          icon={
            <Icon
              name="agora-line-search"
              className="w-12 h-12 text-primary-500 icon-xl"
            />
          }
          title="Sem itens"
          description="Nenhum item encontrado com os filtros aplicados."
          hasAnchor={false}
        />
      )}
    </div>
  );
}
