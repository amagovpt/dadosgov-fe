"use client";

import React from "react";
import {
  Accordion,
  AccordionGroup,
  Button,
  Checkbox,
  InputText,
  InputTextArea,
  StatusCard,
} from "@ama-pt/agora-design-system";
import DragAndDropUploader from "@/components/Primitives/DragAndDropUploader/DragAndDropUploader";
import type { OrgBadges } from "@/service/types/identity";

interface OrganizationProfileFormSectionProps {
  name: string;
  acronym: string;
  description: string;
  url: string;
  availableBadges: OrgBadges;
  selectedBadgeKinds: string[];
  canEdit: boolean;
  isSaving: boolean;
  nameError: boolean;
  descriptionError: boolean;
  logoError: string | null;
  saveStatus: "success" | "error" | null;
  onNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAcronymChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBadgeToggle: (kind: string, checked: boolean) => void;
  onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLogoSecurityError: () => void;
  onSave: () => void;
}

export default function OrganizationProfileFormSection({
  name,
  acronym,
  description,
  url,
  availableBadges,
  selectedBadgeKinds,
  canEdit,
  isSaving,
  nameError,
  descriptionError,
  logoError,
  saveStatus,
  onNameChange,
  onAcronymChange,
  onDescriptionChange,
  onUrlChange,
  onBadgeToggle,
  onLogoUpload,
  onLogoSecurityError,
  onSave,
}: OrganizationProfileFormSectionProps) {
  return (
    <div className="admin-page__form">
      <h2 className="admin-page__section-title hidden">EDITAR ORGANIZAÇÃO</h2>

      <div className="admin-page__fields-group pt-32">
        {saveStatus && (
          <StatusCard
            variant={saveStatus === "success" ? "success" : "danger"}
            showIcon
            description={
              saveStatus === "success"
                ? "Perfil da organização atualizado com sucesso."
                : "Ocorreu um erro ao guardar. Por favor, tente novamente."
            }
          />
        )}

        <InputText
          label="Nome *"
          placeholder="Insira o nome aqui"
          id="org-name"
          value={name}
          onChange={onNameChange}
          hasError={nameError}
          hasFeedback={nameError}
          feedbackState="danger"
          errorFeedbackText="Campo obrigatório"
          readOnly={!canEdit}
          disabled={!canEdit}
        />

        <InputText
          label="Sigla"
          placeholder="Insira a sigla aqui"
          id="org-acronym"
          value={acronym}
          onChange={onAcronymChange}
          readOnly={!canEdit}
          disabled={!canEdit}
        />

        <InputTextArea
          label="Descrição *"
          placeholder="Insira a descrição aqui"
          id="org-description"
          rows={4}
          value={description}
          onChange={onDescriptionChange}
          hasError={descriptionError}
          hasFeedback={descriptionError}
          feedbackState="danger"
          errorFeedbackText="Campo obrigatório"
          readOnly={!canEdit}
          disabled={!canEdit}
        />

        <InputText
          label="Website"
          placeholder="Insira o URL aqui"
          id="org-url"
          value={url}
          onChange={onUrlChange}
          readOnly={!canEdit}
          disabled={!canEdit}
        />

        {Object.keys(availableBadges).length > 0 && (
          <AccordionGroup>
            <Accordion headingTitle="Emblemas" headingLevel="h3">
              <div className="flex flex-col gap-8 p-16">
                {Object.entries(availableBadges).map(([kind, label]) => (
                  <Checkbox
                    key={kind}
                    id={`org-badge-${kind}`}
                    label={label}
                    value={kind}
                    name={`org-badge-${kind}`}
                    required={false}
                    checked={selectedBadgeKinds.includes(kind)}
                    disabled={isSaving}
                    onChange={(event) => onBadgeToggle(kind, event.target.checked)}
                  />
                ))}
              </div>
            </Accordion>
          </AccordionGroup>
        )}

        {canEdit && (
          <div>
            <span className="text-base font-medium leading-7 text-primary-900">Logotipo</span>
            <div className="mt-2 [&_.drag-and-drop-area_.agora-btn]:w-fit [&_.instructions]:items-center [&_.instructions]:text-center">
              <DragAndDropUploader
                label="Ficheiro"
                dragAndDropLabel="Arraste e largue o ficheiro aqui"
                inputLabel="Selecione ou arraste o ficheiro"
                selectedFilesLabel="ficheiro selecionado"
                removeFileButtonLabel="Remover ficheiro"
                replaceFileButtonLabel="Substituir ficheiro"
                extensionsInstructions="Tamanho máximo: 500 KB. Formatos aceites: JPG, JPEG, PNG."
                accept=".jpg,.jpeg,.png"
                maxSize={512000}
                maxCount={1}
                maxSizeExceededErrorLabel="O ficheiro excede o tamanho máximo de 500 KB."
                forbiddenExtensionErrorLabel="Formato de ficheiro não permitido."
                hasError={!!logoError}
                hasFeedback={!!logoError}
                feedbackState="danger"
                feedbackText={logoError ?? undefined}
                onChange={onLogoUpload}
                onSecurityError={onLogoSecurityError}
              />
            </div>
          </div>
        )}

        {canEdit && (
          <div className="mt-16 flex justify-end">
            <Button
              variant="primary"
              hasIcon
              trailingIcon="agora-line-check-circle"
              trailingIconHover="agora-solid-check-circle"
              onClick={onSave}
              disabled={isSaving}
            >
              {isSaving ? "A guardar..." : "Guardar"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
