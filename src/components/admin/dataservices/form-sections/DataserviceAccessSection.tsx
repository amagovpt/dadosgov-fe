"use client";

import React from "react";
import {
  InputText,
  RadioButton,
  InputSelect,
  DropdownSection,
  DropdownOption,
} from "@ama-pt/agora-design-system";
import {
  AUDIENCE_ROLES,
  AUDIENCE_CONDITIONS,
  RESTRICTION_REASONS,
} from "@/utils/dataserviceLabels";

interface DataserviceAccessSectionProps {
  accessType: string;
  authRequestUrl: string;
  businessDocUrl: string;
  accessAudiences: Record<string, string>;
  reasonCategory: string;
  reasonText: string;
  onAccessTypeChange: (value: string) => void;
  onAudienceChange: (role: string, value: string) => void;
  onReasonCategoryChange: (value: string) => void;
  onReasonTextChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAuthRequestUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBusinessDocUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function DataserviceAccessSection({
  accessType,
  authRequestUrl,
  businessDocUrl,
  accessAudiences,
  reasonCategory,
  reasonText,
  onAccessTypeChange,
  onAudienceChange,
  onReasonCategoryChange,
  onReasonTextChange,
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

        {accessType === "restricted" && (
          <>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {AUDIENCE_ROLES.map((role) => (
                <InputSelect
                  key={role.role}
                  label={role.label}
                  placeholder="Selecione uma opção"
                  id={`access-audience-${role.role}`}
                  onChange={(options) =>
                    onAudienceChange(role.role, (options[0]?.value as string) || "")
                  }
                >
                  <DropdownSection name={`audience-${role.role}`}>
                    {AUDIENCE_CONDITIONS.map((condition) => (
                      <DropdownOption
                        key={condition.value}
                        value={condition.value}
                        selected={accessAudiences[role.role] === condition.value}
                      >
                        {condition.label}
                      </DropdownOption>
                    ))}
                  </DropdownSection>
                </InputSelect>
              ))}
            </div>

            <InputSelect
              label="Motivo da restrição"
              placeholder="Selecione uma opção"
              id="access-reason-category"
              onChange={(options) =>
                onReasonCategoryChange((options[0]?.value as string) || "")
              }
            >
              <DropdownSection name="reason-category">
                {RESTRICTION_REASONS.map((reason) => (
                  <DropdownOption
                    key={reason.value}
                    value={reason.value}
                    selected={reasonCategory === reason.value}
                  >
                    {reason.label}
                  </DropdownOption>
                ))}
              </DropdownSection>
            </InputSelect>

            {reasonCategory === "other" && (
              <InputText
                label="Especifique o motivo da restrição"
                placeholder="Descreva o motivo"
                id="access-reason-text"
                value={reasonText}
                onChange={onReasonTextChange}
              />
            )}
          </>
        )}

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
