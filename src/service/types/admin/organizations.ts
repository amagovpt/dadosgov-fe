import {
  AdminAuxiliaryItem,
  AdminCard,
  AdminHelpBlock,
  AdminHero,
  AdminMetadata,
  AdminStep,
} from "@/service/types/admin/common";

export type BoOrganizationsMetadata = AdminMetadata;

export type BoOrganizationsPage = {
  metadata?: AdminMetadata;
  hero?: AdminHero;
  steps?: AdminStep[];
  selectionIntroduction?: AdminHelpBlock;
  detailsIntroduction?: AdminHelpBlock;
  createdCard?: AdminCard;
  createAuxiliaryItems?: AdminAuxiliaryItem[];
};
