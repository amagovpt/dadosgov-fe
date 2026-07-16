import {
  AdminAuxiliaryItem,
  AdminCard,
  AdminHelpBlock,
  AdminHero,
} from "@/service/types/admin/common";

export type BoOrganizationsMetadata = AdminHero;

export type BoOrganizationsPage = {
  hero?: AdminHero;
  selectionIntroduction?: AdminHelpBlock;
  detailsIntroduction?: AdminHelpBlock;
  createdCard?: AdminCard;
  createAuxiliaryItems?: AdminAuxiliaryItem[];
  editAuxiliaryItems?: AdminAuxiliaryItem[];
};
