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
export type BoHarvestersMetadataField =
  | "metadata"
  | "detailMetadata"
  | "jobDetailMetadata"
  | "orgRedirectMetadata"
  | "orgMetadata"
  | "orgDetailMetadata"
  | "systemMetadata";

export type BoHarvestersPage = {
  metadata?: AdminMetadata;
  detailMetadata?: AdminMetadata;
  jobDetailMetadata?: AdminMetadata;
  orgRedirectMetadata?: AdminMetadata;
  orgMetadata?: AdminMetadata;
  orgDetailMetadata?: AdminMetadata;
  systemMetadata?: AdminMetadata;
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
