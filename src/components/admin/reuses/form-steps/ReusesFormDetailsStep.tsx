"use client";

import type { ChangeEvent, MutableRefObject, ReactElement } from "react";
import {
  Button,
  type DropdownSectionProps,
  InputText,
  InputTextArea,
  StatusCard,
} from "@ama-pt/agora-design-system";
import ImageUploadField from "@/components/admin/forms/ImageUploadField";
import KeywordSelectField from "@/components/admin/forms/KeywordSelectField";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import AppIcon from "@/components/Primitives/AppIcon";

interface ReusesFormDetailsStepProps {
  apiError: string | null;
  hasOrganization: boolean;
  selectedProducerRef: MutableRefObject<string>;
  selectedProducerValue: string;
  producerOptions:
    | ReactElement<DropdownSectionProps>
    | ReactElement<DropdownSectionProps>[];
  onProducerChange: (value: string | null) => void;
  reuseName: string;
  reuseLink: string;
  reuseLinkInvalid: boolean;
  reuseDescription: string;
  formErrors: Partial<Record<string, boolean | string>>;
  onReuseNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onReuseLinkChange: (event: ChangeEvent<HTMLInputElement>) => void;
  selectedReuseTypeRef: MutableRefObject<string>;
  typeOptions:
    | ReactElement<DropdownSectionProps>
    | ReactElement<DropdownSectionProps>[];
  selectedReuseTypeValue: string;
  onReuseTypeChange: (value: string | null) => void;
  selectedReuseTopicRef: MutableRefObject<string>;
  topicOptions:
    | ReactElement<DropdownSectionProps>
    | ReactElement<DropdownSectionProps>[];
  selectedReuseTopicValue: string;
  onReuseTopicChange: (value: string | null) => void;
  onReuseDescriptionChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  selectedKeywordsRef: MutableRefObject<string>;
  keywordsChildren:
    | ReactElement<DropdownSectionProps>
    | ReactElement<DropdownSectionProps>[];
  selectedKeywordsValue: string;
  onKeywordSearch: (value: string) => void;
  onKeywordChange: (value: string) => void;
  onKeywordRemove: (keyword: string) => void;
  reuseCoverImageFile: File | null;
  onReuseCoverImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onReuseCoverImageSecurityError: () => void;
  onPreviousStep: () => void;
  onNextStep: () => void;
  isSubmitting: boolean;
}

