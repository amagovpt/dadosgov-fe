import React from "react";
import { type DropdownSectionProps, Tag } from "@ama-pt/agora-design-system";
import dynamic from "next/dynamic";
import IsolatedInput from "@/components/admin/IsolatedInput";
import IsolatedSelect from "@/components/admin/IsolatedSelect";

const RichTextEditor = dynamic(() => import("@/components/admin/posts/RichTextEditor"), {
  ssr: false,
  loading: () => <p>A carregar editor...</p>,
});

type DatasetsEditDescriptionSectionProps = {
  formErrors: Record<string, boolean>;
  loadedTitle: string;
  loadedAcronym: string;
  description: string;
  loadedKeywords: string;
  selectedKeywords: string[];
  keywordOptions:
    | React.ReactElement<DropdownSectionProps>
    | React.ReactElement<DropdownSectionProps>[];
  keywordsRef: React.MutableRefObject<string>;
  onTitleChange: (value: string) => void;
  onAcronymChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onKeywordSearch: (query: string) => void;
  onKeywordsChange: (value: string) => void;
  onRemoveKeyword: (keyword: string) => void;
};

export default function DatasetsEditDescriptionSection({
  formErrors,
  loadedTitle,
  loadedAcronym,
  description,
  loadedKeywords,
  selectedKeywords,
  keywordOptions,
  keywordsRef,
  onTitleChange,
  onAcronymChange,
  onDescriptionChange,
  onKeywordSearch,
  onKeywordsChange,
  onRemoveKeyword,
}: DatasetsEditDescriptionSectionProps) {
  return (
    <>
      <h2 className="admin-page__section-title admin-page__section-title--no-top">Descrição</h2>
      <div className="admin-page__fields-group">
        <IsolatedInput
          label="Título*"
          placeholder="Insira o título aqui"
          id="edit-title"
          defaultValue={loadedTitle}
          onChange={onTitleChange}
          hasError={!!formErrors.title}
          hasFeedback={!!formErrors.title}
          feedbackState="danger"
          errorFeedbackText="Campo obrigatório"
        />
        <IsolatedInput
          label="Sigla"
          placeholder="Insira a sigla aqui"
          id="edit-acronym"
          defaultValue={loadedAcronym}
          onChange={onAcronymChange}
        />
        <div className="flex flex-col gap-8">
          <span className="text-primary-900 text-base font-medium leading-7">Descrição *</span>
          <RichTextEditor content={description} onChange={onDescriptionChange} />
          {formErrors.description && <span className="text-danger-600 text-sm">Campo obrigatório</span>}
        </div>
        <IsolatedSelect
          label="Palavras-chave"
          placeholder="Pesquise ou insira palavras-chave..."
          id="edit-keywords"
          type="checkbox"
          searchable
          searchInputPlaceholder="Escreva para pesquisar ou criar..."
          searchNoResultsText="Nenhum resultado encontrado"
          defaultValue={loadedKeywords}
          onChangeRef={keywordsRef}
          onSearchCallback={onKeywordSearch}
          onChangeCallback={onKeywordsChange}
        >
          {keywordOptions}
        </IsolatedSelect>

        {selectedKeywords.length > 0 && (
          <div className="flex flex-wrap gap-8 -mt-8">
            {selectedKeywords.map((keyword) => (
              <Tag
                key={keyword}
                aria-label={`Remover ${keyword}`}
                onClick={() => {
                  onRemoveKeyword(keyword);
                }}
              >
                {keyword}
              </Tag>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
