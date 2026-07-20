import {
  AdminAuxiliaryItem,
  AdminCard,
  AdminHelpBlock,
  AdminHero,
  AdminMetadata,
  AdminStep,
} from "@/service/types/admin/common";

export type BoCommunityResourcesMetadata = AdminMetadata;

export type BoCommunityResourcesPage = {
  metadata?: AdminMetadata;
  hero?: AdminHero;
  steps?: AdminStep[];
  introduction?: AdminHelpBlock;
  producerHelper?: AdminHelpBlock;
  createdCard?: AdminCard;
  createAuxiliaryItems?: AdminAuxiliaryItem[];
  editAuxiliaryItems?: AdminAuxiliaryItem[];
};
