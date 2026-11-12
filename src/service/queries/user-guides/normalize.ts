import type {
  UserGuide,
  UserGuideMedia,
  UserGuideSummary,
  UserGuideTask,
  UserGuideTheme,
  UserGuideUsefulResource,
  UserGuidesPage,
} from "@/service/types/user-guides";
import type { FileDocument, Image } from "@/service/types/shared/common";

/*
 * `flattenData` output is loosely shaped: empty CMS fields come back as `null`, and any object
 * with a single key is unwrapped (a step `{ text }` arrives as a plain string). These helpers
 * turn that output into the fully-populated types the components expect.
 */

type Raw = Record<string, unknown>;

const isRecord = (value: unknown): value is Raw =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const str = (value: unknown): string => (typeof value === "string" ? value : "");

const list = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  return value == null ? [] : [value];
};

const records = (value: unknown): Raw[] => list(value).filter(isRecord);

function toSummary(raw: Raw): UserGuideSummary {
  return { id: str(raw.id), title: str(raw.title), cardDescription: str(raw.cardDescription) };
}

function toSummaries(value: unknown): UserGuideSummary[] {
  return records(value)
    .map(toSummary)
    .filter((guide) => guide.id && guide.title);
}

function toStep(value: unknown): string {
  return isRecord(value) ? str(value.text) : str(value);
}

function toMedia(value: unknown): UserGuideMedia[] {
  return records(value)
    .map((raw) => ({
      id: str(raw.id),
      slug: str(raw.slug),
      fileName: str(raw.fileName),
      mimeType: str(raw.mimeType),
    }))
    .filter((media) => media.slug || media.id);
}

function toTask(raw: Raw): UserGuideTask {
  return {
    id: str(raw.id),
    title: str(raw.title),
    audience: str(raw.audience),
    objective: str(raw.objective),
    steps: list(raw.steps).map(toStep).filter(Boolean),
    example: str(raw.example),
    videoUrl: str(raw.videoUrl),
    video: toMedia(raw.video),
    mediaCaption: str(raw.mediaCaption),
    tip: str(raw.tip),
  };
}

function toUsefulResources(value: unknown): UserGuideUsefulResource[] {
  return records(value)
    .map((raw) => ({ label: str(raw.label), url: str(raw.url) }))
    .filter((resource) => resource.label && resource.url);
}

function toTheme(raw: Raw): UserGuideTheme {
  return {
    id: str(raw.id),
    title: str(raw.title),
    description: str(raw.description),
    guides: toSummaries(raw.guides),
  };
}

export function emptyUserGuidesPage(): UserGuidesPage {
  return {
    title: "",
    description: "",
    searchLabel: "",
    searchPlaceholder: "",
    heroImage: [],
    updatedAt: "",
    themes: [],
  };
}

export function normalizeUserGuidesPage(raw: unknown): UserGuidesPage {
  if (!isRecord(raw)) return emptyUserGuidesPage();
  return {
    title: str(raw.title),
    description: str(raw.description),
    searchLabel: str(raw.searchLabel),
    searchPlaceholder: str(raw.searchPlaceholder),
    heroImage: records(raw.heroImage) as unknown as Image[],
    updatedAt: str(raw.updatedAt),
    themes: records(raw.themes)
      .map(toTheme)
      .filter((theme) => theme.id && theme.title),
  };
}

/** Returns `null` when the CMS entry has no slug or title, so the page can 404. */
export function normalizeUserGuide(raw: unknown): UserGuide | null {
  if (!isRecord(raw)) return null;
  const summary = toSummary(raw);
  if (!summary.id || !summary.title) return null;

  return {
    ...summary,
    description: str(raw.description),
    requirementNote: str(raw.requirementNote),
    status: raw.status === "unavailable" ? "unavailable" : "available",
    statusNotice: str(raw.statusNotice),
    pdf: records(raw.pdf) as unknown as FileDocument[],
    tasks: records(raw.tasks)
      .map(toTask)
      .filter((task) => task.id && task.title),
    relatedGuides: toSummaries(raw.relatedGuides).filter((guide) => guide.id !== summary.id),
    usefulResources: toUsefulResources(raw.usefulResources),
    updatedAt: str(raw.updatedAt),
  };
}
