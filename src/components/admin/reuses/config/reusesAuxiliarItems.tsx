import { AuxiliarItem } from "@/components/admin/AuxiliarList";
import type { AdminAuxiliaryItem } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface ReuseAuxiliarOptions {
  items?: AdminAuxiliaryItem[];
}

function mapReuseAuxiliarItems(items: AdminAuxiliaryItem[] | undefined): AuxiliarItem[] {
  return (
    items?.filter((item) => item.enabled !== false).map((item) => ({
      title: item.title,
      content: formatHtmlParagraphs(item.description, "auxiliar-list__content !p-0"),
    })) ?? []
  );
}

export function getCreateReuseAuxiliarItems(
  options: ReuseAuxiliarOptions = {}
): AuxiliarItem[] {
  return mapReuseAuxiliarItems(options.items);
}

export function getEditReuseAuxiliarItems(options: ReuseAuxiliarOptions = {}): AuxiliarItem[] {
  return mapReuseAuxiliarItems(options.items);
}

export function getReuseAuxiliarItems(options: ReuseAuxiliarOptions = {}): AuxiliarItem[] {
  return getCreateReuseAuxiliarItems(options);
}
