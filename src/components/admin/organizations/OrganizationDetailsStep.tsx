"use client";

import React from "react";
import { Button, InputText, InputTextArea, StatusCard } from "@ama-pt/agora-design-system";
import ImageUploadField from "@/components/admin/forms/ImageUploadField";

interface OrganizationDetailsStepProps {
  orgName: string;
  orgAcronym: string;
  orgDescription: string;
  orgWebsite: string;
  orgLogoError: string | null;
  orgLogoPreview: string | null;
  isSubmitting: boolean;
  hasNameError: boolean;
  hasDescriptionError: boolean;
  onNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAcronymChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onWebsiteChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLogoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLogoSecurityError: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
}

export default function OrganizationDetailsStep({
  orgName,
  orgAcronym,
  orgDescription,
  orgWebsite,
  orgLogoError,
  orgLogoPreview,
  isSubmitting,
  hasNameError,
  hasDescriptionError,
  onNameChange,
  onAcronymChange,
  onDescriptionChange,
  onWebsiteChange,
  onLogoChange,
  onLogoSecurityError,
  onPrevious,
  onSubmit,
}: OrganizationDetailsStepProps) {
  return (
    <>
      <StatusCard
        variant="informative"
        showIcon
        description={
          <>
            <strong>O que é uma organização?</strong>
            <br />
            Uma organização é uma entidade na qual muitos utilizadores podem colaborar. Conjuntos
            de dados publicados sob a égide da organização podem ser editados pelos seus membros.
          </>
        }
      />

      <form
        className="admin-page__form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <p className="pt-32 text-base leading-7 text-neutral-900">
          Os campos marcados com um asterisco ( * ) são obrigatórios.
        </p>

        <h2 className="admin-page__section-title">Descrição</h2>

        <div className="admin-page__fields-group">
          <InputText
            label="Nome *"
            placeholder="Insira o nome aqui"
            id="org-name"
            value={orgName}
            onChange={onNameChange}
            hasError={hasNameError}
            hasFeedback={hasNameError}
            feedbackState="danger"
            errorFeedbackText="Campo obrigatório"
          />

          <InputText
            label="Sigla"
            placeholder="Insira a sigla aqui"
            id="org-acronym"
            value={orgAcronym}
            onChange={onAcronymChange}
          />

          <InputTextArea
            label="Descrição *"
            placeholder="Insira a descrição aqui"
            id="org-description"
            rows={6}
            value={orgDescription}
            onChange={onDescriptionChange}
            hasError={hasDescriptionError}
            hasFeedback={hasDescriptionError}
            feedbackState="danger"
            errorFeedbackText="Campo obrigatório"
          />

          <InputText
            label="Website"
            placeholder="Insira o URL aqui"
            id="org-website"
            value={orgWebsite}
            onChange={onWebsiteChange}
          />
        </div>

        <h2 className="admin-page__section-title">Logotipo</h2>

        <div className="admin-page__fields-group">
          <ImageUploadField
            label="Ficheiro"
            onChange={onLogoChange}
            onSecurityError={onLogoSecurityError}
            error={orgLogoError}
            previewSrc={orgLogoPreview || undefined}
            previewAlt="Pré-visualização do logotipo"
            previewLabel="Pré-visualização:"
            previewWrapperClassName="mt-12"
            previewImageClassName="max-h-[120px] max-w-[240px] rounded-8 border border-neutral-200 object-contain p-8"
            uploaderWrapperClassName="[&_.drag-and-drop-area_.agora-btn]:w-fit [&_.instructions]:items-center [&_.instructions]:text-center"
          />
        </div>

        <div className="admin-page__actions">
          <Button type="button" appearance="outline" variant="neutral" onClick={onPrevious}>
            Anterior
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            Criar a organização
          </Button>
        </div>
      </form>
    </>
  );
}
