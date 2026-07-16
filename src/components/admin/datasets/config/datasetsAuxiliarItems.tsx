import { AuxiliarItem } from "@/components/admin/AuxiliarList";
import type { AdminAuxiliaryItem } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface DatasetAuxiliarErrors {
  title?: boolean;
  description?: boolean;
  frequency?: boolean;
  items?: AdminAuxiliaryItem[];
}

function mapDatasetAuxiliarItems(
  items: AdminAuxiliaryItem[] | undefined,
  errors: DatasetAuxiliarErrors
): AuxiliarItem[] {
  return (
    items?.filter((item) => item.enabled !== false).map((item, index) => ({
      title: item.title,
      content: formatHtmlParagraphs(item.description, "auxiliar-list__content !p-0"),
      hidden: index === 3,
      hasError:
        (index === 0 && !!errors.title) ||
        (index === 2 && !!errors.description) ||
        (index === 6 && !!errors.frequency),
    })) ?? []
  );
}

export function getCreateDatasetAuxiliarItems(
  errors: DatasetAuxiliarErrors = {}
): AuxiliarItem[] {
  return mapDatasetAuxiliarItems(errors.items, errors);
}

export function getEditDatasetAuxiliarItems(
  errors: DatasetAuxiliarErrors = {}
): AuxiliarItem[] {
  return mapDatasetAuxiliarItems(errors.items, errors);
}

export function getResourceDatasetAuxiliarItems(
  items: AdminAuxiliaryItem[] | undefined
): AuxiliarItem[] {
  return (
    items?.filter((item) => item.enabled !== false).map((item) => ({
      title: item.title,
      content: formatHtmlParagraphs(item.description, "auxiliar-list__content !p-0"),
    })) ?? []
  );
}

export function getDatasetAuxiliarItems(errors: DatasetAuxiliarErrors = {}): AuxiliarItem[] {
  return getCreateDatasetAuxiliarItems(errors);
}
