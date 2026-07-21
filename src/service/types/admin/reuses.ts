import {
  AdminAuxiliaryItem,
  AdminCard,
  AdminHelpBlock,
  AdminHero,
  AdminMetadata,
  AdminStep,
} from "@/service/types/admin/common";
import type { FoListPageNoResults, FoListPageSearch } from "@/service/types/shared";

export type BoReusesMetadata = AdminMetadata;
export type BoReusesMetadataField =
  | "metadata"
  | "listMetadata"
  | "myListMetadata"
  | "editMetadata"
  | "myEditMetadata"
  | "orgRedirectMetadata"
  | "orgMetadata"
  | "orgEditMetadata"
  | "orgMemberEditMetadata"
  | "systemMetadata";

export type BoReusesPage = {
  metadata?: AdminMetadata;
  listMetadata?: AdminMetadata;
  myListMetadata?: AdminMetadata;
  editMetadata?: AdminMetadata;
  myEditMetadata?: AdminMetadata;
  orgRedirectMetadata?: AdminMetadata;
  orgMetadata?: AdminMetadata;
  orgEditMetadata?: AdminMetadata;
  orgMemberEditMetadata?: AdminMetadata;
  systemMetadata?: AdminMetadata;
  hero?: AdminHero;
  search?: FoListPageSearch;
  myNoResults?: FoListPageNoResults;
  orgNoResults?: FoListPageNoResults;
  systemNoResults?: FoListPageNoResults;
  steps?: AdminStep[];
  orgSteps?: AdminStep[];
  introduction?: AdminHelpBlock;
  datasetAssociationInfo?: AdminHelpBlock;
  datasetAssociationWarning?: AdminHelpBlock;
  createdCard?: AdminCard;
  createAuxiliaryItems?: AdminAuxiliaryItem[];
  editAuxiliaryItems?: AdminAuxiliaryItem[];
};
