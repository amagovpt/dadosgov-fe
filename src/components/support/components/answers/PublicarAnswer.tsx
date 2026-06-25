"use client";

import { FaqLink } from "../FaqLink";

export function PublicarAnswer() {
  return (
    <div className="space-y-16">
      <div>
        <p className="font-bold">Informação oficial sobre publicação</p>
        <p>Página &ldquo;Publicar Dados&rdquo; no portal:</p>
        <p>
          Como publicar dados — explicação passo-a-passo no portal{" "}
          <FaqLink href="/pages/faqs/publish">Como publicar dados</FaqLink>
        </p>
      </div>
      <div>
        <p className="font-bold">Tópicos incluídos:</p>
        <p>Quem pode publicar (AP e outros participantes)</p>
        <p>Criar conta / associar organização</p>
        <p>Carregar conjunto de dados ou referenciar URL</p>
        <p>Usar API ou harvester</p>
        <p>Certificação de fornecedores oficiais</p>
      </div>
      <div>
        <p className="font-bold">Tornar-me publicador</p>
        <p>1. Criar conta no portal</p>
        <p>2. Associar-se à organização</p>
        <p>3. Aguardar validação</p>
      </div>
      <div>
        <p className="font-bold">Atualizar um conjunto de dados</p>
        <p>
          Pode editar o conjunto de dados e substituir ou acrescentar recursos a qualquer momento
        </p>
      </div>
      <div>
        <p className="font-bold">Dados pessoais ou sensíveis</p>
        <p>Apenas dados anonimizados podem ser publicados.</p>
        <p>Para questões sobre proteção de dados:</p>
        <p>
          <FaqLink href="https://www.cnpd.pt">Comissão Nacional de Proteção de Dados</FaqLink>
        </p>
      </div>
    </div>
  );
}
