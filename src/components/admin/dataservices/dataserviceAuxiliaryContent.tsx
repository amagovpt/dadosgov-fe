"use client";

import React from "react";
import type { AuxiliarItem } from "@/components/admin/AuxiliarList";

interface DataserviceAuxiliaryContentParams {
  hasApiNameError: boolean;
  hasApiDescriptionError: boolean;
}

export function getDataserviceAuxiliaryItems({
  hasApiNameError,
  hasApiDescriptionError,
}: DataserviceAuxiliaryContentParams): AuxiliarItem[] {
  return [
    {
      title: "Como dar nome à sua API",
      content:
        'Dê à sua API um nome relevante e descritivo que reflita sua função ou área de aplicação. Um bom nome facilita a busca e a identificação por parte dos utilizadores. Sempre adicione o prefixo "API" para manter a consistência.',
      hasError: hasApiNameError,
    },
    {
      title: "Adicione uma abreviação ou sigla à API.",
      content:
        "Tem a opção de adicionar uma sigla à sua API. As letras que compõem essa sigla não precisam ser separadas por pontos.",
    },
    {
      title: "Escreva uma boa descrição",
      content:
        "Escreva uma descrição clara e precisa da API. Os utilizadores precisam entender a finalidade da API, os dados fornecidos, o escopo abrangido (os dados são completos? Há alguma lacuna?), a frequência de atualização dos dados e os parâmetros que podem ser usados para fazer uma chamada.",
      hasError: hasApiDescriptionError,
    },
    {
      title: "Defina o link correto para a API.",
      content:
        "A URL base de uma API é o ponto de entrada comum para todas as requisições, geralmente consistindo em um domínio ou endereço de servidor. Ela serve como base para a qual caminhos específicos (endpoints) são adicionados para acessar os diversos recursos da API.",
    },
    {
      title: "Adicione um link para a documentação da máquina.",
      content:
        "Idealmente, forneça um link OpenAPI (Swagger) que permita aos desenvolvedores explorar os endpoints, visualizar os métodos disponíveis e testar consultas diretamente da documentação. Para serviços geográficos, pode fornecer um link para o serviço com uma consulta GetCapabilities para recuperar os metadados do serviço.",
    },
    {
      title: "Adicione um link para a documentação técnica.",
      content:
        "Adicione um link para a documentação técnica geral da API, descrevendo os passos de integração.",
    },
    {
      title: "Especifique o limite de chamadas",
      content:
        "Caso o número de chamadas à sua API seja limitado, defina aqui o número máximo de chamadas por minuto, ou mesmo por IP e/ou token.",
    },
    {
      title: "Indique a disponibilidade",
      content:
        "Especifique a disponibilidade média da sua API. O valor deve ser uma porcentagem.",
    },
    {
      title: "Selecione um tipo de acesso",
      content:
        'Escolha o tipo de acesso (aberto, aberto com conta ou restrito). Selecione "aberto" se os dados forem públicos. Selecione "aberto com conta" se o acesso aos dados exigir uma conta. Se selecionar "restrito", especifique os tipos de utilizadores que podem aceder a esta API.',
    },
    {
      title: "Adicione um link à solicitação de autorização.",
      content:
        "Se a sua API tiver acesso restrito, adicione o link ao formulário de solicitação de acesso. É administrador? A solução Datapass permite criar e gerenciar formulários de solicitação de acesso a dados com facilidade.",
    },
    {
      title: "Adicione um link para a documentação da empresa.",
      content:
        "A documentação comercial da sua API explica seu escopo e casos de uso. Ela complementa a documentação técnica.",
    },
  ];
}
