import type { AuxiliarItem } from "@/components/admin/AuxiliarList";
import { getDataserviceAuxiliaryItems } from "@/components/admin/dataservices/config/dataserviceAuxiliaryContent";

interface DataserviceAuxiliarErrors {
  name?: boolean;
  description?: boolean;
}

export function getDataserviceAuxiliarItems(
  errors: DataserviceAuxiliarErrors = {}
): AuxiliarItem[] {
  return getDataserviceAuxiliaryItems({
    hasApiNameError: !!errors.name,
    hasApiDescriptionError: !!errors.description,
  });
}
