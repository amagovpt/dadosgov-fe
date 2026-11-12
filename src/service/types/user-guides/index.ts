import { FileDocument, Image } from "@/service/types/shared/common";

/** Card data of a guide, shown in the index and in "Guias relacionados". */
export interface UserGuideSummary {
  id: string;
  title: string;
  cardDescription: string;
}

export interface UserGuideTheme {
  id: string;
  title: string;
  description: string;
  guides: UserGuideSummary[];
}

/** `user-guides-page` singleton (index page). */
export interface UserGuidesPage {
  title: string;
  description: string;
  searchLabel: string;
  searchPlaceholder: string;
  heroImage: Image[];
  updatedAt: string;
  themes: UserGuideTheme[];
}

export interface UserGuideMedia {
  id: string;
  slug: string;
  fileName: string;
  mimeType: string;
}

/** `user-guide-task` component: one tab of the guide detail page. */
export interface UserGuideTask {
  id: string;
  title: string;
  audience: string;
  objective: string;
  steps: string[];
  example: string;
  videoUrl: string;
  video: UserGuideMedia[];
  mediaCaption: string;
  tip: string;
}

export interface UserGuideUsefulResource {
  label: string;
  url: string;
}

export type UserGuideStatus = "available" | "unavailable";

/** `user-guides` content (detail page). */
export interface UserGuide extends UserGuideSummary {
  description: string;
  requirementNote: string;
  status: UserGuideStatus;
  statusNotice: string;
  pdf: FileDocument[];
  tasks: UserGuideTask[];
  relatedGuides: UserGuideSummary[];
  usefulResources: UserGuideUsefulResource[];
  updatedAt: string;
}

export interface UserGuideMetadata {
  title: string;
  description: string;
}
