"use client";

import { FaqLink } from "../FaqLink";

export function PedidosDadosAnswer() {
  return (
    <div className="space-y-16">
      <div>
        <p className="font-bold">Sugerir conjunto de dados</p>
        <p>Formulário de sugestão no portal</p>
      </div>
      <div>
        <p className="font-bold">Pedido formal de dados a uma entidade pública</p>
        <p>
          Pode dirigir pedidos à{" "}
          <FaqLink href="https://www.cada.pt">
            Comissão de Acesso a Documentos Administrativos
          </FaqLink>
        </p>
        <p>
          <FaqLink href="/pages/support">
            formulário e orientação disponíveis na página de contato
          </FaqLink>
        </p>
        <p>
          <FaqLink href="/pages/organizations/comissao-de-acesso-aos-documentos-administrativos/#/presentation">
            Comissão de Acesso a Documentos Administrativos
          </FaqLink>
        </p>
      </div>
      <div>
        <p className="font-bold">Ver pedidos existentes de abertura de dados</p>
        <p>
          Consultar lista pública de pedidos no portal{" "}
          <FaqLink href="/pages/organizations/comissao-de-acesso-aos-documentos-administrativos/#/presentation">
            Comissão de Acesso aos Documentos Administrativos
          </FaqLink>
        </p>
      </div>
    </div>
  );
}
