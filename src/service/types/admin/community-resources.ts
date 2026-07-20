import {
  AdminAuxiliaryItem,
  AdminCard,
  AdminHelpBlock,
  AdminHero,
  AdminMetadata,
} from "@/service/types/admin/common";

export type BoCommunityResourcesMetadata = AdminMetadata;

export type BoCommunityResourcesPage = {
  metadata?: AdminMetadata;
  hero?: AdminHero;
  introduction?: AdminHelpBlock;
  producerHelper?: AdminHelpBlock;
  createdCard?: AdminCard;
  createAuxiliaryItems?: AdminAuxiliaryItem[];
  editAuxiliaryItems?: AdminAuxiliaryItem[];
};
