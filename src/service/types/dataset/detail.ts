import type { Dataset, Resource } from "./dataset";
import type { APIResponse } from "@/service/types/shared";

export type DatasetMetadata = Omit<Dataset, "resources" | "community_resources">;

export interface DatasetResourceLink {
  rel: string;
  href: string;
  type: "GET";
  total: number;
}

export interface DatasetDetail extends DatasetMetadata {
  resources: DatasetResourceLink;
  community_resources: DatasetResourceLink;
}

export interface DatasetV2 extends Omit<
  DatasetDetail,
  "license" | "license_title" | "license_url" | "frequency"
> {
  license: string | { id: string; title: string; url: string | null } | null;
  frequency: string | { id: string; label: string };
}

export const RESOURCE_SECTION_TYPES = [
  "main",
  "documentation",
  "api",
  "update",
  "code",
  "other",
] as const;
export type ResourceSectionType = (typeof RESOURCE_SECTION_TYPES)[number];
export const RESOURCE_PAGE_SIZE = 6;

export interface ResourceSectionPage {
  type: ResourceSectionType;
  result: APIResponse<Resource> | null;
}
