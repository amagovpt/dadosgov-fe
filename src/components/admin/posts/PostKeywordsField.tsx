"use client";

import React from "react";
import { Tag } from "@ama-pt/agora-design-system";
import IsolatedSelect from "@/components/admin/IsolatedSelect";

interface PostKeywordsFieldProps {
  selectedTags: string[];
  keywordOptions: React.JSX.Element;
  selectedKeywordsRef: React.RefObject<string>;
  onSearchChange: (value: string) => void;
  onChange: (value: string) => void;
  onRemoveTag: (tag: string) => void;
}

export default function PostKeywordsField({
  selectedTags,
  keywordOptions,
  selectedKeywordsRef,
  onSearchChange,
  onChange,
  onRemoveTag,
}: PostKeywordsFieldProps) {
  return (
    <>
      <IsolatedSelect
        label="Palavras-chave"
        placeholder="Pesquise ou insira palavras-chave..."
        id="article-keywords"
        type="checkbox"
        hideSectionNames
        searchable
        searchInputPlaceholder="Escreva para pesquisar ou criar..."
        searchNoResultsText="Nenhum resultado encontrado"
        defaultValue={selectedTags.join(",")}
        onChangeRef={selectedKeywordsRef}
        onSearchCallback={onSearchChange}
        onChangeCallback={onChange}
      >
        {keywordOptions}
      </IsolatedSelect>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-8 -mt-8">
          {selectedTags.map((keyword) => (
            <Tag
              key={keyword}
              aria-label={`Remover ${keyword}`}
              onClick={() => onRemoveTag(keyword)}
            >
              {keyword}
            </Tag>
          ))}
        </div>
      )}
    </>
  );
}
