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

export type BoReusesPage = {
  metadata?: AdminMetadata;
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
