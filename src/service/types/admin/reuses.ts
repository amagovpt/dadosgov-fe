import {
  AdminAuxiliaryItem,
  AdminCard,
  AdminHelpBlock,
  AdminHero,
  AdminMetadata,
  AdminStep,
} from "@/service/types/admin/common";

export type BoReusesMetadata = AdminMetadata;

export type BoReusesPage = {
  metadata?: AdminMetadata;
  hero?: AdminHero;
  steps?: AdminStep[];
  orgSteps?: AdminStep[];
  introduction?: AdminHelpBlock;
  datasetAssociationInfo?: AdminHelpBlock;
  datasetAssociationWarning?: AdminHelpBlock;
  createdCard?: AdminCard;
  createAuxiliaryItems?: AdminAuxiliaryItem[];
  editAuxiliaryItems?: AdminAuxiliaryItem[];
};
