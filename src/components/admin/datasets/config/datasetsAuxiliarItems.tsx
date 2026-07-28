import { AuxiliarItem } from "@/components/admin/AuxiliarList";
import type { AdminAuxiliaryItem } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface DatasetAuxiliarOptions {
  items?: AdminAuxiliaryItem[];
}

function mapDatasetAuxiliarItems(
  items: AdminAuxiliaryItem[] | undefined
): AuxiliarItem[] {
  return (
    items?.filter((item) => item.enabled !== false).map((item) => ({
      title: item.title,
      content: formatHtmlParagraphs(item.description, "auxiliar-list__content !p-0"),
    })) ?? []
  );
}

export function getCreateDatasetAuxiliarItems(
  options: DatasetAuxiliarOptions = {}
): AuxiliarItem[] {
  return mapDatasetAuxiliarItems(options.items);
}

export function getEditDatasetAuxiliarItems(
  options: DatasetAuxiliarOptions = {}
): AuxiliarItem[] {
  return mapDatasetAuxiliarItems(options.items);
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

export function getDatasetAuxiliarItems(options: DatasetAuxiliarOptions = {}): AuxiliarItem[] {
  return getCreateDatasetAuxiliarItems(options);
}
