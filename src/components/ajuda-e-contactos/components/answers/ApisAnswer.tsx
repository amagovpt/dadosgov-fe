"use client";

import { FaqLink } from "../FaqLink";

export function ApisAnswer() {
  return (
    <div className="space-y-16">
      <div>
        <p className="font-bold">Referência API</p>
        <p>
          <FaqLink href="/recursos/desenvolvimento/referencia-api">
            Endpoint de API do portal
          </FaqLink>
        </p>
      </div>
      <div>
        <p className="font-bold">Autenticação / chave API</p>
        <p>
          A API permite leitura aberta. Para escrita/autenticação é necessário gerar o token na
          área de administração do utilizador.
        </p>
      </div>
      <div>
        <p className="font-bold">Limites de pedidos / uso responsável</p>
        <p>
          Política de uso do API nos termos do portal{" "}
          <FaqLink href="/api-tutorial/">API tutorial</FaqLink>
        </p>
      </div>
    </div>
  );
}
