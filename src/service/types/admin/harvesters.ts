import {
  AdminAuxiliaryItem,
  AdminCard,
  AdminHelpBlock,
  AdminHero,
  AdminMetadata,
  AdminStep,
} from "@/service/types/admin/common";
import type { FoListPageNoResults, FoListPageSearch } from "@/service/types/shared";

export type BoHarvestersMetadata = AdminMetadata;

export type BoHarvestersPage = {
  metadata?: AdminMetadata;
  hero?: AdminHero;
  search?: FoListPageSearch;
  orgNoResults?: FoListPageNoResults;
  systemNoResults?: FoListPageNoResults;
  steps?: AdminStep[];
  introduction?: AdminHelpBlock;
  acceptedStatusInfo?: AdminHelpBlock;
  pendingAdminCard?: AdminCard;
  pendingOwnerCard?: AdminCard;
  createdPendingCard?: AdminCard;
  createAuxiliaryItems?: AdminAuxiliaryItem[];
  editAuxiliaryItems?: AdminAuxiliaryItem[];
};
