import {
  AdminAuxiliaryItem,
  AdminCard,
  AdminHelpBlock,
  AdminHero,
  AdminMetadata,
} from "@/service/types/admin/common";

export type BoHarvestersMetadata = AdminMetadata;

export type BoHarvestersPage = {
  metadata?: AdminMetadata;
  hero?: AdminHero;
  introduction?: AdminHelpBlock;
  acceptedStatusInfo?: AdminHelpBlock;
  pendingAdminCard?: AdminCard;
  pendingOwnerCard?: AdminCard;
  createdPendingCard?: AdminCard;
  createAuxiliaryItems?: AdminAuxiliaryItem[];
  editAuxiliaryItems?: AdminAuxiliaryItem[];
};
