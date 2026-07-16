import {
  AdminAuxiliaryItem,
  AdminCard,
  AdminHelpBlock,
  AdminHero,
} from "@/service/types/admin/common";

export type BoReusesMetadata = AdminHero;

export type BoReusesPage = {
  hero?: AdminHero;
  introduction?: AdminHelpBlock;
  datasetAssociationInfo?: AdminHelpBlock;
  datasetAssociationWarning?: AdminHelpBlock;
  createdCard?: AdminCard;
  createAuxiliaryItems?: AdminAuxiliaryItem[];
  editAuxiliaryItems?: AdminAuxiliaryItem[];
};
