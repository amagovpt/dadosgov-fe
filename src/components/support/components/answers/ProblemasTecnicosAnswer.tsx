"use client";

import { FaqLink } from "../FaqLink";

export function ProblemasTecnicosAnswer() {
  return (
    <div className="space-y-16">
      <div>
        <p className="font-bold">
          Erros de login / publicação / upload / pesquisa / comentários
        </p>
        <p>
          Contactar a equipa do dados.gov.pt na página de{" "}
          <FaqLink href="/pages/support">Suporte</FaqLink>
        </p>
      </div>
      <div>
        <p className="font-bold">Página ou funcionalidade indisponível</p>
        <p>
          Contactar a equipa do dados.gov.pt na página de{" "}
          <FaqLink href="/pages/support">suporte</FaqLink> escolhendo &ldquo;Reportar um
          problema&rdquo;.
        </p>
      </div>
    </div>
  );
}
