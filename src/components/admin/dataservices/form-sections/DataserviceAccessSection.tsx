"use client";

import React from "react";
import { InputText, RadioButton } from "@ama-pt/agora-design-system";

interface DataserviceAccessSectionProps {
  accessType: string;
  authRequestUrl: string;
  businessDocUrl: string;
  onAccessTypeChange: (value: string) => void;
  onAuthRequestUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBusinessDocUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function DataserviceAccessSection({
  accessType,
  authRequestUrl,
  businessDocUrl,
  onAccessTypeChange,
  onAuthRequestUrlChange,
  onBusinessDocUrlChange,
}: DataserviceAccessSectionProps) {
  return (
    <>
      <h2 className="admin-page__section-title">Acesso</h2>

      <div className="admin-page__fields-group">
        <div className="flex flex-col gap-8">
          <span className="text-primary-900 text-base font-medium leading-7">
            Tipo de acesso
          </span>
          <div className="flex flex-row gap-4">
            <RadioButton
              label="Aberto"
              id="access-open"
              name="access-type"
              checked={accessType === "open"}
              onChange={() => onAccessTypeChange("open")}
            />
            <RadioButton
              label="Aberto com conta"
              id="access-account"
              name="access-type"
              checked={accessType === "open_with_account"}
              onChange={() => onAccessTypeChange("open_with_account")}
            />
            <RadioButton
              label="Restrito"
              id="access-restricted"
              name="access-type"
              checked={accessType === "restricted"}
              onChange={() => onAccessTypeChange("restricted")}
            />
          </div>
        </div>
        <InputText
          label="Link para a ferramenta de autorização de acesso"
          placeholder="Insira o URL aqui"
          id="api-auth-tool"
          value={authRequestUrl}
          onChange={onAuthRequestUrlChange}
        />
        <InputText
          label="Link para a documentação funcional"
          placeholder="Insira o URL aqui"
          id="api-doc-commercial"
          value={businessDocUrl}
          onChange={onBusinessDocUrlChange}
        />
      </div>
    </>
  );
}
