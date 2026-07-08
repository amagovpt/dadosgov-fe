"use client";

import { FaqLink } from "../FaqLink";

export function PedidosDadosAnswer() {
  return (
    <div className="space-y-16">
      <div>
        <p className="font-bold">Pedido formal de dados a uma entidade pública</p>
        <p>
          Pode dirigir pedidos à{" "}
          <FaqLink href="https://www.cada.pt">
            Comissão de Acesso a Documentos Administrativos
          </FaqLink>
        </p>
        <p>
          <span className="inline-flex items-baseline whitespace-nowrap">
            Consulte a página de perguntas frequentes da
            <FaqLink href="https://www.cada.pt/perguntas-frequentes">CADA</FaqLink>
            <span>&nbsp;para saber como proceder</span>
          </span>
        </p>
        <p>
          <FaqLink href="/organizations/comissao-de-acesso-aos-documentos-administrativos/#/presentation">
            Comissão de Acesso a Documentos Administrativos no dados.gov.pt
          </FaqLink>
        </p>
      </div>
      <div>
        <p className="font-bold">Ver pedidos existentes de abertura de dados</p>
        <p>
          Consultar lista pública de pedidos no portal{" "}
          <FaqLink href="/organizations/comissao-de-acesso-aos-documentos-administrativos/#/presentation">
            Comissão de Acesso a Documentos Administrativos
          </FaqLink>
        </p>
      </div>
    </div>
  );
}
