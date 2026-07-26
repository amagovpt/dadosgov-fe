import { AdminCard, AdminHero, AdminMetadata } from "@/service/types/admin/common";
import type { FoListPageNoResults, FoListPageSearch } from "@/service/types/shared";

export type BoUsersMetadata = AdminMetadata;
export type BoUsersMetadataField = "systemMetadata" | "profileMetadata";

export type BoUsersPage = {
  systemMetadata?: AdminMetadata;
  profileMetadata?: AdminMetadata;
  systemHero?: AdminHero;
  profileHero?: AdminHero;
  search?: FoListPageSearch;
  systemNoResults?: FoListPageNoResults;
  followingsNoResults?: FoListPageNoResults;
  subscriptionsNoResults?: FoListPageNoResults;
  activitiesNoResults?: FoListPageNoResults;
  activateCard?: AdminCard;
  deactivateCard?: AdminCard;
  deleteCard?: AdminCard;
};
