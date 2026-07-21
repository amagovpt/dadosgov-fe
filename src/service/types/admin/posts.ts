import { AdminCard, AdminHero, AdminMetadata, AdminStep } from "@/service/types/admin/common";
import type { FoListPageNoResults, FoListPageSearch } from "@/service/types/shared";

export type BoPostsMetadata = AdminMetadata;
export type BoPostsMetadataField = "systemMetadata" | "createMetadata" | "editMetadata";

export type BoPostsPage = {
  systemMetadata?: AdminMetadata;
  createMetadata?: AdminMetadata;
  editMetadata?: AdminMetadata;
  systemHero?: AdminHero;
  createHero?: AdminHero;
  search?: FoListPageSearch;
  systemNoResults?: FoListPageNoResults;
  steps?: AdminStep[];
  unpublishCard?: AdminCard;
  deleteCard?: AdminCard;
};
