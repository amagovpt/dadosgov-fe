"use client";

import { FaqLink } from "../FaqLink";

export function UsarDadosAnswer() {
  return (
    <div className="space-y-16">
      <div>
        <p className="font-bold">Pesquisa de dados aberta do portal</p>
        <p>
          Página principal do portal:{" "}
          <FaqLink href="/">dados.gov.pt</FaqLink>
        </p>
      </div>
      <div>
        <p className="font-bold">Como reutilizar dados</p>
        <p>
          Consultar secções de exemplos de reutilização e licenças no portal, ex:{" "}
          <FaqLink href="/recursos/como-usar-o-portal/como-reutilizar-dados">
            (Como reutilizar dados?)
          </FaqLink>
        </p>
      </div>
      <div>
        <p className="font-bold">Licenças de dados abertos</p>
        <p>
          Licenças padrão (ex.: Creative Commons CC BY 4.0 utilizado no portal){" "}
          <FaqLink href="/termos-de-utilizacao">Licenças</FaqLink>
        </p>
      </div>
      <div>
        <p className="font-bold">Citar dados corretamente</p>
        <p>Ver informação de metadados em cada conjunto de dados</p>
        <p>
          Indicar: nome do conjunto de dados, entidade publicadora, link original, data de acesso
        </p>
      </div>
      <div>
        <p className="font-bold">Casos de reutilização</p>
        <p>Consultar exemplos de projetos baseados em dados abertos no portal</p>
      </div>
    </div>
  );
}
