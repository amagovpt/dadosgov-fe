"use client";

import { FaqLink } from "../FaqLink";

export function DadosEspecificosAnswer() {
  return (
    <div className="space-y-16">
      <div>
        <p className="font-bold">Estatísticas oficiais</p>
        <p>
          Visitar o Instituto Nacional de Estatística no{" "}
          <FaqLink href="/pages/organizations/instituto-nacional-de-estatistica/">
            dados.gov.pt
          </FaqLink>
        </p>
      </div>
      <div>
        <p className="font-bold">Dados geográficos / cartografia</p>
        <p>
          Direção-Geral do Território no{" "}
          <FaqLink href="/pages/organizations/direcao-geral-do-territorio/">
            dados.gov.pt
          </FaqLink>
        </p>
        <p>
          Sistema Nacional de Informação Geográfica{" "}
          <FaqLink href="https://snig.dgterritorio.gov.pt/">SNIG</FaqLink>
        </p>
      </div>
      <div>
        <p className="font-bold">Dados bibliográficos / culturais</p>
        <p>
          Biblioteca Nacional de Portugal -{" "}
          <FaqLink href="https://opendata.bnportugal.gov.pt/eng_index.htm">
            OpenData BNP
          </FaqLink>
        </p>
      </div>
      <div>
        <p className="font-bold">
          Dados do Sistema de Informação Cadastral Simplificado e do Balcão Único do Prédio
        </p>
        <p>
          eBUPI no{" "}
          <FaqLink href="/pages/organizations/ebupi-estrutura-de-missao-para-a-expansao-do-sistema-de-informacao-cadastral-simplificado/#/presentation">
            dados.gov.pt
          </FaqLink>
        </p>
        <p>
          Estrutura de Missão Para a Expansão do Sistema de Informação Cadastral Simplificado no{" "}
          <FaqLink href="https://www.gov.pt/entidades/estrutura-de-missao-para-a-expansao-do-sistema-de-informacao-cadastral-simplificado">
            gov.pt
          </FaqLink>
        </p>
      </div>
      <div>
        <p className="font-bold">Questões sobre um conjunto de dados no dados.gov.pt</p>
        <p>
          Abrir o separador <strong>&ldquo;Discussões&rdquo;</strong> na página do conjunto de
          dados
        </p>
      </div>
    </div>
  );
}
