import type { HarvestSource } from "@/service/types/harvester";

type StatusVariant = "informative" | "success" | "danger" | "warning";

interface StatusInfo {
  label: string;
  variant: StatusVariant;
}

export const VALIDATION_STATUS: Record<string, StatusInfo> = {
  pending: { label: "Em espera de validação", variant: "warning" },
  accepted: { label: "Validado", variant: "success" },
  refused: { label: "Recusado", variant: "danger" },
};

export const JOB_STATUS: Record<string, StatusInfo> = {
  pending: { label: "Pendente", variant: "informative" },
  initializing: { label: "A inicializar", variant: "informative" },
  initialized: { label: "Inicializado", variant: "informative" },
  processing: { label: "Em processamento", variant: "informative" },
  done: { label: "Terminado", variant: "success" },
  "done-errors": { label: "Terminado com erros", variant: "warning" },
  failed: { label: "Falhado", variant: "danger" },
  started: { label: "Em execução", variant: "warning" },
};

export function getHarvesterStatus(source: HarvestSource): StatusInfo {
  if (source.validation?.state && source.validation.state !== "accepted") {
    return VALIDATION_STATUS[source.validation.state] ?? VALIDATION_STATUS.pending;
  }
  if (source.last_job?.status) {
    return (
      JOB_STATUS[source.last_job.status] ?? {
        label: "Sem tarefa de momento",
        variant: "informative" as const,
      }
    );
  }
  return { label: "Sem execução", variant: "informative" };
}
