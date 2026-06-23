"use client";

import React from "react";
import type { AuxiliarItem } from "@/components/admin/AuxiliarList";

interface CreateAuxiliaryFlags {
  hasResourceUrlError: boolean;
  hasTitleError: boolean;
  hasTypeError: boolean;
}

interface EditAuxiliaryFlags {
  hasUrlError: boolean;
  hasTitleError: boolean;
  hasTypeError: boolean;
}

export function getCreateCommunityResourceAuxiliaryItems({
  hasResourceUrlError,
  hasTitleError,
  hasTypeError,
}: CreateAuxiliaryFlags): AuxiliarItem[] {
  return [
    {
      title: "Escolher o link correto",
      content:
        "É recomendável criar um link para o próprio arquivo em vez de uma página da web para permitir que o site o analise.",
      hasError: hasResourceUrlError,
    },
    {
      title: "Dê um nome ao arquivo",
      content: (
        <>
          Recomenda-se escolher um título que informe claramente qualquer usuário sobre o conteúdo
          do arquivo. Algumas práticas a serem evitadas:
          <ul className="mt-8 list-disc pl-16">
            <li>atribuir um título muito genérico (por exemplo, &quot;list.csv&quot;);</li>
            <li>Dar um título muito longo dificultaria a manipulação do arquivo;</li>
            <li>
              fornecer um título que contenha acentos ou caracteres especiais (problemas de
              interoperabilidade de ficheiros);
            </li>
            <li>
              Dar um título que seja demasiado técnico e derivado de nomenclaturas da indústria.
            </li>
          </ul>
        </>
      ),
      hasError: hasTitleError,
    },
    {
      title: "Publique os tipos de ficheiros corretos.",
      content: (
        <>
          Você pode escolher entre os seguintes tipos:
          <ul className="mt-8 list-disc pl-16">
            <li>Ficheiros principais</li>
            <li>Documentação</li>
            <li>Atualizar</li>
            <li>API</li>
            <li>Código-fonte</li>
            <li>Outro</li>
          </ul>
        </>
      ),
      hasError: hasTypeError,
    },
    {
      title: "Adicionar documentação",
      content: (
        <>
          A descrição de um arquivo facilita a reutilização de dados. Ela inclui, entre outras
          coisas:
          <ul className="mt-8 list-disc pl-16">
            <li>uma descrição geral do conjunto de dados;</li>
            <li>uma descrição do método de produção de dados;</li>
            <li>uma descrição do modelo de dados;</li>
            <li>uma descrição do esquema de dados;</li>
            <li>uma descrição dos metadados;</li>
            <li>Uma descrição das principais mudanças.</li>
          </ul>
        </>
      ),
    },
    {
      title: "Selecione um esquema",
      content:
        "É possível identificar um esquema de dados existente visitando o site schema.data.gouv.fr, que contém uma lista de esquemas de dados existentes.esquema.dados.gouv.fr",
    },
  ];
}

export function getEditCommunityResourceAuxiliaryItems({
  hasUrlError,
  hasTitleError,
  hasTypeError,
}: EditAuxiliaryFlags): AuxiliarItem[] {
  return [
    {
      title: "Escolher o link correto",
      hasError: hasUrlError,
      content:
        "É recomendável criar um link para o próprio arquivo em vez de uma página da web para permitir que o site o analise.",
    },
    {
      title: "Soma de verificação",
      content:
        "O checksum permite ao utilizador verificar se os dados descarregados não foram corrompidos ou alterados.",
    },
    {
      title: "Dê um nome ao arquivo",
      hasError: hasTitleError,
      content: (
        <>
          Recomenda-se a escolha de um título que informe claramente qualquer utilizador sobre o
          conteúdo do arquivo. Algumas práticas a evitar:
          <ul className="mt-8 list-disc pl-16">
            <li>atribuir um título muito genérico (por exemplo, &quot;list.csv&quot;);</li>
            <li>dar um título muito longo dificultaria a manipulação do arquivo;</li>
            <li>
              fornecer um título que contenha acentos ou caracteres especiais (problemas de
              interoperabilidade de arquivos);
            </li>
            <li>
              dar um título que seja demasiado técnico e derivado de nomenclaturas da indústria.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "Publique os tipos de ficheiros corretos.",
      hasError: hasTypeError,
      content: (
        <>
          Pode escolher entre os seguintes tipos:
          <ul className="mt-8 list-disc pl-16">
            <li>Ficheiros principais</li>
            <li>Documentação</li>
            <li>Atualização</li>
            <li>API</li>
            <li>Código-fonte</li>
            <li>Outro</li>
          </ul>
        </>
      ),
    },
    {
      title: "Adicionar documentação",
      content: (
        <>
          A descrição de um ficheiro facilita a reutilização de dados. Inclui, entre outras coisas:
          <ul className="mt-8 list-disc pl-16">
            <li>uma descrição geral do conjunto de dados;</li>
            <li>uma descrição do método de produção de dados;</li>
            <li>uma descrição do modelo de dados;</li>
            <li>uma descrição do esquema de dados;</li>
            <li>uma descrição dos metadados;</li>
            <li>uma descrição das principais alterações.</li>
          </ul>
        </>
      ),
    },
    {
      title: "Escolher o formato certo",
      content: (
        <>
          Os formatos devem ser:
          <ul className="mt-8 list-disc pl-16">
            <li>
              aberto: um formato aberto não adiciona especificações técnicas que restrinjam o uso
              dos dados (por exemplo, o uso de software pago);
            </li>
            <li>
              facilmente reutilizável: um formato facilmente reutilizável implica que qualquer
              pessoa ou servidor pode reutilizar facilmente o conjunto de dados;
            </li>
            <li>
              utilizável num sistema de processamento automatizado: um sistema de processamento
              automatizado permite operações automáticas relacionadas ao processamento de dados (por
              exemplo, um ficheiro CSV é facilmente utilizável por um sistema automatizado, ao
              contrário de um ficheiro PDF).
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "Escolher um tipo de recurso",
      content:
        "Especifique o tipo de recurso correspondente ao formato do recurso remoto (por exemplo, application/pdf, text/csv). Se necessário, utilize uma ferramenta online para detetá-lo.",
    },
    {
      title: "Selecione um esquema",
      content:
        "É possível identificar um esquema de dados existente ao visitar o site schema.data.gouv.fr, que contém uma lista de esquemas de dados existentes.",
    },
  ];
}
