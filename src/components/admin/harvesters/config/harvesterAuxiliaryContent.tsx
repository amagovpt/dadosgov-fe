"use client";

import React from "react";
import type { AuxiliarItem } from "@/components/admin/AuxiliarList";
import type { AdminAuxiliaryItem } from "@/service/types/admin/common";
import TextLink from "@/components/Primitives/TextLink";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface HarvesterAuxiliaryContentParams {
  items?: AdminAuxiliaryItem[];
}

function renderAuxiliaryItemContent(item: AdminAuxiliaryItem) {
  return (
    <>
      {formatHtmlParagraphs(item.description, "auxiliar-list__content !p-0")}
      {item.anchor?.href && item.anchor.children ? (
        <p className="mt-8">
          <TextLink href={item.anchor.href} className="auxiliar-list__content !p-0">
            {item.anchor.children}
          </TextLink>
        </p>
      ) : null}
    </>
  );
}

function mapHarvesterAuxiliaryItems(items: AdminAuxiliaryItem[] | undefined): AuxiliarItem[] {
  return (
    items?.filter((item) => item.enabled !== false).map((item) => ({
      title: item.title,
      content: renderAuxiliaryItemContent(item),
    })) ?? []
  );
}

export function getCreateHarvesterAuxiliaryItems({
  items,
}: HarvesterAuxiliaryContentParams): AuxiliarItem[] {
  return mapHarvesterAuxiliaryItems(items);
}

export function getEditHarvesterAuxiliaryItems({
  items,
}: HarvesterAuxiliaryContentParams): AuxiliarItem[] {
  return mapHarvesterAuxiliaryItems(items);
}
