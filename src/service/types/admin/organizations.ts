import {
  AdminAuxiliaryItem,
  AdminCard,
  AdminHelpBlock,
  AdminHero,
  AdminMetadata,
  AdminStep,
} from "@/service/types/admin/common";
import type { FoListPageNoResults, FoListPageSearch } from "@/service/types/shared";

export type BoOrganizationsMetadata = AdminMetadata;

export type BoOrganizationsPage = {
  metadata?: AdminMetadata;
  hero?: AdminHero;
  search?: FoListPageSearch;
  systemNoResults?: FoListPageNoResults;
  steps?: AdminStep[];
  selectionIntroduction?: AdminHelpBlock;
  detailsIntroduction?: AdminHelpBlock;
  createdCard?: AdminCard;
  createAuxiliaryItems?: AdminAuxiliaryItem[];
};
