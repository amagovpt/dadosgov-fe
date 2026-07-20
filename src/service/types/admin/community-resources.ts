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

export type BoCommunityResourcesPage = {
  metadata?: AdminMetadata;
  hero?: AdminHero;
  search?: FoListPageSearch;
  myNoResults?: FoListPageNoResults;
  orgNoResults?: FoListPageNoResults;
  systemNoResults?: FoListPageNoResults;
  steps?: AdminStep[];
  introduction?: AdminHelpBlock;
  producerHelper?: AdminHelpBlock;
  createdCard?: AdminCard;
  createAuxiliaryItems?: AdminAuxiliaryItem[];
  editAuxiliaryItems?: AdminAuxiliaryItem[];
};
