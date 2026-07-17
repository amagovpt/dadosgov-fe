import type { AuxiliarItem } from "@/components/admin/AuxiliarList";
import { getDataserviceAuxiliaryItems } from "@/components/admin/dataservices/config/dataserviceAuxiliaryContent";

export function getDataserviceAuxiliarItems(): AuxiliarItem[] {
  return getDataserviceAuxiliaryItems({});
}
