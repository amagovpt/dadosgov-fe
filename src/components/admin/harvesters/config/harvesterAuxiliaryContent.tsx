"use client";

import React from "react";
import type { AuxiliarItem } from "@/components/admin/AuxiliarList";
import TextLink from "@/components/Primitives/TextLink";

interface HarvesterAuxiliaryContentParams {
  hasHarvesterNameError: boolean;
  hasHarvesterUrlError: boolean;
}

export function getHarvesterAuxiliaryItems({
  hasHarvesterNameError,
  hasHarvesterUrlError,
}: HarvesterAuxiliaryContentParams): AuxiliarItem[] {
  return [
    {
      title: "Escolher a organização",
      content: (
        <>
          <p className="auxiliar-list__content !p-0">
            A criação de um harvester de dados deve ser feita em nome de uma organização e requer
            permissões de administrador.
          </p>
          <p className="auxiliar-list__content mt-8 !p-0">
            Selecione uma organização da qual seja administrador. Se a sua organização ainda não
            existir, terá de a criar primeiro através deste{" "}
            <TextLink href="/pages/admin/organizations/new" className="auxiliar-list__content !p-0">
              link ↗
            </TextLink>
            .
          </p>
        </>
      ),
    },
    {
      title: "Dar um nome",
      content:
        "Dê um nome ao seu harvester. Esta é uma referência interna que o ajudará a identificá-lo caso crie vários harvesters. O nome do seu harvester não será público.",
      hasError: hasHarvesterNameError,
    },
    {
      title: "Descrever o seu harvester",
      content:
        "Adicione informações no campo de descrição para uso interno. Este campo é opcional.",
    },
    {
      title: "Adicionar o URL",
      content:
        "Insira o URL do portal que pretende ligar. Normalmente corresponde ao URL da página inicial do seu portal de dados abertos. Este URL permite ao harvester percorrer o portal e recolher todos os seus conjuntos de dados.",
      hasError: hasHarvesterUrlError,
    },
    {
      title: "Identificar o tipo de implementação",
      content:
        "Escolha o formato dos metadados (ex.:, DCAT, CKAN, etc.). Esse formato permite que o harvester saiba como ler e interpretar os metadados, para que possam ser transcritos corretamente em dados.gov.pt",
    },
  ];
}
