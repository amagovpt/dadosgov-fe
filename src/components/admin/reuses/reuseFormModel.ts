import type { FormErrors } from "@/hooks/forms/useFormErrors";
import type { RemoteDatasetEntry } from "@/lib/reuse-remote-datasets";
import type { ReuseCreatePayload } from "@/service/types/reuse";

export type ReuseDetailsField =
  | "reuseName"
  | "reuseLink"
  | "reuseType"
  | "reuseTopic"
  | "reuseDescription";

export type ReuseFormField =
  | ReuseDetailsField
  | "reuseDescriptionLength"
  | "reuseCoverImage";

export interface ReuseDetailsValues {
  name: string;
  url: string;
  type: string;
  topic: string;
  description: string;
}

interface BuildReusePayloadValues extends ReuseDetailsValues {
  producer: string;
  keywords: string | string[];
}

export function normalizeReuseUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(normalized);
    return url.hostname ? normalized : null;
  } catch {
    return null;
  }
}

export function validateReuseDetails(
  values: ReuseDetailsValues,
): FormErrors<ReuseDetailsField> {
  const errors: FormErrors<ReuseDetailsField> = {};

  if (!values.name.trim()) errors.reuseName = "Indique o nome da reutilização.";
  if (!values.url.trim()) {
    errors.reuseLink = "Indique o URL da reutilização.";
  } else if (!normalizeReuseUrl(values.url)) {
    errors.reuseLink = "Indique um URL válido.";
  }
  if (!values.type) errors.reuseType = "Selecione o tipo de reutilização.";
  if (!values.topic) errors.reuseTopic = "Selecione o tema da reutilização.";
  if (!values.description.trim()) {
    errors.reuseDescription = "Descreva a reutilização.";
  }

  return errors;
}

function normalizeKeywords(keywords: string | string[]): string[] {
  const values = Array.isArray(keywords) ? keywords : keywords.split(",");
  const seen = new Set<string>();

  return values.flatMap((keyword) => {
    const trimmed = keyword.trim();
    const key = trimmed.toLocaleLowerCase();
    if (!trimmed || seen.has(key)) return [];
    seen.add(key);
    return [trimmed];
  });
}

export function buildReuseCreatePayload(values: BuildReusePayloadValues): ReuseCreatePayload {
  const url = normalizeReuseUrl(values.url);
  if (!url) throw new Error("Cannot build a reuse payload with an invalid URL.");

  const tags = normalizeKeywords(values.keywords);
  const producer = values.producer.trim();
  const topic = values.topic.trim();

  return {
    title: values.name.trim(),
    description: values.description.trim(),
    url,
    type: values.type.trim(),
    private: true,
    ...(topic ? { topic } : {}),
    ...(tags.length > 0 ? { tags } : {}),
    ...(producer && producer !== "user" ? { organization: producer } : {}),
  };
}

export function buildRemoteDatasetEntries(
  entries: RemoteDatasetEntry[],
): RemoteDatasetEntry[] {
  const seenUrls = new Set<string>();

  return entries.flatMap((entry) => {
    const url = entry.url.trim();
    if (!url || seenUrls.has(url)) return [];
    seenUrls.add(url);

    const title = entry.title?.trim();
    const description = entry.description?.trim();
    return [{
      url,
      title: title || undefined,
      description: description || undefined,
    }];
  });
}

export function validateReuseDatasetSelection(
  localDatasetCount: number,
  remoteDatasets: RemoteDatasetEntry[],
): string | null {
  return localDatasetCount > 0 && remoteDatasets.length > 0
    ? "Pode associar conjuntos de dados deste portal ou indicar links para conjuntos de dados externos, mas não as duas opções na mesma reutilização."
    : null;
}
