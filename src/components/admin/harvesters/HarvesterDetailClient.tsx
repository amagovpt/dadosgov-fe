"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  Icon,
  Pill,
  StatusCard,
  Tabs,
  Tab,
  TabHeader,
  TabBody,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import { fetchHarvester, fetchHarvestJobs, fetchHarvestBackends, updateHarvester, scheduleHarvester, unscheduleHarvester, previewHarvestSource, deleteHarvester, rejectHarvestSource, validateHarvestSource } from "@/service/api/harvesters";
import {
  ApproveHarvesterPopupContent,
  RejectHarvesterPopupContent,
} from "@/components/admin/harvesters/HarvesterValidationPopups";
import { useAuth } from "@/context/AuthContext";
import type { HarvestBackend, HarvestPreviewJob, HarvestSource, HarvestJob } from "@/service/types/harvester";
import AdminLayout from "@/components/Layout/AdminLayout";
import { HarvesterJobsTable } from "@/components/admin/harvesters/HarvesterJobsTable";
import { HarvesterConfigForm } from "@/components/admin/harvesters/HarvesterConfigForm";

interface HarvesterDetailClientProps {
  slug: string;
}

const VALIDATION_LABELS: Record<string, { label: string; variant: "warning" | "success" | "danger" }> = {
  pending: { label: "VALIDAÇÃO PENDENTE", variant: "warning" },
  accepted: { label: "VALIDADO", variant: "success" },
  refused: { label: "RECUSADO", variant: "danger" },
};

