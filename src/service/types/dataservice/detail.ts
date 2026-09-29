import type { Dataset } from "@/service/types/dataset";
import type { Discussion } from "@/service/types/discussion";

// Only send the fields used by the related-dataset cards to the browser.
export type RelatedDataset = Pick<Dataset, "id" | "slug" | "title" | "description" | "last_modified" | "metrics"> & {
  organization: { name: string; logo?: string } | null;
  owner: { slug: string; first_name: string; last_name: string; avatar_thumbnail?: string | null } | null;
  quality?: { score: number };
};

// A failed section is distinct from a successful, empty dataset list.
export type RelatedDatasetsResult = { data: RelatedDataset[]; total: number } | null;

export type DataserviceDiscussionsResult = { data: Discussion[]; total: number } | null;
export type DataserviceActionsState = {
  userId: string | null;
  favorite: boolean | null;
  canEdit: boolean;
};

export type FavoriteActionState = { favorite: boolean; failed: boolean };
