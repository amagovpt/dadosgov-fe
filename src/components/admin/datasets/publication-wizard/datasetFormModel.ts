import type { FormErrors } from "@/hooks/forms/useFormErrors";
import type { DatasetCreatePayload } from "@/service/types/dataset";
import type { DatasetWizardDraftContact } from "./datasetWizardTypes";

export type DatasetFormField =
  | "datasetProducer"
  | "datasetTitle"
  | "datasetTitleTooLong"
  | "datasetDescription"
  | "datasetFrequency"
  | "temporalCoverageInvalidFormat"
  | "temporalCoverage"
  | "contactDrafts";

interface DatasetValidationValues {
  producer: string;
  title: string;
  description: string;
  frequency: string;
  temporalStart: string;
  temporalEnd: string;
  selectedProducer: string;
  selectedContactPointIds: string[];
  draftContacts: DatasetWizardDraftContact[];
}

interface DatasetValidationMessages {
  producerRequired?: string;
  titleRequired?: string;
  titleTooLong?: string;
  descriptionRequired?: string;
  frequencyRequired?: string;
  invalidDate?: string;
  invalidRange?: string;
  contactDraftRequired?: string;
}

interface DatasetValidationResult {
  errors: FormErrors<DatasetFormField>;
  draftErrors: Record<number, Record<string, boolean>>;
}

interface DatasetPayloadValues {
  title: string;
  acronym: string;
  description: string;
  shortDescription: string;
  producer: string;
  license: string;
  frequency: string;
  keywords: string;
  contactPointIds: string[];
  temporalStart: string;
  temporalEnd: string;
}

export function parseDatasetDateToTime(value: string): number | null {
  const raw = value.trim();
  if (!raw) return null;

  const ptMatch = raw.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (ptMatch) {
    const day = Number(ptMatch[1]);
    const month = Number(ptMatch[2]);
    const year = Number(ptMatch[3]);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
      ? date.getTime()
      : null;
  }

  const iso = new Date(raw);
  const isoTime = iso.getTime();
  return Number.isNaN(isoTime) ? null : isoTime;
}

export function toDatasetIsoDate(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;

  const ptMatch = raw.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (ptMatch) {
    return `${ptMatch[3]}-${ptMatch[2]}-${ptMatch[1]}T00:00:00.000Z`;
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T00:00:00.000Z`;
  }

  return null;
}

export function validateDatasetDetails(
  values: DatasetValidationValues,
  messages: DatasetValidationMessages = {},
): DatasetValidationResult {
  const errors: FormErrors<DatasetFormField> = {};
  const draftErrors: Record<number, Record<string, boolean>> = {};

  if (!values.producer) {
    errors.datasetProducer = messages.producerRequired || "Selecione o produtor.";
  }
  if (!values.title.trim()) {
    errors.datasetTitle = messages.titleRequired || "Indique o título do conjunto de dados.";
  } else if (values.title.trim().length > 350) {
    errors.datasetTitleTooLong =
      messages.titleTooLong || "O título não pode exceder 350 caracteres.";
  }
  if (!values.description.trim()) {
    errors.datasetDescription =
      messages.descriptionRequired || "Descreva o conjunto de dados.";
  }
  if (!values.frequency) {
    errors.datasetFrequency =
      messages.frequencyRequired || "Selecione a frequência de atualização.";
  }

  const startRaw = values.temporalStart.trim();
  const endRaw = values.temporalEnd.trim();
  const startTime = startRaw ? parseDatasetDateToTime(startRaw) : null;
  const endTime = endRaw ? parseDatasetDateToTime(endRaw) : null;

  if ((startRaw && startTime === null) || (endRaw && endTime === null)) {
    errors.temporalCoverageInvalidFormat = messages.invalidDate || "Indique datas válidas.";
  } else if (startTime !== null && endTime !== null && startTime > endTime) {
    errors.temporalCoverage =
      messages.invalidRange || "A data inicial não pode ser posterior à data final.";
  }

  if (values.selectedProducer && values.selectedProducer !== "user") {
    const hasSavedContact = values.selectedContactPointIds.length > 0;
    let hasValidDraft = false;

    values.draftContacts.forEach((draft) => {
      const currentErrors: Record<string, boolean> = {};
      if (!draft.name.trim()) currentErrors.name = true;
      if (!draft.email.trim() && !draft.link.trim()) {
        currentErrors.email = true;
        currentErrors.link = true;
      }

      if (Object.keys(currentErrors).length === 0) {
        hasValidDraft = true;
      } else {
        draftErrors[draft.id] = currentErrors;
      }
    });

    if (!hasSavedContact && !hasValidDraft) {
      errors.contactDrafts =
        messages.contactDraftRequired || "Adicione pelo menos um contacto válido.";
    }
  }

  return { errors, draftErrors };
}

export function buildDatasetCreatePayload(
  values: DatasetPayloadValues,
): DatasetCreatePayload {
  const description = values.description.trim();
  const shortDescription = values.shortDescription.trim();
  const start = toDatasetIsoDate(values.temporalStart);
  const end = toDatasetIsoDate(values.temporalEnd);
  const tags = values.keywords.split(",").filter(Boolean);

  const payload: DatasetCreatePayload = {
    title: values.title.trim(),
    description,
    frequency: values.frequency,
    private: true,
    description_short:
      shortDescription ||
      (description.length > 197 ? `${description.slice(0, 197)}...` : description),
    ...(values.acronym.trim() ? { acronym: values.acronym.trim() } : {}),
    ...(values.producer && values.producer !== "user"
      ? { organization: values.producer }
      : {}),
    ...(values.license ? { license: values.license } : {}),
    ...(tags.length > 0 ? { tags } : {}),
    ...(values.contactPointIds.length > 0
      ? { contact_points: values.contactPointIds }
      : {}),
  };

  // Preserve the existing API behaviour, which accepts a partial temporal
  // range even though the shared frontend type requires `start`.
  if (start || end) {
    payload.temporal_coverage = {
      ...(start ? { start } : {}),
      ...(end ? { end } : {}),
    } as DatasetCreatePayload["temporal_coverage"];
  }

  return payload;
}
