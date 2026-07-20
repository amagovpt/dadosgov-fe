import {
  AdminAuxiliaryItem,
  AdminCard,
  AdminHelpBlock,
  AdminHero,
  AdminMetadata,
} from "@/service/types/admin/common";

export type BoDatasetsMetadata = AdminMetadata;

export type BoDatasetsPage = {
  metadata?: AdminMetadata;
  hero?: AdminHero;
  publicationEntry?: AdminHelpBlock[];
  publicationIntroduction?: AdminHelpBlock;
  resourceIntroduction?: AdminHelpBlock;
  publishStepCard?: AdminCard;
  createAuxiliaryItems?: AdminAuxiliaryItem[];
  editAuxiliaryItems?: AdminAuxiliaryItem[];
  resourceAuxiliaryItems?: AdminAuxiliaryItem[];
};
