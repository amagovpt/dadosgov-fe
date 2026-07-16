"use client";

import type { AuxiliarItem } from "@/components/admin/AuxiliarList";
import type { AdminAuxiliaryItem } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface DataserviceAuxiliaryContentParams {
  hasApiNameError: boolean;
  hasApiDescriptionError: boolean;
  items?: AdminAuxiliaryItem[];
}

function mapDataserviceAuxiliaryItems(
  items: AdminAuxiliaryItem[] | undefined,
  hasApiNameError: boolean,
  hasApiDescriptionError: boolean
): AuxiliarItem[] {
  return (
    items?.filter((item) => item.enabled !== false).map((item, index) => ({
      title: item.title,
      content: formatHtmlParagraphs(item.description, "auxiliar-list__content !p-0"),
      hasError:
        (index === 0 && hasApiNameError) ||
        (index === 2 && hasApiDescriptionError),
    })) ?? []
  );
}

export function getCreateDataserviceAuxiliaryItems({
  hasApiNameError,
  hasApiDescriptionError,
  items,
}: DataserviceAuxiliaryContentParams): AuxiliarItem[] {
  return mapDataserviceAuxiliaryItems(items, hasApiNameError, hasApiDescriptionError);
}

export function getEditDataserviceAuxiliaryItems({
  hasApiNameError,
  hasApiDescriptionError,
  items,
}: DataserviceAuxiliaryContentParams): AuxiliarItem[] {
  return mapDataserviceAuxiliaryItems(items, hasApiNameError, hasApiDescriptionError);
}

export function getDataserviceAuxiliaryItems(
  params: DataserviceAuxiliaryContentParams
): AuxiliarItem[] {
  return getCreateDataserviceAuxiliaryItems(params);
}
