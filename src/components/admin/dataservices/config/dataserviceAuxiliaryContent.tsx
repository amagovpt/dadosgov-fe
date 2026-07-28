"use client";

import type { AuxiliarItem } from "@/components/admin/AuxiliarList";
import type { AdminAuxiliaryItem } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface DataserviceAuxiliaryContentParams {
  items?: AdminAuxiliaryItem[];
}

function mapDataserviceAuxiliaryItems(items: AdminAuxiliaryItem[] | undefined): AuxiliarItem[] {
  return (
    items?.filter((item) => item.enabled !== false).map((item) => ({
      title: item.title,
      content: formatHtmlParagraphs(item.description, "auxiliar-list__content !p-0"),
    })) ?? []
  );
}

export function getCreateDataserviceAuxiliaryItems({
  items,
}: DataserviceAuxiliaryContentParams): AuxiliarItem[] {
  return mapDataserviceAuxiliaryItems(items);
}

export function getEditDataserviceAuxiliaryItems({
  items,
}: DataserviceAuxiliaryContentParams): AuxiliarItem[] {
  return mapDataserviceAuxiliaryItems(items);
}

export function getDataserviceAuxiliaryItems(
  params: DataserviceAuxiliaryContentParams
): AuxiliarItem[] {
  return getCreateDataserviceAuxiliaryItems(params);
}
