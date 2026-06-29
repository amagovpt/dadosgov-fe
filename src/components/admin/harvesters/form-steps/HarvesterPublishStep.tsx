"use client";

import React from "react";
import { Button, StatusCard } from "@ama-pt/agora-design-system";
import PublicationFeedbackButton from "@/components/admin/PublicationFeedbackButton";

interface HarvesterPublishStepProps {
  createError: string | null;
  onViewInAdmin: () => void;
  onRequestValidation: () => void;
}

export default function HarvesterPublishStep({
  createError,
  onViewInAdmin,
  onRequestValidation,
}: HarvesterPublishStepProps) {
  return (
    <div className="admin-page__form">
      {createError && (
        <StatusCard
          variant="danger"
          showIcon
          description={
            <>
              <strong>Erro ao criar o harvester</strong>
              <br />
              {createError}
            </>
          }
        />
      )}

      {!createError && (
        <StatusCard
          variant="warning"
          showIcon
          description={
            <>
              <strong>
                O seu harvester foi criado e está a aguardar validação pela equipa de
                administração.
              </strong>
              <br />
              Informe-nos através do formulário de contacto abaixo se deseja que validemos o seu
              harvester. Será notificado da aprovação (ou rejeição).
            </>
          }
        />
      )}

      <div className="mt-16 flex justify-start">
        <PublicationFeedbackButton />
      </div>

      <div className="admin-page__actions">
        <Button appearance="outline" variant="neutral" onClick={onViewInAdmin}>
          Ver na administração
        </Button>
        <Button
          appearance="outline"
          variant="neutral"
          hasIcon
          trailingIcon="agora-line-external-link"
          trailingIconHover="agora-solid-external-link"
          onClick={onRequestValidation}
        >
          Solicitar validação do harvester
        </Button>
      </div>
    </div>
  );
}
