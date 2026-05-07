import React from "react";
import { AuxiliarItem } from "@/components/admin/AuxiliarList";

interface ReuseAuxiliarErrors {
  title?: boolean;
  link?: boolean;
  type?: boolean;
  topic?: boolean;
  description?: boolean;
}

export function getReuseAuxiliarItems(errors: ReuseAuxiliarErrors = {}): AuxiliarItem[] {
  return [
    {
      title: "Dar um título",
      content: (
        <p>
          Prefira um título que explique claramente como a reutilização utiliza os dados, em vez de
          usar apenas o nome do site ou da aplicação. Por exemplo: "Sistema de Pesquisa de Acordos
          Comerciais" em vez de "acordoscomerciais.pt".
        </p>
      ),
      hasError: !!errors.title,
    },
    {
      title: "Adicionar um link",
      content: (
        <p>
          Insira o link da página onde a reutilização pode ser consultada. Prefira o link direto
          para o conteúdo e certifique-se de que o endereço permanece estável.
        </p>
      ),
      hasError: !!errors.link,
    },
    {
      title: "Escolher um tipo",
      content: (
        <p>
          Indique o tipo em que deve ser classificada a reutilização (API, aplicação, artigo de
          imprensa, visualização, etc.).
        </p>
      ),
      hasError: !!errors.type,
    },
    {
      title: "Escolher um tema",
      content: <p>Escolha o tema associado à sua reutilização.</p>,
      hasError: !!errors.topic,
    },
    {
      title: "Descrever a reutilização",
      content: (
        <p>
          Pode indicar, de forma objetiva, como a reutilização foi desenvolvida, o que permite
          realizar ou demonstrar e, se relevante, acrescentar informação sobre o contexto em que a
          reutilização foi criada. Recomenda-se manter um tom neutro; conteúdos com caráter
          excessivamente promocional poderão não ser aceites.
        </p>
      ),
      hasError: !!errors.description,
    },
    {
      title: "Adicionar palavras-chave",
      content: (
        <p>
          As palavras-chave ajudam a caracterizar a reutilização, tornam-na mais fácil de encontrar e
          contribuem para um melhor posicionamento nos motores de busca.
        </p>
      ),
    },
    {
      title: "Escolher uma imagem",
      content: (
        <p>
          Se a sua reutilização tiver uma componente visual, pode apresentar uma pré-visualização
          através de uma imagem ou de uma captura de ecrã (preferíveis a logótipos ou a simples
          ilustrações). Esta imagem será exibida na secção "Reutilizações" na listagem das mesmas.
        </p>
      ),
    },
  ];
}
