import {
  AdminAuxiliaryItem,
  AdminCard,
  AdminHelpBlock,
  AdminHero,
  AdminMetadata,
  AdminStep,
} from "@/service/types/admin/common";
import type { FoListPageNoResults, FoListPageSearch } from "@/service/types/shared";

export type BoCommunityResourcesMetadata = AdminMetadata;
export type BoCommunityResourcesMetadataField =
  | "createMetadata"
  | "listMetadata"
  | "myListMetadata"
  | "editMetadata"
  | "orgRedirectMetadata"
  | "orgMetadata"
  | "systemMetadata";

export type BoCommunityResourcesPage = {
  createMetadata?: AdminMetadata;
  listMetadata?: AdminMetadata;
  myListMetadata?: AdminMetadata;
  editMetadata?: AdminMetadata;
  orgRedirectMetadata?: AdminMetadata;
  orgMetadata?: AdminMetadata;
  systemMetadata?: AdminMetadata;
  createHero?: AdminHero;
  search?: FoListPageSearch;
  myNoResults?: FoListPageNoResults;
  orgNoResults?: FoListPageNoResults;
  systemNoResults?: FoListPageNoResults;
  steps?: AdminStep[];
  introduction?: AdminHelpBlock;
  producerHelper?: AdminHelpBlock;
  createdCard?: AdminCard;
  deleteCard?: AdminCard;
  createAuxiliaryItems?: AdminAuxiliaryItem[];
  editAuxiliaryItems?: AdminAuxiliaryItem[];
};
