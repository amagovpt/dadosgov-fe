import {
  AdminAuxiliaryItem,
  AdminCard,
  AdminHelpBlock,
  AdminHero,
} from "@/service/types/admin/common";

export type BoCommunityResourcesMetadata = AdminHero;

export type BoCommunityResourcesPage = {
  hero?: AdminHero;
  introduction?: AdminHelpBlock;
  producerHelper?: AdminHelpBlock;
  createdCard?: AdminCard;
  createAuxiliaryItems?: AdminAuxiliaryItem[];
  editAuxiliaryItems?: AdminAuxiliaryItem[];
};
