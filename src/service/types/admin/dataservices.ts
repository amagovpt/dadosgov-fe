import {
  AdminAuxiliaryItem,
  AdminCard,
  AdminHelpBlock,
  AdminHero,
} from "@/service/types/admin/common";

export type BoDataservicesMetadata = AdminHero;

export type BoDataservicesPage = {
  hero?: AdminHero;
  introduction?: AdminHelpBlock;
  producerHelper?: AdminHelpBlock;
  datasetLinksInfo?: AdminHelpBlock;
  draftVisibilityCard?: AdminCard;
  createdCard?: AdminCard;
  archiveInfoCard?: AdminCard[];
  createAuxiliaryItems?: AdminAuxiliaryItem[];
  editAuxiliaryItems?: AdminAuxiliaryItem[];
};
