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

export type BoDatasetsPage = {
  metadata?: AdminMetadata;
  hero?: AdminHero;
  search?: FoListPageSearch;
  myNoResults?: FoListPageNoResults;
  orgNoResults?: FoListPageNoResults;
  systemNoResults?: FoListPageNoResults;
  steps?: AdminStep[];
  publicationEntry?: AdminHelpBlock[];
  publicationIntroduction?: AdminHelpBlock;
  resourceIntroduction?: AdminHelpBlock;
  publishStepCard?: AdminCard;
  createAuxiliaryItems?: AdminAuxiliaryItem[];
  editAuxiliaryItems?: AdminAuxiliaryItem[];
  resourceAuxiliaryItems?: AdminAuxiliaryItem[];
};
