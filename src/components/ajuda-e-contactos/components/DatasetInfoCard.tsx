"use client";

import { StatusCard } from "@ama-pt/agora-design-system";

export function DatasetInfoCard() {
  return (
    <div className="mt-32 max-w-2xl">
      <StatusCard
        variant="informative"
        showIcon
        description={
          <>
            Para questões relacionadas com um conjunto de dados específico, como pedidos de
            atualização, esclarecimentos sobre conteúdo, formatos, periodicidade, qualidade dos
            dados ou disponibilização de informação adicional, utilize a área de
            discussão/comentários na página do respetivo conjunto de dados.
            <br />A resposta é da responsabilidade da entidade publicadora.
          </>
        }
      />
    </div>
  );
}
