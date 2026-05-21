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
import { createPaginationProps } from "@/utils/createPaginationProps";
import StatusDot from "@/components/admin/StatusDot";
import { fetchHarvestJob, fetchHarvester } from "@/services/api";
import type { HarvestJob, HarvestItem, HarvestSource } from "@/types/api";
import TextLink from "@/components/Primitives/TextLink";

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

const ITEM_STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "informative"> = {
  pending: "informative",
  started: "informative",
  done: "success",
  failed: "danger",
  skipped: "warning",
  archived: "informative",
};

export default function HarvestJobDetailClient({ slug, jobId }: HarvestJobDetailClientProps) {
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

      <h1 className="text-2xl mb-16 mt-16 font-bold text-neutral-900">{job.id.toUpperCase()}</h1>

      {/* Metadata */}
      <div className="text-sm mb-24 flex flex-col gap-8 text-neutral-800">
        <div className="flex items-center gap-8">
          <Icon name="agora-line-calendar" className="h-16 w-16" />
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
          <Icon name="agora-line-calendar" className="h-16 w-16" />
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
          <Icon name="agora-line-info-mark" className="h-16 w-16" />
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
          <Icon name="agora-line-info-mark" className="h-16 w-16" />
          <span>
            <strong>Elementos:</strong>{" "}
            <Icon name="agora-line-check" className="inline h-[14px] w-[14px]" /> {doneCount}{" "}
            <Icon name="agora-line-eye-off" className="inline h-[14px] w-[14px]" /> {skippedCount}{" "}
            <img src="/Icons/box.svg" alt="Arquivados" className="inline h-[14px] w-[14px]" />{" "}
            {archivedCount} <Icon name="agora-line-x" className="inline h-[14px] w-[14px]" />{" "}
            {failedCount} ({items.length} no total)
          </span>
        </div>
      </div>

      {/* Items table */}
      <div className="mb-16 flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-900">{filteredItems.length} ITENS</h2>
        <div className="flex items-end gap-16">
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
              setStatusFilter(options.length > 0 ? (options[0].value as string) : "");
              setCurrentPage(1);
            }}
          >
            <DropdownSection name="status">
              <DropdownOption value="" selected={statusFilter === ""}>
                Todos
              </DropdownOption>
              <DropdownOption value="done" selected={statusFilter === "done"}>
                Concluído
              </DropdownOption>
              <DropdownOption value="failed" selected={statusFilter === "failed"}>
                Falhado
              </DropdownOption>
              <DropdownOption value="skipped" selected={statusFilter === "skipped"}>
                Ignorado
              </DropdownOption>
              <DropdownOption value="archived" selected={statusFilter === "archived"}>
                Arquivado
              </DropdownOption>
              <DropdownOption value="pending" selected={statusFilter === "pending"}>
                Pendente
              </DropdownOption>
            </DropdownSection>
          </InputSelect>
        </div>
      </div>

      {paginatedItems.length > 0 ? (
        <Table
          paginationProps={createPaginationProps(
            pageSize,
            filteredItems.length,
            currentPage,
            setCurrentPage,
            setPageSize,
            { currentPageIsZeroBased: true }
          )}
        >
          <TableHeader>
            <TableRow>
              <TableHeaderCell>ID</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Link dados.gov.pt</TableHeaderCell>
              <TableHeaderCell>Link fonte</TableHeaderCell>
              <TableHeaderCell>
                <Icon name="agora-line-alert-triangle" className="h-16 w-16" />
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
                    <TextLink
                      href={`/pages/datasets/${item.dataset.id}`}
                      className="flex items-center gap-4"
                    >
                      <Icon name="agora-line-globe" className="h-[14px] w-[14px]" />
                      {item.dataset.title}
                    </TextLink>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell headerLabel="Link fonte">
                  {item.remote_url ? (
                    <TextLink href={item.remote_url}>
                      {item.remote_url.length > 60
                        ? `${item.remote_url.slice(0, 60)}...`
                        : item.remote_url}
                    </TextLink>
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
          icon={<Icon name="agora-line-search" className="icon-xl h-12 w-12 text-primary-500" />}
          title="Sem itens"
          description="Nenhum item encontrado com os filtros aplicados."
          hasAnchor={false}
        />
      )}
    </div>
  );
}
