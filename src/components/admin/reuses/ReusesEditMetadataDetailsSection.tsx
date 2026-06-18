import React from "react";
import {
  DropdownOption,
  type DropdownSectionProps,
  DropdownSection,
  Switch,
  Tag,
} from "@ama-pt/agora-design-system";
import DragAndDropUploader from "@/components/Primitives/DragAndDropUploader/DragAndDropUploader";
import IsolatedInput from "@/components/admin/IsolatedInput";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import IsolatedTextArea from "@/components/admin/IsolatedTextArea";
import { localizeReuseTopic, localizeReuseType } from "@/lib/reuse-labels";
import type { Reuse, ReuseTopic, ReuseType } from "@/service/types/reuse";

type ReusesEditMetadataDetailsSectionProps = {
  reuse: Reuse;
  featured: boolean;
  title: string;
  url: string;
  description: string;
  selectedType: string;
  selectedTopic: string;
  selectedTypeRef: React.MutableRefObject<string>;
  selectedTopicRef: React.MutableRefObject<string>;
  selectedKeywordsRef: React.MutableRefObject<string>;
  selectedKeywordsValue: string;
  selectedKeywords: string[];
  keywordOptions:
    | React.ReactElement<DropdownSectionProps>
    | React.ReactElement<DropdownSectionProps>[];
  imageError: string | null;
  formErrors: Record<string, boolean>;
  reuseTypes: ReuseType[];
  reuseTopics: ReuseTopic[];
  onToggleFeatured: () => void;
  onTitleChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onTopicChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onKeywordSearchChange: (value: string) => void;
  onKeywordsChange: (value: string) => void;
  onRemoveKeyword: (keyword: string) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageSecurityError: () => void;
};

