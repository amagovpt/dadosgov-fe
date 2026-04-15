"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Breadcrumb,
  Button,
  Icon,
  StatusCard,
  Tabs,
  Tab,
  TabHeader,
  TabBody,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Pill,
  CardNoResults,
  InputText,
  InputTextArea,
  InputSelect,
  DropdownSection,
  DropdownOption,
  Switch,
} from "@ama-pt/agora-design-system";
import StatusDot from "@/components/admin/StatusDot";
import PublishDropdown from "@/components/admin/PublishDropdown";
import AuxiliarList from "@/components/admin/AuxiliarList";
import {
  fetchHarvester,
  fetchHarvestJobs,
  fetchHarvestBackends,
  updateHarvester,
  scheduleHarvester,
  unscheduleHarvester,
  previewHarvestSource,
} from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import type { HarvestBackend, HarvestPreviewJob, HarvestSource, HarvestJob } from "@/types/api";

interface HarvesterDetailClientProps {
  slug: string;
}

const VALIDATION_LABELS: Record<string, { label: string; variant: "warning" | "success" | "danger" }> = {
  pending: { label: "VALIDAÇÃO PENDENTE", variant: "warning" },
  accepted: { label: "VALIDADO", variant: "success" },
  refused: { label: "RECUSADO", variant: "danger" },
};

const FILTER_KEY_LABELS: Record<string, string> = {
  Organization: "Organização",
  Tag: "Etiqueta",
  Publisher: "Editor",
  "Remote ID": "ID Remoto",
};

const localizeFilterLabel = (label: string) => FILTER_KEY_LABELS[label] ?? label;

const JOB_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  initializing: "A inicializar",
  initialized: "Inicializado",
  started: "Iniciado",
  processing: "Em processamento",
  done: "Terminado",
  "done-errors": "Falhado",
  failed: "Falhado",
};

