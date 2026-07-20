import {
  AdminAuxiliaryItem,
  AdminCard,
  AdminHelpBlock,
  AdminHero,
  AdminMetadata,
} from "@/service/types/admin/common";

export type BoDataservicesMetadata = AdminMetadata;

export type BoDataservicesPage = {
  metadata?: AdminMetadata;
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
