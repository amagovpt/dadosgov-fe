import {
  AdminAuxiliaryItem,
  AdminCard,
  AdminHelpBlock,
  AdminHero,
  AdminMetadata,
  AdminStep,
} from "@/service/types/admin/common";

export type BoHarvestersMetadata = AdminMetadata;

export type BoHarvestersPage = {
  metadata?: AdminMetadata;
  hero?: AdminHero;
  steps?: AdminStep[];
  introduction?: AdminHelpBlock;
  acceptedStatusInfo?: AdminHelpBlock;
  pendingAdminCard?: AdminCard;
  pendingOwnerCard?: AdminCard;
  createdPendingCard?: AdminCard;
  createAuxiliaryItems?: AdminAuxiliaryItem[];
  editAuxiliaryItems?: AdminAuxiliaryItem[];
};
