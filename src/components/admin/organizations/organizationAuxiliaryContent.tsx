"use client";

import type { AuxiliarItem } from "@/components/admin/AuxiliarList";
import type { AdminAuxiliaryItem } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface OrganizationAuxiliaryContentParams {
  items?: AdminAuxiliaryItem[];
}

export function getOrganizationAuxiliaryItems({
  items,
}: OrganizationAuxiliaryContentParams): AuxiliarItem[] {
  /* {
      title: "Por que fornecer um número SIRET?",
      content: (
        <>
          <p>
            Um número SIRET nos permitirá atribuir um tipo à sua organização
            (agências governamentais, autoridades locais, empresas, etc.) e
            facilitará sua certificação. O número deve ter 14 dígitos.
          </p>
          <p className="mt-2">
            Observe que todas as agências governamentais possuem um número SIRET.
          </p>
          <p className="mt-2">
            Pode encontrar o seu número SIRET no{" "}
            <TextLink href="#">
              Diretório Comercial.
            </TextLink>
          </p>
        </>
      ),
    }, */

  return (
    items?.filter((item) => item.enabled !== false).map((item) => ({
      title: item.title,
      content: formatHtmlParagraphs(item.description, "auxiliar-list__content !p-0"),
    })) ?? []
  );
}
