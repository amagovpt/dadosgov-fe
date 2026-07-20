import {
  AdminAuxiliaryItem,
  AdminCard,
  AdminHelpBlock,
  AdminHero,
  AdminMetadata,
  AdminStep,
} from "@/service/types/admin/common";

export type BoDatasetsMetadata = AdminMetadata;

export type BoDatasetsPage = {
  metadata?: AdminMetadata;
  hero?: AdminHero;
  steps?: AdminStep[];
  publicationEntry?: AdminHelpBlock[];
  publicationIntroduction?: AdminHelpBlock;
  resourceIntroduction?: AdminHelpBlock;
  publishStepCard?: AdminCard;
  createAuxiliaryItems?: AdminAuxiliaryItem[];
  editAuxiliaryItems?: AdminAuxiliaryItem[];
  resourceAuxiliaryItems?: AdminAuxiliaryItem[];
};
