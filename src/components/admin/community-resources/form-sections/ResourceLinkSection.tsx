"use client";

import React from "react";
import { InputText } from "@ama-pt/agora-design-system";

interface ResourceLinkSectionProps {
  resourceUrl: string;
  hasUrlError: boolean;
  onResourceUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ResourceLinkSection({
  resourceUrl,
  hasUrlError,
  onResourceUrlChange,
}: ResourceLinkSectionProps) {
  return (
    <>
      <h2 className="admin-page__section-title">Reutilização</h2>

      <div className="admin-page__fields-group">
        <InputText
          label="Link exato para o ficheiro *"
          placeholder="Insira o link para o ficheiro"
          id="resource-url"
          value={resourceUrl}
          onChange={onResourceUrlChange}
          hasError={hasUrlError}
          hasFeedback={hasUrlError}
          feedbackState="danger"
          errorFeedbackText="Campo obrigatório"
        />
      </div>
    </>
  );
}
