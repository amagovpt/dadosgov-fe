"use client";

import { StatusCard } from "@ama-pt/agora-design-system";
import Link from "next/link";

export function DatasetInfoCard() {
  return (
    <div className="mt-32 flex max-w-2xl flex-col gap-32">
      <StatusCard
        variant="informative"
        showIcon
        description={
          <div className="flex flex-col gap-8">
            <p>Não encontrou o conjunto de dados que procura no portal? Siga estes passos:</p>
            <p>
              <b>1. Se a organização já está registada no portal</b>
            </p>
            <p>
              Consulte a página da organização em causa e aceda ao separador <b>"Discussões"</b>.
              Este é o canal de contacto direto com a organização detentora dos dados, onde pode
              colocar o seu pedido.
            </p>
            <p>
              <b>Nota:</b> a resposta ao pedido é da responsabilidade da própria organização. O
              portal disponibiliza o canal de comunicação, mas não pode garantir prazos ou conteúdo
              da resposta.
            </p>
            <p>
              <b>2. Se a organização não está registada no portal</b>
            </p>
            <p>
              Nesse caso, pode recorrer à{" "}
              <Link
                href="https://www.cada.pt/"
                target="_blank"
                className="text-m-bold text-primary-700 underline"
              >
                Comissão de Acesso aos Documentos Administrativos
              </Link>{" "}
              <b>(CADA)</b>, entidade responsável por mediar pedidos formais de acesso a documentos
              administrativos (dados inclusive), junto de entidades públicas.
            </p>
            <p>
              Para saber como proceder, consulte a secção <b>"Pedidos de novos dados"</b> nas
              Perguntas Frequentes desta página, onde encontra o link e as orientações para submeter
              um pedido junto da CADA.
            </p>
          </div>
        }
      />

      <StatusCard
        variant="informative"
        showIcon
        description={
          <div className="flex flex-col gap-8">
            <p>
              Para questões relacionadas com um conjunto de dados específico, como pedidos de
              atualização, esclarecimentos sobre conteúdo, formatos, periodicidade, qualidade dos
              dados ou disponibilização de informação adicional, utilize a área de
              discussão/comentários na página do respetivo conjunto de dados.
            </p>
            <p>A resposta é da responsabilidade da entidade publicadora.</p>
          </div>
        }
      />
    </div>
  );
}
