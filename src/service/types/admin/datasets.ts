import {
  AdminAuxiliaryItem,
  AdminCard,
  AdminHelpBlock,
  AdminHero,
  AdminMetadata,
  AdminStep,
} from "@/service/types/admin/common";
import type { FoListPageNoResults, FoListPageSearch } from "@/service/types/shared";

export type BoDatasetsMetadata = AdminMetadata;
export type BoDatasetsMetadataField =
  | "createMetadata"
  | "listMetadata"
  | "myListMetadata"
  | "editMetadata"
  | "myEditMetadata"
  | "orgListMetadata"
  | "orgEditMetadata"
  | "systemMetadata";

export type BoDatasetsPage = {
  createMetadata?: AdminMetadata;
  listMetadata?: AdminMetadata;
  myListMetadata?: AdminMetadata;
  editMetadata?: AdminMetadata;
  myEditMetadata?: AdminMetadata;
  orgListMetadata?: AdminMetadata;
  orgEditMetadata?: AdminMetadata;
  systemMetadata?: AdminMetadata;
  createHero?: AdminHero;
  search?: FoListPageSearch;
  myNoResults?: FoListPageNoResults;
  orgNoResults?: FoListPageNoResults;
  systemNoResults?: FoListPageNoResults;
  steps?: AdminStep[];
  publicationEntry?: AdminHelpBlock[];
  publicationIntroduction?: AdminHelpBlock;
  resourceIntroduction?: AdminHelpBlock;
  publishStepCard?: AdminCard;
  transferCard?: AdminCard;
  archiveCard?: AdminCard;
  unarchiveCard?: AdminCard;
  deleteCard?: AdminCard;
  visibilityCard?: AdminCard;
  createAuxiliaryItems?: AdminAuxiliaryItem[];
  editAuxiliaryItems?: AdminAuxiliaryItem[];
  resourceAuxiliaryItems?: AdminAuxiliaryItem[];
};