export default function ReusesFormDetailsStep({
  apiError,
  hasOrganization,
  selectedProducerRef,
  selectedProducerValue,
  producerOptions,
  onProducerChange,
  reuseName,
  reuseLink,
  reuseLinkInvalid,
  reuseDescription,
  formErrors,
  onReuseNameChange,
  onReuseLinkChange,
  selectedReuseTypeRef,
  typeOptions,
  selectedReuseTypeValue,
  onReuseTypeChange,
  selectedReuseTopicRef,
  topicOptions,
  selectedReuseTopicValue,
  onReuseTopicChange,
  onReuseDescriptionChange,
  selectedKeywordsRef,
  keywordsChildren,
  selectedKeywordsValue,
  onKeywordSearch,
  onKeywordChange,
  onKeywordRemove,
  reuseCoverImageFile,
  onReuseCoverImageChange,
  onReuseCoverImageSecurityError,
  onPreviousStep,
  onNextStep,
  isSubmitting,
}: ReusesFormDetailsStepProps) {
  return (
    <>
      <StatusCard
        variant="informative"
        showIcon
        description={
          <>
            <strong>O que é reutilização?</strong>
            <br />
            Uma reutilização mostra de que forma os dados públicos podem ser utilizados. Ao
            publicar a sua reutilização, aumenta a visibilidade do seu trabalho e pode
            estabelecer contacto direto com a entidade que produz o conjunto de dados.
          </>
        }
      />

      {apiError && (
        <div className="mt-32 mb-16">
          <StatusCard variant="danger" showIcon description={apiError} />
        </div>
      )}

      <form
        className="admin-page__form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onNextStep();
        }}
      >
        <p className="pt-32 text-base leading-7 text-neutral-900">
          Os campos marcados com um asterisco ( * ) são obrigatórios.
        </p>
        <h2 className="admin-page__section-title">Produtor</h2>

        <IsolatedSelect
          label="Confirme a identidade que pretende utilizar na publicação."
          placeholder="Selecione o produtor..."
          id="producer-identity"
          onChangeRef={selectedProducerRef}
          defaultValue={selectedProducerValue}
          onChangeCallback={onProducerChange}
        >
          {producerOptions}
        </IsolatedSelect>

        {!hasOrganization && (
          <div className="admin-page__org-card">
            <p className="admin-page__org-card-title">Não pertence a uma organização.</p>
            <p className="admin-page__org-card-description">
              Quando a reutilização for produzida no contexto de atividade profissional, é
              recomendável que seja publicada em nome da organização responsável.
            </p>
            <a href="/admin/organizations/new" className="admin-page__org-card-link">
              Crie ou integre uma organização em dados.gov.pt
              <AppIcon name="agora-line-arrow-right-circle" className="h-24 w-24" />
            </a>
          </div>
        )}

        <h2 className="admin-page__section-title">Descrição</h2>

        <div className="admin-page__fields-group">
          <InputText
            label="Nome da reutilização *"
            placeholder="Insira o nome aqui"
            id="reuse-title"
            value={reuseName}
            onChange={onReuseNameChange}
            hasError={!!formErrors.reuseName}
            hasFeedback={!!formErrors.reuseName}
            feedbackState="danger"
            errorFeedbackText="Campo obrigatório"
          />
          <InputText
            label="Reutilização *"
            placeholder="Insira o URL aqui (ex: https://...)"
            id="reuse-link"
            value={reuseLink}
            onChange={onReuseLinkChange}
            hasError={!!formErrors.reuseLink || reuseLinkInvalid}
            hasFeedback={!!formErrors.reuseLink || reuseLinkInvalid}
            feedbackState="danger"
            errorFeedbackText={reuseLinkInvalid ? "URL inválido" : "Campo obrigatório"}
          />
          {reuseLinkInvalid && (
            <div className="mt-8">
              <StatusCard
                variant="danger"
                showIcon
                description="O URL inserido é inválido. Por favor, insira um endereço válido (ex: https://exemplo.pt)."
              />
            </div>
          )}
          <IsolatedSelect
            label="Tipo *"
            placeholder="Selecione um tipo..."
            id="reuse-type"
            searchable
            searchInputPlaceholder="Escreva para pesquisar..."
            searchNoResultsText="Nenhum resultado encontrado"
            onChangeRef={selectedReuseTypeRef}
            defaultValue={selectedReuseTypeValue}
            onChangeCallback={onReuseTypeChange}
            hasError={!!formErrors.reuseType}
            errorFeedbackText="Campo obrigatório"
          >
            {typeOptions}
          </IsolatedSelect>
          <IsolatedSelect
            label="Tema *"
            placeholder="Selecione um tema..."
            id="reuse-theme"
            searchable
            searchInputPlaceholder="Escreva para pesquisar..."
            searchNoResultsText="Nenhum resultado encontrado"
            onChangeRef={selectedReuseTopicRef}
            defaultValue={selectedReuseTopicValue}
            onChangeCallback={onReuseTopicChange}
            hasError={!!formErrors.reuseTopic}
            errorFeedbackText="Campo obrigatório"
          >
            {topicOptions}
          </IsolatedSelect>
          <InputTextArea
            label="Descrição *"
            placeholder="Insira a descrição aqui"
            id="reuse-description"
            rows={4}
            maxLength={3000}
            showCharCounter
            value={reuseDescription}
            onChange={onReuseDescriptionChange}
            hasError={!!formErrors.reuseDescription}
            hasFeedback={!!formErrors.reuseDescription}
            feedbackState="danger"
            errorFeedbackText="Campo obrigatório"
          />
          <KeywordSelectField
            id="reuse-keywords"
            selectedKeywords={selectedKeywordsValue
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean)}
            keywordOptions={keywordsChildren}
            selectedKeywordsRef={selectedKeywordsRef}
            defaultValue={selectedKeywordsValue}
            onSearchChange={onKeywordSearch}
            onChange={onKeywordChange}
            onRemoveKeyword={onKeywordRemove}
            sortSelectedKeywords
          />

          <ImageUploadField
            label="Imagem de capa"
            files={reuseCoverImageFile ? [reuseCoverImageFile] : undefined}
            onChange={onReuseCoverImageChange}
            onSecurityError={onReuseCoverImageSecurityError}
            dragAndDropLabel="Arraste e largue a imagem aqui"
            inputLabel="Selecionar ficheiro"
          />
        </div>

        <div className="admin-page__actions flex justify-between gap-[18px]">
          <Button
            type="button"
            variant="primary"
            appearance="outline"
            hasIcon
            leadingIcon="agora-line-arrow-left-circle"
            leadingIconHover="agora-solid-arrow-left-circle"
            onClick={onPreviousStep}
          >
            Anterior
          </Button>
          <Button
            type="submit"
            variant="primary"
            hasIcon
            trailingIcon="agora-line-arrow-right-circle"
            trailingIconHover="agora-solid-arrow-right-circle"
            disabled={isSubmitting || reuseLinkInvalid}
          >
            {isSubmitting ? "A criar..." : "Seguinte"}
          </Button>
        </div>
      </form>
    </>
  );
}
