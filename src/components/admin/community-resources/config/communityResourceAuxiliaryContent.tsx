"use client";

import type { AuxiliarItem } from "@/components/admin/AuxiliarList";
import type { AdminAuxiliaryItem } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface AuxiliaryOptions {
  items?: AdminAuxiliaryItem[];
}

function mapCommunityResourceAuxiliaryItems(items: AdminAuxiliaryItem[] | undefined): AuxiliarItem[] {
  return (
    items?.filter((item) => item.enabled !== false).map((item) => ({
      title: item.title,
      content: formatHtmlParagraphs(item.description, "auxiliar-list__content !p-0"),
    })) ?? []
  );
}

export function getCreateCommunityResourceAuxiliaryItems({
  items,
}: AuxiliaryOptions): AuxiliarItem[] {
  return mapCommunityResourceAuxiliaryItems(items);
}

export function getEditCommunityResourceAuxiliaryItems({
  items,
}: AuxiliaryOptions): AuxiliarItem[] {
  return mapCommunityResourceAuxiliaryItems(items);
}
