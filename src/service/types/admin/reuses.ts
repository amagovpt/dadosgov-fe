import {
  AdminAuxiliaryItem,
  AdminCard,
  AdminHelpBlock,
  AdminHero,
  AdminMetadata,
} from "@/service/types/admin/common";

export type BoReusesMetadata = AdminMetadata;

export type BoReusesPage = {
  metadata?: AdminMetadata;
  hero?: AdminHero;
  introduction?: AdminHelpBlock;
  datasetAssociationInfo?: AdminHelpBlock;
  datasetAssociationWarning?: AdminHelpBlock;
  createdCard?: AdminCard;
  createAuxiliaryItems?: AdminAuxiliaryItem[];
  editAuxiliaryItems?: AdminAuxiliaryItem[];
};
