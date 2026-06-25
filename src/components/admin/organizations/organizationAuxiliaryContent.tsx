"use client";

import React from "react";
import type { AuxiliarItem } from "@/components/admin/AuxiliarList";

interface OrganizationAuxiliaryContentParams {
  hasNameError: boolean;
  hasDescriptionError: boolean;
}

export function getOrganizationAuxiliaryItems({
  hasNameError,
  hasDescriptionError,
}: OrganizationAuxiliaryContentParams): AuxiliarItem[] {
  return [
    {
      title: "Dar um nome à sua organização",
      content: "Nome público da sua organização.",
      hasError: hasNameError,
    },
    {
      title: "Adicionar uma sigla",
      content: "A sigla da sua organização, se houver.",
    },
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
    {
      title: "Descrever a organização",
      content:
        "Descreva de forma clara a atividade e missão da sua organização. Inclua também informações de contacto essenciais, como e-mail, morada ou redes sociais. Estas informações ajudam os utilizadores a compreender o papel da sua organização e a contactá-la facilmente, sempre que necessário.",
      hasError: hasDescriptionError,
    },
    {
      title: "Adicionar o site",
      content: "Se a sua organização possui um site, inclua o endereço URL.",
    },
    {
      title: "Escolher o logotipo",
      content:
        'Se a sua organização tiver um logótipo ou imagem de perfil, adicione-o. Para carregar o ficheiro, clique em "Selecione ou arraste o ficheiro". São aceites os seguintes formatos de imagem: JPG, JPEG e PNG.',
    },
  ];
}
