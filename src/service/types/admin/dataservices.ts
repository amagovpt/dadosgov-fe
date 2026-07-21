import {
  AdminAuxiliaryItem,
  AdminCard,
  AdminHelpBlock,
  AdminHero,
  AdminMetadata,
  AdminStep,
} from "@/service/types/admin/common";
import type { FoListPageNoResults, FoListPageSearch } from "@/service/types/shared";

export type BoDataservicesMetadata = AdminMetadata;
export type BoDataservicesMetadataField =
  | "createMetadata"
  | "listMetadata"
  | "myListMetadata"
  | "editMetadata"
  | "orgRedirectMetadata"
  | "orgMetadata"
  | "systemMetadata";

export type BoDataservicesPage = {
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
  datasetLinksInfo?: AdminHelpBlock;
  draftVisibilityCard?: AdminCard;
  createdCard?: AdminCard;
  archiveInfoCard?: AdminCard[];
  createAuxiliaryItems?: AdminAuxiliaryItem[];
  editAuxiliaryItems?: AdminAuxiliaryItem[];
};