export default function ReusesEditMetadataDetailsSection({
  reuse,
  featured,
  title,
  url,
  description,
  selectedType,
  selectedTopic,
  selectedTypeRef,
  selectedTopicRef,
  selectedKeywordsRef,
  selectedKeywordsValue,
  selectedKeywords,
  keywordOptions,
  imageError,
  formErrors,
  reuseTypes,
  reuseTopics,
  onToggleFeatured,
  onTitleChange,
  onUrlChange,
  onTypeChange,
  onTopicChange,
  onDescriptionChange,
  onKeywordSearchChange,
  onKeywordsChange,
  onRemoveKeyword,
  onImageUpload,
  onImageSecurityError,
}: ReusesEditMetadataDetailsSectionProps) {
  return (
    <>
      <h2 className="admin-page__section-title">Destaque</h2>
      <div className="admin-page__fields-group">
        <Switch label="Destaque" checked={featured} onChange={onToggleFeatured} />
      </div>

      <h2 className="admin-page__section-title">Descrição</h2>
      <div className="admin-page__fields-group">
        <IsolatedInput
          label="Nome da reutilização *"
          placeholder="Insira o nome aqui"
          id="edit-title"
          defaultValue={title}
          onChange={onTitleChange}
          hasError={!!formErrors.title}
          hasFeedback={!!formErrors.title}
          feedbackState="danger"
          errorFeedbackText="Campo obrigatório"
        />
        <IsolatedInput
          label="URL *"
          placeholder="Insira o URL aqui (ex: https://...)"
          id="edit-url"
          defaultValue={url}
          onChange={onUrlChange}
          hasError={!!formErrors.url}
          hasFeedback={!!formErrors.url}
          feedbackState="danger"
          errorFeedbackText="Campo obrigatório"
        />
        <IsolatedSelect
          label="Tipo *"
          placeholder="Selecione um tipo..."
          id="edit-type"
          searchable
          searchInputPlaceholder="Escreva para pesquisar..."
          searchNoResultsText="Nenhum resultado encontrado"
          onChangeRef={selectedTypeRef}
          defaultValue={selectedType}
          onChangeCallback={(value) => onTypeChange(value || "")}
        >
          <DropdownSection name="types">
            {reuseTypes.map((typeOption) => (
              <DropdownOption
                key={typeOption.id}
                value={typeOption.id}
                selected={typeOption.id === selectedType}
              >
                {localizeReuseType(typeOption)}
              </DropdownOption>
            ))}
          </DropdownSection>
        </IsolatedSelect>
        <IsolatedSelect
          label="Tema *"
          placeholder="Selecione um tema..."
          id="edit-topic"
          searchable
          searchInputPlaceholder="Escreva para pesquisar..."
          searchNoResultsText="Nenhum resultado encontrado"
          onChangeRef={selectedTopicRef}
          defaultValue={selectedTopic}
          onChangeCallback={(value) => onTopicChange(value || "")}
        >
          <DropdownSection name="topics">
            {reuseTopics.map((topicOption) => (
              <DropdownOption
                key={topicOption.id}
                value={topicOption.id}
                selected={topicOption.id === selectedTopic}
              >
                {localizeReuseTopic(topicOption)}
              </DropdownOption>
            ))}
          </DropdownSection>
        </IsolatedSelect>
        <IsolatedTextArea
          label="Descrição *"
          placeholder="Insira a descrição aqui"
          id="edit-description"
          rows={6}
          maxLength={246}
          showCharCounter
          defaultValue={description}
          onChange={onDescriptionChange}
          hasError={formErrors.description ? true : undefined}
          hasFeedback={formErrors.description ? true : undefined}
          feedbackState="danger"
          feedbackText="Campo obrigatório"
          errorFeedbackText="Campo obrigatório"
        />
        <IsolatedSelect
          label="Palavras-chave"
          placeholder="Pesquise ou insira palavras-chave..."
          id="edit-keywords"
          type="checkbox"
          searchable
          searchInputPlaceholder="Escreva para pesquisar ou criar..."
          searchNoResultsText="Nenhum resultado encontrado"
          defaultValue={selectedKeywordsValue}
          onChangeRef={selectedKeywordsRef}
          onSearchCallback={onKeywordSearchChange}
          onChangeCallback={onKeywordsChange}
        >
          {keywordOptions}
        </IsolatedSelect>

        {selectedKeywords.length > 0 && (
          <div className="flex flex-wrap gap-8 -mt-8">
            {[...selectedKeywords]
              .sort((left, right) => left.localeCompare(right))
              .map((keyword) => (
                <Tag
                  key={keyword}
                  aria-label={`Remover ${keyword}`}
                  onClick={() => onRemoveKeyword(keyword)}
                >
                  {keyword}
                </Tag>
              ))}
          </div>
        )}

        <div>
          <span className="text-primary-900 text-base font-medium leading-7">Imagem de capa *</span>
          {(reuse.image_thumbnail || reuse.image) && (
            <div className="mt-2 mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={reuse.image_thumbnail || reuse.image || ""}
                alt="Imagem de capa atual"
                className="rounded border border-neutral-200 max-h-[180px] object-cover"
              />
            </div>
          )}
          <div className="mt-2 [&_.instructions]:items-center [&_.instructions]:text-center [&_.drag-and-drop-area_.agora-btn]:w-fit">
            <DragAndDropUploader
              label="Ficheiros"
              dragAndDropLabel="Arraste e largue o ficheiro aqui"
              inputLabel="Selecione ou arraste o ficheiro"
              selectedFilesLabel="ficheiro selecionado"
              removeFileButtonLabel="Remover ficheiro"
              replaceFileButtonLabel="Substituir ficheiro"
              extensionsInstructions="Tamanho máximo: 4 MB. Formatos aceites: JPG, JPEG, PNG."
              accept=".jpg,.jpeg,.png"
              maxSize={4194304}
              maxCount={1}
              maxSizeExceededErrorLabel="O ficheiro excede o tamanho máximo de 4 MB."
              forbiddenExtensionErrorLabel="Formato de ficheiro não permitido."
              hasError={!!imageError}
              hasFeedback={!!imageError}
              feedbackState="danger"
              feedbackText={imageError ?? undefined}
              onChange={onImageUpload}
              onSecurityError={onImageSecurityError}
            />
          </div>
        </div>
      </div>
    </>
  );
}
