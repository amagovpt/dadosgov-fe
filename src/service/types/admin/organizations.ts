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
export type BoOrganizationsMetadataField =
  | "createMetadata"
  | "orgProfileRedirectMetadata"
  | "orgProfileMetadata"
  | "systemMetadata";

export type BoOrganizationsPage = {
  createMetadata?: AdminMetadata;
  orgProfileRedirectMetadata?: AdminMetadata;
  orgProfileMetadata?: AdminMetadata;
  systemMetadata?: AdminMetadata;
  createHero?: AdminHero;
  orgProfileHero?: AdminHero;
  search?: FoListPageSearch;
  systemNoResults?: FoListPageNoResults;
  orgProfileNoResults?: FoListPageNoResults;
  orgProfileDeleteCard?: AdminCard;
  steps?: AdminStep[];
  selectionIntroduction?: AdminHelpBlock;
  detailsIntroduction?: AdminHelpBlock;
  createdCard?: AdminCard;
  createAuxiliaryItems?: AdminAuxiliaryItem[];
};
