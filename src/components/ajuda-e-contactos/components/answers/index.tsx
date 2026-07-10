"use client";

import type { ComponentType } from "react";
import type { RichAnswerKey } from "../../types";
import { DadosEspecificosAnswer } from "./DadosEspecificosAnswer";
import { PublicarAnswer } from "./PublicarAnswer";
import { UsarDadosAnswer } from "./UsarDadosAnswer";
import { ApisAnswer } from "./ApisAnswer";
import { LegaisAnswer } from "./LegaisAnswer";
import { ProblemasTecnicosAnswer } from "./ProblemasTecnicosAnswer";
import { PedidosDadosAnswer } from "./PedidosDadosAnswer";
import { OutrosAnswer } from "./OutrosAnswer";
import { Emblemas } from "./Emblemas";

const FAQ_ANSWERS: Partial<Record<string, ComponentType>> = {
  true: DadosEspecificosAnswer,
  publicar: PublicarAnswer,
  "usar-dados": UsarDadosAnswer,
  apis: ApisAnswer,
  legais: LegaisAnswer,
  "problemas-tecnicos": ProblemasTecnicosAnswer,
  "pedidos-dados": PedidosDadosAnswer,
  outros: OutrosAnswer,
  emblema: Emblemas,
};

interface FaqAnswerProps {
  richAnswer: RichAnswerKey | undefined;
  plainAnswer: string;
}

export function FaqAnswer({ richAnswer, plainAnswer }: FaqAnswerProps) {
  if (!richAnswer) return <>{plainAnswer}</>;

  const key = String(richAnswer);
  const AnswerComponent = FAQ_ANSWERS[key];

  if (!AnswerComponent) return <>{plainAnswer}</>;

  return <AnswerComponent />;
}