function DeleteHarvesterPopupContent({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col gap-16">
      <p>Esta ação é irreversível. Tem a certeza que quer eliminar este harvester?</p>
      <div className="flex justify-end gap-16 pt-16">
        <Button appearance="outline" variant="neutral" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          hasIcon
          leadingIcon="agora-line-trash"
          leadingIconHover="agora-solid-trash"
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
}

export default function HarvesterDetailClient({ slug }: HarvesterDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isConfigTab = searchParams.get("tab") === "config";
  const { user, isAdmin } = useAuth();
  const { show, hide } = usePopupContext();
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
  const [harvesterSchedule, setHarvesterSchedule] = useState("");
  // Seeded once from the API; passed as `defaultValue` to the IsolatedInput,
  // which then owns the field state internally to avoid caret-jump on every
  // parent re-render.
  const [loadedSchedule, setLoadedSchedule] = useState("");
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
          setHarvesterSchedule(data.schedule || "");
          setLoadedSchedule(data.schedule || "");
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
  }, [jobsPage, jobsPageSize, slug]);

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
      const newSchedule = harvesterSchedule.trim();
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
        schedule: harvesterSchedule.trim() || undefined,
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

  const handleDeleteHarvester = async () => {
    if (!source) return;
    try {
      await deleteHarvester(source.id);
      hide();
      router.push("/pages/admin/system/harvesters");
    } catch (error) {
      console.error("Error deleting harvester:", error);
      hide();
    }
  };

  const handleApproveSource = async (comment: string) => {
    if (!source) return;
    const updated = await validateHarvestSource(source.id, comment || undefined);
    setSource((prev) =>
      prev ? { ...prev, validation: updated.validation ?? prev.validation } : prev
    );
    hide();
  };

  const handleRejectSource = async (comment: string) => {
    if (!source) return;
    const updated = await rejectHarvestSource(source.id, comment);
    setSource((prev) =>
      prev ? { ...prev, validation: updated.validation ?? prev.validation } : prev
    );
    hide();
  };

  const openApproveSourcePopup = () => {
    if (!source) return;
    show(
      <ApproveHarvesterPopupContent
        harvester={source}
        onClose={hide}
        onConfirm={handleApproveSource}
      />,
      { title: "Aprovar harvester", closeAriaLabel: "Fechar", dimensions: "m" }
    );
  };

  const openRejectSourcePopup = () => {
    if (!source) return;
    show(
      <RejectHarvesterPopupContent
        harvester={source}
        onClose={hide}
        onConfirm={handleRejectSource}
      />,
      { title: "Rejeitar harvester", closeAriaLabel: "Fechar", dimensions: "m" }
    );
  };

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
        <StatusCard variant="danger" showIcon description="Harvester não encontrado." />
      </div>
    );
  }

  const validationState = source.validation?.state || "pending";
  const validationInfo = VALIDATION_LABELS[validationState] || VALIDATION_LABELS.pending;

  return (
    <AdminLayout breadcrumbItems={[
      { label: "Sistema", url: "/pages/admin/system/harvesters" },
      { label: source.name, url: "#" },
    ]}
      title={source.name}
    >
      {/* Metadata info */}
      <div className="flex flex-col gap-8 text-sm text-neutral-800 mb-24">
        <div className="flex items-center gap-8">
          <Icon name="agora-line-info-mark" className="w-16 h-16" />
          <span>
            <strong>Implementação:</strong> {source.backend}
          </span>
        </div>
        <div className="flex items-center gap-8">
          <Icon name="agora-line-globe" className="w-16 h-16" />
          <span>
            <strong>URL:</strong>{" "}
            <code className="text-xs" title={source.url}>{source.url.length > 100 ? `${source.url.slice(0, 100)}...` : source.url}</code>
          </span>
        </div>
        <div className="flex items-center gap-8">
          <Icon name="agora-line-calendar" className="w-16 h-16" />
          <span>
            <strong>Planeamento:</strong> {source.schedule || "Não aplicável"}
          </span>
        </div>
        <div className="flex items-center gap-8">
          <Icon name="agora-line-check-circle" className="w-16 h-16" />
          <span>
            <strong>Estado :</strong>{" "}
            <Pill variant={validationInfo.variant}>{validationInfo.label}</Pill>
          </span>
        </div>
      </div>

      {/* Validation pending banner */}
      {validationState === "pending" && (
        <div className="bg-neutral-100 rounded p-24 flex flex-col gap-8 mb-24" style={{ maxWidth: "calc(100% - var(--admin-auxiliar-width) - var(--admin-auxiliar-gap))" }}>
          {isAdmin ? (
            <>
              <p className="text-sm font-bold text-neutral-900">
                Este harvester aguarda validação da equipa de administração.
              </p>
              <p className="text-sm text-neutral-700">
                Aprove para o agendar e iniciar a primeira execução, ou rejeite indicando o motivo. O proprietário será notificado.
              </p>
              <div className="flex items-center gap-16 pt-8">
                <Button
                  variant="primary"
                  onClick={openApproveSourcePopup}
                  hasIcon
                  leadingIcon="agora-line-check-circle"
                  leadingIconHover="agora-solid-check-circle"
                >
                  Aprovar harvester
                </Button>
                <Button
                  appearance="outline"
                  variant="danger"
                  onClick={openRejectSourcePopup}
                  hasIcon
                  leadingIcon="agora-line-x-circle"
                  leadingIconHover="agora-solid-x-circle"
                >
                  Rejeitar harvester
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-neutral-900">
                O seu harvester foi criado e está a aguardar validação da equipa de administração do portal.
              </p>
              <p className="text-sm text-neutral-700">
                A equipa de administração foi notificada automaticamente. Será
                notificado da aprovação ou rejeição quando esta for decidida.
              </p>
            </>
          )}
        </div>
      )}


      {/* Tabs */}
      <Tabs>
        <Tab active={!isConfigTab}>
          <TabHeader>Trabalhos</TabHeader>
          <TabBody>
            <HarvesterJobsTable
              jobs={jobs}
              jobsTotal={jobsTotal}
              jobsPage={jobsPage}
              jobsPageSize={jobsPageSize}
              setJobsPage={setJobsPage}
              setJobsPageSize={setJobsPageSize}
              slug={slug}
            />
          </TabBody>
        </Tab>
        <Tab active={isConfigTab}>
          <TabHeader>Configuração</TabHeader>
          <TabBody>
            <HarvesterConfigForm
              harvesterName={harvesterName}
              setHarvesterName={setHarvesterName}
              harvesterDescription={harvesterDescription}
              setHarvesterDescription={setHarvesterDescription}
              harvesterUrl={harvesterUrl}
              setHarvesterUrl={setHarvesterUrl}
              isEnabled={isEnabled}
              setIsEnabled={setIsEnabled}
              isAutoArchive={isAutoArchive}
              setIsAutoArchive={setIsAutoArchive}
              filters={filters}
              loadedSchedule={loadedSchedule}
              selectedBackend={selectedBackend}
              setSelectedBackend={setSelectedBackend}
              backends={backends}
              activeBackendFilters={activeBackendFilters}
              formErrors={formErrors}
              clearError={clearError}
              addFilter={addFilter}
              removeFilter={removeFilter}
              updateFilter={updateFilter}
              setHarvesterSchedule={setHarvesterSchedule}
              isSaving={isSaving}
              saveSuccess={saveSuccess}
              saveError={saveError}
              onSave={handleSave}
              isPreviewing={isPreviewing}
              previewJob={previewJob}
              previewError={previewError}
              onPreview={handlePreview}
              onDelete={() => show(
                <DeleteHarvesterPopupContent onClose={hide} onConfirm={handleDeleteHarvester} />,
                { title: "Eliminar o harvester", closeAriaLabel: "Fechar", dimensions: "m" }
              )}
            />
          </TabBody>
        </Tab>
      </Tabs>
    </AdminLayout>
  );
}