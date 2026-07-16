import { AuxiliarItem } from "@/components/admin/AuxiliarList";
import type { AdminAuxiliaryItem } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface ReuseAuxiliarErrors {
  title?: boolean;
  link?: boolean;
  type?: boolean;
  topic?: boolean;
  description?: boolean;
  items?: AdminAuxiliaryItem[];
}

function mapReuseAuxiliarItems(
  items: AdminAuxiliaryItem[] | undefined,
  errors: ReuseAuxiliarErrors
): AuxiliarItem[] {
  return (
    items?.filter((item) => item.enabled !== false).map((item, index) => ({
      title: item.title,
      content: formatHtmlParagraphs(item.description, "auxiliar-list__content !p-0"),
      hasError:
        (index === 0 && !!errors.title) ||
        (index === 1 && !!errors.link) ||
        (index === 2 && !!errors.type) ||
        (index === 3 && !!errors.topic) ||
        (index === 4 && !!errors.description),
    })) ?? []
  );
}

export function getCreateReuseAuxiliarItems(
  errors: ReuseAuxiliarErrors = {}
): AuxiliarItem[] {
  return mapReuseAuxiliarItems(errors.items, errors);
}

export function getEditReuseAuxiliarItems(errors: ReuseAuxiliarErrors = {}): AuxiliarItem[] {
  return mapReuseAuxiliarItems(errors.items, errors);
}

export function getReuseAuxiliarItems(errors: ReuseAuxiliarErrors = {}): AuxiliarItem[] {
  return getCreateReuseAuxiliarItems(errors);
}