export default function HarvesterDetailClient({ slug }: HarvesterDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isConfigTab = searchParams.get("tab") === "config";
  const { user } = useAuth();
  const [source, setSource] = useState<HarvestSource | null>(null);
  const [jobs, setJobs] = useState<HarvestJob[]>([]);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsPageSize, setJobsPageSize] = useState(10);
  const [backends, setBackends] = useState<HarvestBackend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Config form state
  const [harvesterName, setHarvesterName] = useState("");
  const [harvesterDescription, setHarvesterDescription] = useState("");
  const [harvesterUrl, setHarvesterUrl] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [isAutoArchive, setIsAutoArchive] = useState(true);
  const [filters, setFilters] = useState<{ type: string; value: string; mode: string }[]>([]);
  const harvesterScheduleRef = useRef("");
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewJob, setPreviewJob] = useState<HarvestPreviewJob | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [selectedBackend, setSelectedBackend] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [data, backendsData] = await Promise.all([
          fetchHarvester(slug),
          fetchHarvestBackends(),
        ]);
        setBackends(backendsData);
        setSource(data);
        if (data) {
          setHarvesterName(data.name);
          setHarvesterDescription(data.description || "");
          setHarvesterUrl(data.url);
          setIsEnabled(data.active);
          setIsAutoArchive(data.autoarchive);
          harvesterScheduleRef.current = data.schedule || "";
          setSelectedBackend(data.backend);
          const existingFilters = (data.config?.filters as { key?: string; value?: string; type?: string }[] | undefined) || [];
          setFilters(existingFilters.map((f) => ({ type: f.key || "", value: String(f.value || ""), mode: f.type || "include" })));
          const jobsRes = await fetchHarvestJobs(data.id, jobsPage, jobsPageSize);
          setJobs(jobsRes.data || []);
          setJobsTotal(jobsRes.total || 0);
        }
      } catch (error) {
        console.error("Error loading harvester:", error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [slug]);

  const jobsInitialLoadDone = useRef(false);

  useEffect(() => {
    if (!jobsInitialLoadDone.current) {
      jobsInitialLoadDone.current = true;
      return;
    }
    if (!source) return;
    async function loadJobsPage() {
      try {
        const jobsRes = await fetchHarvestJobs(source!.id, jobsPage, jobsPageSize);
        setJobs(jobsRes.data || []);
        setJobsTotal(jobsRes.total || 0);
      } catch (error) {
        console.error("Error loading jobs:", error);
      }
    }
    loadJobsPage();
  }, [jobsPage, jobsPageSize]);  // eslint-disable-line react-hooks/exhaustive-deps

  const clearError = (field: string) => {
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const activeBackendFilters = useMemo(
    () => backends.find((b) => b.id === selectedBackend)?.filters ?? [],
    [backends, selectedBackend],
  );

  const addFilter = () => {
    const firstKey = activeBackendFilters[0]?.key ?? "";
    setFilters((prev) => [...prev, { type: firstKey, value: "", mode: "include" }]);
  };

  const removeFilter = (index: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, field: string, value: string) => {
    setFilters((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [field]: value } : f))
    );
  };

  const handleSave = async () => {
    const errors: Record<string, boolean> = {};
    if (!harvesterName.trim()) errors.harvesterName = true;
    if (!harvesterUrl.trim()) errors.harvesterUrl = true;
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      requestAnimationFrame(() => {
        document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }

    if (!source) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const newSchedule = harvesterScheduleRef.current.trim();
      const oldSchedule = source.schedule || "";

      const [updated] = await Promise.all([
        updateHarvester(source.id, {
          name: harvesterName.trim(),
          description: harvesterDescription.trim() || undefined,
          url: harvesterUrl.trim(),
          backend: selectedBackend || source.backend,
          active: isEnabled,
          autoarchive: isAutoArchive,
          ...(filters.some((f) => f.value.trim() && f.type) && {
            config: {
              filters: filters
                .filter((f) => f.value.trim() && f.type)
                .map((f) => ({ key: f.type, value: f.value, type: f.mode })),
            },
          }),
        }),
        newSchedule && newSchedule !== oldSchedule
          ? scheduleHarvester(source.id, newSchedule)
          : !newSchedule && oldSchedule
            ? unscheduleHarvester(source.id)
            : Promise.resolve(),
      ]);
      setSource(updated as HarvestSource);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 10000);
    } catch (err) {
      const e = err as { status?: number; data?: unknown };
      console.error("Error saving harvester:", e.status, e.data ?? err);
      const msg = typeof e.data === "object" && e.data !== null
        ? JSON.stringify(e.data)
        : "Tente novamente.";
      setSaveError(`Erro ao guardar (${e.status ?? "?"}) — ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!source) return;
    setIsPreviewing(true);
    setPreviewJob(null);
    setPreviewError(null);
    try {
      const job = await previewHarvestSource({
        name: harvesterName.trim() || source.name,
        url: harvesterUrl.trim() || source.url,
        backend: selectedBackend || source.backend,
        schedule: harvesterScheduleRef.current.trim() || undefined,
        active: isEnabled,
        autoarchive: isAutoArchive,
        ...(filters.some((f) => f.value.trim() && f.type) && {
          config: {
            filters: filters
              .filter((f) => f.value.trim() && f.type)
              .map((f) => ({ key: f.type, value: f.value, type: f.mode })),
          },
        }),
      });
      setPreviewJob(job);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string }; message?: string };
      setPreviewError(
        error?.data?.message || error?.message || "Erro ao pré-visualizar o harvester."
      );
    } finally {
      setIsPreviewing(false);
    }
  };

  const producerOptions = useMemo(
    () => (
      <DropdownSection name="identity">
        <DropdownOption value="user">
          {user ? `${user.first_name} ${user.last_name}` : "Eu próprio"}
        </DropdownOption>
        <>
          {(user?.organizations || []).map((org) => (
            <DropdownOption key={org.id} value={org.id}>
              {org.name}
            </DropdownOption>
          ))}
        </>
      </DropdownSection>
    ),
    [user],
  );

  const typeOptions = useMemo(
    () => (
      <DropdownSection name="types">
        {backends.map((b) => (
          <DropdownOption key={b.id} value={b.id} selected={b.id === selectedBackend}>
            {b.label}
          </DropdownOption>
        ))}
      </DropdownSection>
    ),
    [backends, selectedBackend],
  );


  const auxiliarItems = [
    {
      title: "Escolha um nome",
      content:
        "Dê um nome ao seu harvester. Esta é uma referência interna que o ajudará a identificá-lo caso crie vários harvesters. O nome do seu harvester não será público.",
      hasError: !!formErrors.harvesterName,
    },
    {
      title: "Descreva o seu harvester",
      content:
        "Adicione detalhes no campo de descrição para seu uso interno. A descrição é opcional.",
    },
    {
      title: "Selecione o URL correto",
      content:
        "Insira aqui o URL do portal que deseja recolher. Normalmente, trata-se do URL da página inicial do seu portal de dados abertos. O URL permite que o harvester navegue e recupere todos os seus conjuntos de dados.",
      hasError: !!formErrors.harvesterUrl,
    },
    {
      title: "Selecione o tipo de implementação",
      content:
        "Escolha o formato dos metadados (por exemplo, DCAT, CKAN, etc.). Esse formato permite que o harvester saiba como ler e interpretar os seus metadados, para que possam ser transcritos corretamente em dados.gov.pt.",
    },
  ];

  if (isLoading) {
    return (
      <div className="admin-page">
        <p className="text-neutral-700">A carregar...</p>
      </div>
    );
  }

  if (!source) {
    return (
      <div className="admin-page">
        <StatusCard type="danger" description="Harvester não encontrado." />
      </div>
    );
  }

  const validationState = source.validation?.state || "pending";
  const validationInfo = VALIDATION_LABELS[validationState] || VALIDATION_LABELS.pending;

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Sistema", url: "/pages/admin/system/harvesters" },
            { label: source.name, url: "#" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">{source.name}</h1>
        <PublishDropdown />
      </div>

      {/* Metadata info */}
      <div className="flex flex-col gap-8 text-sm text-neutral-800 mb-[24px]">
        <div className="flex items-center gap-8">
          <Icon name="agora-line-info-mark" className="w-[16px] h-[16px]" />
          <span>
            <strong>Implementação:</strong> {source.backend}
          </span>
        </div>
        <div className="flex items-center gap-8">
          <Icon name="agora-line-globe" className="w-[16px] h-[16px]" />
          <span>
            <strong>URL:</strong>{" "}
            <code className="text-xs" title={source.url}>{source.url.length > 100 ? `${source.url.slice(0, 100)}...` : source.url}</code>
          </span>
        </div>
        <div className="flex items-center gap-8">
          <Icon name="agora-line-calendar" className="w-[16px] h-[16px]" />
          <span>
            <strong>Planeamento:</strong> {source.schedule || "Não aplicável"}
          </span>
        </div>
        <div className="flex items-center gap-8">
          <Icon name="agora-line-check-circle" className="w-[16px] h-[16px]" />
          <span>
            <strong>Estado :</strong>{" "}
            <Pill variant={validationInfo.variant}>{validationInfo.label}</Pill>
          </span>
        </div>
      </div>

      {/* Validation pending banner */}
      {validationState === "pending" && (
        <div className="bg-neutral-100 rounded p-[24px] flex flex-col gap-8 mb-[24px]" style={{ maxWidth: "calc(100% - var(--admin-auxiliar-width) - var(--admin-auxiliar-gap))" }}>
          <p className="text-sm font-bold text-neutral-900">
            O seu harvester foi criado e está a aguardar validação da equipa de administração do portal.
          </p>
          <p className="text-sm text-neutral-700">
            Informe-nos através do formulário de contacto abaixo se deseja que validemos o seu harvester. Será notificado da aprovação (ou rejeição).
          </p>
          <a href="#" className="flex items-center gap-8 text-sm text-primary-600">
            Solicitar validação do harvester
            <Icon name="agora-line-arrow-right-circle" className="w-[20px] h-[20px]" />
          </a>
        </div>
      )}

      {/* Tabs */}
      <Tabs>
        <Tab active={isConfigTab ? undefined : true}>
          <TabHeader>Trabalhos</TabHeader>
          <TabBody>
            {jobs.length === 0 ? (
              <CardNoResults
                icon={<Icon name="agora-line-edit" className="w-12 h-12 text-primary-500 icon-xl" />}
                title="Sem trabalhos no momento"
                position="center"
                hasAnchor={false}
                extraDescription={
                  <div className="mt-24">
                    <Button variant="primary" appearance="outline">
                      Aceda às configurações
                    </Button>
                  </div>
                }
              />
            ) : (
              <Table
                paginationProps={{
                  itemsPerPageLabel: "Linhas por página",
                  itemsPerPage: jobsPageSize,
                  totalItems: jobsTotal,
                  availablePageSizes: [5, 10, 20],
                  currentPage: jobsPage - 1,
                  buttonDropdownAriaLabel: "Selecionar linhas por página",
                  dropdownListAriaLabel: "Opções de linhas por página",
                  prevButtonAriaLabel: "Página anterior",
                  nextButtonAriaLabel: "Próxima página",
                  onPageChange: (newPage) => setJobsPage(newPage + 1),
                  onPageSizeChange: (newPageSize) => {
                    setJobsPageSize(newPageSize);
                    setJobsPage(1);
                  },
                }}
              >
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>ID de tarefa</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Começou em</TableHeaderCell>
                    <TableHeaderCell>Concluído em</TableHeaderCell>
                    <TableHeaderCell>Conjuntos de dados</TableHeaderCell>
                    <TableHeaderCell>API</TableHeaderCell>
                    <TableHeaderCell>
                      <Icon name="agora-line-check" className="w-[16px] h-[16px]" />
                    </TableHeaderCell>
                    <TableHeaderCell>
                      <Icon name="agora-line-eye-off" className="w-[16px] h-[16px]" />
                    </TableHeaderCell>
                    <TableHeaderCell>
                      <img src="/Icons/box.svg" alt="Arquivados" className="w-[24px] h-[24px]" />
                    </TableHeaderCell>
                    <TableHeaderCell>
                      <Icon name="agora-line-x" className="w-[16px] h-[16px]" />
                    </TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => {
                    const items = job.items || [];
                    const doneCount = items.filter((i) => i.status === "done").length;
                    const skippedCount = items.filter((i) => i.status === "skipped").length;
                    const archivedCount = items.filter((i) => i.status === "archived").length;
                    const failedCount = items.filter((i) => i.status === "failed").length;
                    return (
                    <TableRow key={job.id}>
                      <TableCell headerLabel="ID de tarefa">
                        <a
                          href={`/pages/admin/harvesters/${slug}/jobs/${job.id}`}
                          className="text-primary-600 underline uppercase text-xs"
                        >
                          {job.id}
                        </a>
                      </TableCell>
                      <TableCell headerLabel="Status">
                        <StatusDot
                          variant={
                            job.status === "done"
                              ? "success"
                              : job.status === "failed" || job.status === "done-errors"
                                ? "danger"
                                : "informative"
                          }
                        >
                          {JOB_STATUS_LABELS[job.status] || job.status}
                        </StatusDot>
                      </TableCell>
                      <TableCell headerLabel="Começou em">
                        {job.started
                          ? new Date(job.started).toLocaleString("pt-PT", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </TableCell>
                      <TableCell headerLabel="Concluído em">
                        {job.ended
                          ? new Date(job.ended).toLocaleString("pt-PT", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </TableCell>
                      <TableCell headerLabel="Conjuntos de dados">
                        {items.length}
                      </TableCell>
                      <TableCell headerLabel="API">
                        {job.errors?.length || 0}
                      </TableCell>
                      <TableCell headerLabel="Concluídos">
                        {doneCount}
                      </TableCell>
                      <TableCell headerLabel="Ignorados">
                        {skippedCount}
                      </TableCell>
                      <TableCell headerLabel="Arquivados">
                        {archivedCount}
                      </TableCell>
                      <TableCell headerLabel="Falhados">
                        {failedCount}
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </TabBody>
        </Tab>

        <Tab active={isConfigTab ? true : undefined}>
          <TabHeader>Configuração</TabHeader>
          <TabBody>
            <div className="admin-page__body">
              <div className="admin-page__form-area">
                <form
                  className="admin-page__form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSave();
                  }}
                >
                  <p className="text-neutral-900 text-base leading-7 pt-32">
                    Os campos marcados com um asterisco ( <span className="text-red-600">*</span> ) são obrigatórios.
                  </p>

                  <h2 className="admin-page__section-title">Descrição</h2>

                  <div className="admin-page__fields-group">
                    <InputText
                      label="Nome *"
                      placeholder=""
                      id="harvester-name"
                      value={harvesterName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setHarvesterName(e.target.value);
                        if (e.target.value.trim()) clearError("harvesterName");
                      }}
                      hasError={!!formErrors.harvesterName}
                      hasFeedback={!!formErrors.harvesterName}
                      feedbackState="danger"
                      errorFeedbackText="Campo obrigatório"
                    />

                    <InputTextArea
                      label="Descrição"
                      placeholder=""
                      id="harvester-description"
                      rows={6}
                      value={harvesterDescription}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setHarvesterDescription(e.target.value)
                      }
                    />

                    <InputText
                      label="URL *"
                      placeholder=""
                      id="harvester-url"
                      value={harvesterUrl}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setHarvesterUrl(e.target.value);
                        if (e.target.value.trim()) clearError("harvesterUrl");
                      }}
                      hasError={!!formErrors.harvesterUrl}
                      hasFeedback={!!formErrors.harvesterUrl}
                      feedbackState="danger"
                      errorFeedbackText="Campo obrigatório"
                    />
                  </div>

                  <h2 className="admin-page__section-title">Implementação</h2>

                  <div className="admin-page__fields-group">
                    <InputSelect
                      key={`harvester-type-${selectedBackend}`}
                      label="Tipo *"
                      placeholder=""
                      id="harvester-type"
                      defaultValue={selectedBackend}
                      searchable
                      searchInputPlaceholder="Escreva para pesquisar..."
                      searchNoResultsText="Nenhum resultado encontrado"
                      onChange={(options) => {
                        if (options.length > 0) setSelectedBackend(options[0].value as string);
                      }}
                    >
                      {typeOptions}
                    </InputSelect>

                    {activeBackendFilters.length > 0 && (
                      <div>
                        <p className="text-primary-900 text-base font-medium leading-7">
                          Filtros
                        </p>

                        {filters.map((filter, index) => (
                          <div
                            key={index}
                            className={`mt-[8px] pb-[16px] mb-[8px] ${index < filters.length - 1 ? "border-b border-neutral-200" : ""}`}
                          >
                            <div className="flex items-center gap-[8px]">
                              <InputSelect
                                key={`filter-mode-select-${index}`}
                                label="Modo"
                                placeholder=""
                                id={`filter-mode-${index}`}
                                defaultValue={filter.mode}
                                onChange={(opts) => {
                                  if (opts.length > 0) updateFilter(index, "mode", opts[0].value as string);
                                }}
                              >
                                <DropdownSection name="mode">
                                  <DropdownOption value="include" selected={filter.mode === "include"}>Incluir</DropdownOption>
                                  <DropdownOption value="exclude" selected={filter.mode === "exclude"}>Excluir</DropdownOption>
                                </DropdownSection>
                              </InputSelect>
                              <InputSelect
                                key={`filter-type-select-${index}-${selectedBackend}`}
                                label="Chave do filtro"
                                placeholder="Selecione uma chave"
                                id={`filter-type-${index}`}
                                defaultValue={filter.type}
                                onChange={(opts) => {
                                  if (opts.length > 0) updateFilter(index, "type", opts[0].value as string);
                                }}
                              >
                                <DropdownSection name="type">
                                  {activeBackendFilters.map((f) => (
                                    <DropdownOption key={f.key} value={f.key} selected={filter.type === f.key}>
                                      {localizeFilterLabel(f.label)}
                                    </DropdownOption>
                                  ))}
                                </DropdownSection>
                              </InputSelect>
                            </div>
                            <div className="flex items-center gap-[8px] mt-[8px]">
                              <div className="flex-1">
                                <InputText
                                  key={`filter-value-${index}`}
                                  label=""
                                  hideLabel
                                  placeholder=""
                                  id={`filter-value-${index}`}
                                  defaultValue={filter.value}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    updateFilter(index, "value", e.target.value)
                                  }
                                />
                              </div>
                              <Button
                                variant="danger"
                                hasIcon
                                iconOnly
                                leadingIcon="agora-line-trash"
                                leadingIconHover="agora-solid-trash"
                                onClick={() => removeFilter(index)}
                                aria-label="Excluir filtro"
                              >
                                {" "}
                              </Button>
                            </div>
                          </div>
                        ))}

                        <Button
                          appearance="link"
                          variant="primary"
                          hasIcon
                          leadingIcon="agora-line-plus-circle"
                          leadingIconHover="agora-solid-plus-circle"
                          onClick={addFilter}
                        >
                          Adicionar um filtro
                        </Button>
                      </div>
                    )}

                    <div className="flex gap-[48px]">
                      <Switch
                        label="Ativado"
                        checked={isEnabled}
                        onChange={() => setIsEnabled((v) => !v)}
                      />
                      <Switch
                        label="Arquivamento automático"
                        checked={isAutoArchive}
                        onChange={() => setIsAutoArchive((v) => !v)}
                      />
                    </div>
                  </div>

                  <h2 className="admin-page__section-title">Avançado</h2>

                  <div className="admin-page__fields-group">
                    <InputText
                      key={`schedule-${source.id}`}
                      label="Planeamento"
                      placeholder=""
                      id="harvester-schedule"
                      defaultValue={harvesterScheduleRef.current}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        harvesterScheduleRef.current = e.target.value;
                      }}
                    />
                  </div>

                  {saveSuccess && (
                    <p className="text-sm text-green-600 text-right">Guardado com sucesso.</p>
                  )}
                  {saveError && (
                    <p className="text-sm text-red-600 text-right">{saveError}</p>
                  )}

                  <div className="admin-page__actions flex justify-end gap-[16px]">
                    <Button
                      appearance="outline"
                      variant="primary"
                      type="button"
                      disabled={isPreviewing}
                      onClick={handlePreview}
                    >
                      {isPreviewing ? "A pré-visualizar..." : "Pré-visualizar"}
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      hasIcon
                      trailingIcon="agora-line-check-circle"
                      trailingIconHover="agora-solid-check-circle"
                      disabled={isSaving}
                    >
                      {isSaving ? "A guardar..." : "Guardar"}
                    </Button>
                  </div>

                  {/* Preview results */}
                  {(isPreviewing || previewJob || previewError) && (
                    <div className="mt-[24px] flex flex-col gap-[12px]">
                      <h2 className="admin-page__section-title">Resultado da pré-visualização</h2>

                      {isPreviewing && (
                        <StatusCard
                          type="info"
                          description={<strong>A pré-visualizar o harvester... Por favor aguarde.</strong>}
                        />
                      )}

                      {previewError && (
                        <StatusCard
                          type="danger"
                          description={<><strong>Erro</strong> — {previewError}</>}
                        />
                      )}

                      {previewJob && (
                        <>
                          <div className="flex flex-col gap-[6px] text-sm text-neutral-800">
                            <p className="flex items-center gap-[8px]">
                              <Icon name="agora-line-calendar" className="w-[16px] h-[16px]" />
                              <span>
                                <strong>Iniciado em:</strong>{" "}
                                {previewJob.started
                                  ? new Date(previewJob.started).toLocaleString("pt-PT", {
                                      day: "numeric", month: "long", year: "numeric",
                                      hour: "2-digit", minute: "2-digit",
                                    })
                                  : "—"}
                              </span>
                            </p>
                            <p className="flex items-center gap-[8px]">
                              <Icon name="agora-line-calendar" className="w-[16px] h-[16px]" />
                              <span>
                                <strong>Terminado em:</strong>{" "}
                                {previewJob.ended
                                  ? new Date(previewJob.ended).toLocaleString("pt-PT", {
                                      day: "numeric", month: "long", year: "numeric",
                                      hour: "2-digit", minute: "2-digit",
                                    })
                                  : "—"}
                              </span>
                            </p>
                            <p className="flex items-center gap-[8px]">
                              <strong>Estado:</strong>
                              <Pill
                                variant={
                                  previewJob.status === "done"
                                    ? "success"
                                    : previewJob.status === "failed" || previewJob.status === "done-errors"
                                      ? "danger"
                                      : "neutral"
                                }
                              >
                                {previewJob.status === "done"
                                  ? "Concluído"
                                  : previewJob.status === "failed"
                                    ? "Erro"
                                    : previewJob.status === "done-errors"
                                      ? "Concluído com erros"
                                      : "Em processamento"}
                              </Pill>
                            </p>
                            <p className="flex items-center gap-[12px]">
                              <strong>Elementos:</strong>
                              <span className="flex items-center gap-[4px]">
                                <Icon name="agora-line-check" className="w-[16px] h-[16px]" />
                                {previewJob.items.filter((i) => i.status === "done").length}
                              </span>
                              <span className="flex items-center gap-[4px]">
                                <Icon name="agora-line-alert-triangle" className="w-[16px] h-[16px]" />
                                {previewJob.items.filter((i) => i.status === "failed").length}
                              </span>
                              <span className="flex items-center gap-[4px]">
                                <Icon name="agora-line-info-mark" className="w-[16px] h-[16px]" />
                                {previewJob.items.filter((i) => i.status === "skipped").length}
                              </span>
                              ({previewJob.items.length} no total)
                            </p>
                          </div>

                          {previewJob.errors.length > 0 && (
                            <div className="flex flex-col gap-[8px]">
                              <p className="text-sm font-semibold text-neutral-900">Erros</p>
                              {previewJob.errors.map((error, i) => (
                                <StatusCard
                                  key={i}
                                  type="danger"
                                  description={<><strong>ERRO</strong> {error.message}</>}
                                />
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </form>

                {/* Danger zone */}
                <div className="dataset-edit-danger-actions">
                  <StatusCard
                    type="danger"
                    description={
                      <>
                        <strong>Atenção esta ação é irreversível.</strong>
                        <br />
                        <Button
                          appearance="link"
                          variant="primary"
                          hasIcon
                          trailingIcon="agora-line-arrow-right-circle"
                          trailingIconHover="agora-solid-arrow-right-circle"
                        >
                          Eliminar o harvester
                        </Button>
                      </>
                    }
                  />
                </div>
              </div>

              {/* Auxiliar sidebar */}
              <aside className="admin-page__auxiliar">
                <div className="admin-page__auxiliar-inner">
                  <div className="admin-page__auxiliar-header">
                    <Icon name="agora-line-question-mark" className="w-[24px] h-[24px]" />
                    <h2 className="admin-page__auxiliar-title">Auxiliar</h2>
                  </div>
                  <AuxiliarList items={auxiliarItems} />
                </div>
              </aside>
            </div>
          </TabBody>
        </Tab>
      </Tabs>
    </div>
  );
}
