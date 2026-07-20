import {
  AdminAuxiliaryItem,
  AdminCard,
  AdminHelpBlock,
  AdminHero,
  AdminMetadata,
} from "@/service/types/admin/common";

export type BoOrganizationsMetadata = AdminMetadata;

export type BoOrganizationsPage = {
  metadata?: AdminMetadata;
  hero?: AdminHero;
  selectionIntroduction?: AdminHelpBlock;
  detailsIntroduction?: AdminHelpBlock;
  createdCard?: AdminCard;
  createAuxiliaryItems?: AdminAuxiliaryItem[];
};
