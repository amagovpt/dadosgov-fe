"use client";

import { FaqLink } from "../FaqLink";

export function LegaisAnswer() {
  return (
    <div className="space-y-16">
      <div>
        <p className="font-bold">Proteção de Dados Pessoais / RGPD</p>
        <p>
          Contactar a{" "}
          <FaqLink href="https://www.cnpd.pt">Comissão Nacional de Proteção de Dados</FaqLink>
        </p>
      </div>
      <div>
        <p className="font-bold">Pedido de remoção de dados pessoais</p>
        <p>
          Contactar a equipa do dados.gov.pt na página de{" "}
          <FaqLink href="/pages/support#ajuda">Suporte</FaqLink>
        </p>
      </div>
    </div>
  );
}
