import type { HarvestSource } from "@/service/types/harvester";

type StatusVariant = "informative" | "success" | "danger" | "warning";

interface StatusInfo {
  label: string;
  variant: StatusVariant;
}

export interface HarvesterStatusLabels {
  pendingValidation: string;
  accepted: string;
  refused: string;
  pending: string;
  initializing: string;
  initialized: string;
  processing: string;
  done: string;
  doneErrors: string;
  failed: string;
  started: string;
  noCurrentJob: string;
  noExecution: string;
}

const DEFAULT_LABELS: HarvesterStatusLabels = {
  pendingValidation: "Em espera de validação",
  accepted: "Validado",
  refused: "Recusado",
  pending: "Pendente",
  initializing: "A inicializar",
  initialized: "Inicializado",
  processing: "Em processamento",
  done: "Terminado",
  doneErrors: "Terminado com erros",
  failed: "Falhado",
  started: "Em execução",
  noCurrentJob: "Sem tarefa de momento",
  noExecution: "Sem execução",
};

export function createValidationStatus(labels: HarvesterStatusLabels = DEFAULT_LABELS): Record<string, StatusInfo> {
  return {
    pending: { label: labels.pendingValidation, variant: "warning" },
    accepted: { label: labels.accepted, variant: "success" },
    refused: { label: labels.refused, variant: "danger" },
  };
}

export function createJobStatus(labels: HarvesterStatusLabels = DEFAULT_LABELS): Record<string, StatusInfo> {
  return {
    pending: { label: labels.pending, variant: "informative" },
    initializing: { label: labels.initializing, variant: "informative" },
    initialized: { label: labels.initialized, variant: "informative" },
    processing: { label: labels.processing, variant: "informative" },
    done: { label: labels.done, variant: "success" },
    "done-errors": { label: labels.doneErrors, variant: "warning" },
    failed: { label: labels.failed, variant: "danger" },
    started: { label: labels.started, variant: "warning" },
  };
}

export const VALIDATION_STATUS: Record<string, StatusInfo> = {
  pending: { label: DEFAULT_LABELS.pendingValidation, variant: "warning" },
  accepted: { label: DEFAULT_LABELS.accepted, variant: "success" },
  refused: { label: DEFAULT_LABELS.refused, variant: "danger" },
};

export const JOB_STATUS: Record<string, StatusInfo> = {
  pending: { label: DEFAULT_LABELS.pending, variant: "informative" },
  initializing: { label: DEFAULT_LABELS.initializing, variant: "informative" },
  initialized: { label: DEFAULT_LABELS.initialized, variant: "informative" },
  processing: { label: DEFAULT_LABELS.processing, variant: "informative" },
  done: { label: DEFAULT_LABELS.done, variant: "success" },
  "done-errors": { label: DEFAULT_LABELS.doneErrors, variant: "warning" },
  failed: { label: DEFAULT_LABELS.failed, variant: "danger" },
  started: { label: DEFAULT_LABELS.started, variant: "warning" },
};

export function getHarvesterStatus(
  source: HarvestSource,
  labels: HarvesterStatusLabels = DEFAULT_LABELS,
): StatusInfo {
  const validationStatus = createValidationStatus(labels);
  const jobStatus = createJobStatus(labels);

  if (source.validation?.state && source.validation.state !== "accepted") {
    return validationStatus[source.validation.state] ?? validationStatus.pending;
  }
  if (source.last_job?.status) {
    return (
      jobStatus[source.last_job.status] ?? {
        label: labels.noCurrentJob,
        variant: "informative" as const,
      }
    );
  }
  return { label: labels.noExecution, variant: "informative" };
}
