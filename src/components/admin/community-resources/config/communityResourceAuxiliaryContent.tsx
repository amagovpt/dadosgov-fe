"use client";

import type { AuxiliarItem } from "@/components/admin/AuxiliarList";
import type { AdminAuxiliaryItem } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface CreateAuxiliaryFlags {
  hasResourceUrlError: boolean;
  hasTitleError: boolean;
  hasTypeError: boolean;
  items?: AdminAuxiliaryItem[];
}

interface EditAuxiliaryFlags {
  hasUrlError: boolean;
  hasTitleError: boolean;
  hasTypeError: boolean;
  items?: AdminAuxiliaryItem[];
}

function mapCommunityResourceAuxiliaryItems(
  items: AdminAuxiliaryItem[] | undefined,
  errorByIndex: Record<number, boolean>
): AuxiliarItem[] {
  return (
    items?.filter((item) => item.enabled !== false).map((item, index) => ({
      title: item.title,
      content: formatHtmlParagraphs(item.description, "auxiliar-list__content !p-0"),
      hasError: errorByIndex[index] ?? false,
    })) ?? []
  );
}

export function getCreateCommunityResourceAuxiliaryItems({
  hasResourceUrlError,
  hasTitleError,
  hasTypeError,
  items,
}: CreateAuxiliaryFlags): AuxiliarItem[] {
  return mapCommunityResourceAuxiliaryItems(items, {
    0: hasResourceUrlError,
    1: hasTitleError,
    2: hasTypeError,
  });
}

export function getEditCommunityResourceAuxiliaryItems({
  hasUrlError,
  hasTitleError,
  hasTypeError,
  items,
}: EditAuxiliaryFlags): AuxiliarItem[] {
  return mapCommunityResourceAuxiliaryItems(items, {
    0: hasUrlError,
    2: hasTitleError,
    3: hasTypeError,
  });
}
