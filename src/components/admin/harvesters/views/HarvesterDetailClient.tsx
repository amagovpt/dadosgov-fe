"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import {
  ApproveHarvesterPopupContent,
  RejectHarvesterPopupContent,
} from "@/components/admin/harvesters/form-ui/HarvesterValidationPopups";
import { useAuth } from "@/context/AuthContext";
import type { HarvestPreviewJob } from "@/service/types/harvester";
import AdminLayout from "@/components/Layout/AdminLayout";
import { HarvesterJobsTable } from "@/components/admin/harvesters/jobs/HarvesterJobsTable";
import { HarvesterConfigForm } from "@/components/admin/harvesters/form-sections/HarvesterConfigForm";
import { useHarvesterDetailActions } from "@/components/admin/harvesters/hooks/useHarvesterDetailActions";
import { useHarvesterDetailData } from "@/components/admin/harvesters/hooks/useHarvesterDetailData";
import { can } from "@/utils/permissions";
import { useFormErrors } from "@/hooks/forms/useFormErrors";
import { useTemporaryMessage } from "@/hooks/forms/useTemporaryMessage";
import { type HarvesterFormField } from "@/components/admin/harvesters/form-state/harvesterFormModel";

interface HarvesterDetailClientProps {
  slug: string;
  // When set, the harvester is viewed inside an organization's back-office
  // (route /admin/org/{orgId}/harvesters/{id}). This scopes the breadcrumb to
  // the organization and restricts the "Configuração" tab so an org-admin may
  // only edit the basic fields (name, description, filters) — the advanced
  // fields (URL, implementation type, schedule, toggles) stay editable to
  // portal administrators only.
  orgId?: string;
}

function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copiado!" : "Copiar URL"}
      className="flex items-center text-neutral-500 hover:text-primary-600 transition-colors"
    >
      <Icon name={copied ? "agora-solid-copy" : "agora-line-copy"} className="w-16 h-16" />
    </button>
  );
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

export default function HarvesterDetailClient({ slug, orgId }: HarvesterDetailClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isConfigTab = searchParams.get("tab") === "config";
  const { isAdmin } = useAuth();
  const { show, hide } = usePopupContext();
  const {
    backends,
    isLoading,
    jobs,
    jobsPage,
    jobsPageSize,
    jobsTotal,
    setJobsPage,
    setJobsPageSize,
    setSource,
    source,
  } = useHarvesterDetailData({ slug });

  // Config form state
  const [harvesterName, setHarvesterName] = useState("");
  const [harvesterDescription, setHarvesterDescription] = useState("");
  const [harvesterUrl, setHarvesterUrl] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [isAutoArchive, setIsAutoArchive] = useState(true);
  const [filters, setFilters] = useState<{ type: string; value: string; mode: string }[]>([]);
  const [harvesterSchedule, setHarvesterSchedule] = useState("");
  const [loadedSchedule, setLoadedSchedule] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const {
    message: saveSuccess,
    setMessage: setSaveSuccess,
    setTemporaryMessage: showSaveSuccess,
  } = useTemporaryMessage<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewJob, setPreviewJob] = useState<HarvestPreviewJob | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [selectedBackend, setSelectedBackend] = useState("");
  const { errors: formErrors, setErrors, clearError, focusFirstError } =
    useFormErrors<HarvesterFormField>();

  useEffect(() => {
    if (!source) return;
    const existingFilters =
      (source.config?.filters as { key?: string; value?: string; type?: string }[] | undefined) || [];

    const frameId = requestAnimationFrame(() => {
      setHarvesterName(source.name);
      setHarvesterDescription(source.description || "");
      setHarvesterUrl(source.url);
      setIsEnabled(source.active);
      setIsAutoArchive(source.autoarchive);
      setHarvesterSchedule(source.schedule || "");
      setLoadedSchedule(source.schedule || "");
      setSelectedBackend(source.backend);
      setFilters(
        existingFilters.map((filter) => ({
          type: filter.key || "",
          value: String(filter.value || ""),
          mode: filter.type || "include",
        })),
      );
    });

    return () => cancelAnimationFrame(frameId);
  }, [source]);

  const {
    activeBackendFilters,
    addFilter,
    handleApproveSource,
    handleDeleteHarvester,
    handlePreviewHarvester,
    handleRejectSource,
    handleSaveHarvester,
    removeFilter,
    updateFilter,
  } = useHarvesterDetailActions({
    source,
    backends,
    selectedBackend,
    harvesterName,
    harvesterDescription,
    harvesterUrl,
    isEnabled,
    isAutoArchive,
    filters,
    harvesterSchedule,
    setSource,
    setFilters,
    setIsSaving,
    setSaveSuccess,
    setSaveError,
    showSaveSuccess,
    setErrors,
    focusFirstError,
    setIsPreviewing,
    setPreviewJob,
    setPreviewError,
    hide,
    push: router.push,
  });

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

  // In the organization context an org-admin may edit only the basic fields; the
  // advanced fields (URL, implementation type, schedule, toggles) are reserved
  // for portal administrators. In the system context, whoever can edit can edit
  // everything.
  const canEditSource = can(source, "edit");
  const canEditAdvanced = orgId ? isAdmin : canEditSource;

  const breadcrumbItems = orgId
    ? [
        { label: "Administração", url: "/admin" },
        { label: "Harvesters", url: `/admin/org/${orgId}/harvesters` },
        { label: source.name, url: "#" },
      ]
    : [
        { label: "Sistema", url: "/admin/system/harvesters" },
        { label: source.name, url: "#" },
      ];

  return (
    <AdminLayout breadcrumbItems={breadcrumbItems}
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
          <Icon name="agora-line-buildings" className="w-16 h-16" />
          <span>
            <strong>Produtor:</strong> {source.organization?.name || "—"}
          </span>
        </div>
        <div className="flex items-center gap-8">
          <Icon name="agora-line-globe" className="w-16 h-16" />
          <span>
            <strong>URL:</strong>{" "}
            <code className="text-xs" title={source.url}>{source.url.length > 100 ? `${source.url.slice(0, 100)}...` : source.url}</code>
          </span>
          <CopyUrlButton url={source.url} />
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
      <Tabs
        onTabActivation={(index: number) => {
          // Keep the URL in sync with the active tab so that parent re-renders
          // (e.g. typing in the Planeamento/schedule field) don't snap the active
          // tab back to whatever the URL-derived `active` prop says. Index 1 is
          // the "Configuração" tab; index 0 is "Trabalhos".
          const params = new URLSearchParams(searchParams.toString());
          if (index === 1) {
            params.set("tab", "config");
          } else {
            params.delete("tab");
          }
          const query = params.toString();
          const nextUrl = query ? `${pathname}?${query}` : pathname;
          if (nextUrl !== `${pathname}${window.location.search}`) {
            router.replace(nextUrl, { scroll: false });
          }
        }}
      >
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
              onSave={handleSaveHarvester}
              isPreviewing={isPreviewing}
              previewJob={previewJob}
              previewError={previewError}
              onPreview={handlePreviewHarvester}
              onDelete={() => show(
                <DeleteHarvesterPopupContent onClose={hide} onConfirm={handleDeleteHarvester} />,
                { title: "Eliminar o harvester", closeAriaLabel: "Fechar", dimensions: "m" }
              )}
              canEdit={canEditSource}
              canEditAdvanced={canEditAdvanced}
              canDelete={can(source, "delete")}
            />
          </TabBody>
        </Tab>
      </Tabs>
    </AdminLayout>
  );
}
