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
  messages?: Partial<Record<ReuseDetailsField, string>>;
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
  const messages = values.messages || {};

  if (!values.name.trim()) {
    errors.reuseName = messages.reuseName || "";
  }
  if (!values.url.trim()) {
    errors.reuseLink = messages.reuseLink || "";
  } else if (!normalizeReuseUrl(values.url)) {
    errors.reuseLink = messages.reuseLink || "";
  }
  if (!values.type) {
    errors.reuseType = messages.reuseType || "";
  }
  if (!values.topic) {
    errors.reuseTopic = messages.reuseTopic || "";
  }
  if (!values.description.trim()) {
    errors.reuseDescription = messages.reuseDescription || "";
  }

  return errors;
}

function normalizeKeywords(keywords: string | string[]): string[] {
  return (Array.isArray(keywords) ? keywords : keywords.split(",")).filter(Boolean);
}

export function buildReuseCreatePayload(values: BuildReusePayloadValues): ReuseCreatePayload {
  const url = normalizeReuseUrl(values.url);
  if (!url) throw new Error("Cannot build a reuse payload with an invalid URL.");

  const tags = normalizeKeywords(values.keywords);
  const producer = values.producer;
  const topic = values.topic;

  return {
    title: values.name.trim(),
    description: values.description.trim(),
    url,
    type: values.type,
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
    return [
      {
        url,
        title: title || undefined,
        description: description || undefined,
      },
    ];
  });
}

export function validateReuseDatasetSelection(
  localDatasetCount: number,
  remoteDatasets: RemoteDatasetEntry[],
  errorMessage?: string,
): string | null {
  return localDatasetCount > 0 && remoteDatasets.length > 0 ? errorMessage || "" : null;
}
