import {
  AdminAuxiliaryItem,
  AdminCard,
  AdminHelpBlock,
  AdminHero,
} from "@/service/types/admin/common";

export type BoDatasetsMetadata = AdminHero;

export type BoDatasetsPage = {
  hero?: AdminHero;
  publicationEntry?: AdminHelpBlock[];
  publicationIntroduction?: AdminHelpBlock;
  resourceIntroduction?: AdminHelpBlock;
  publishStepCard?: AdminCard;
  createAuxiliaryItems?: AdminAuxiliaryItem[];
  editAuxiliaryItems?: AdminAuxiliaryItem[];
  resourceAuxiliaryItems?: AdminAuxiliaryItem[];
};
