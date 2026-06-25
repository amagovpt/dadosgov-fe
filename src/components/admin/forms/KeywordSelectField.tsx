"use client";

import React, { useMemo } from "react";
import { Tag, type DropdownSectionProps } from "@ama-pt/agora-design-system";
import IsolatedSelect from "@/components/admin/IsolatedSelect";

type KeywordSelectFieldProps = {
  id: string;
  selectedKeywords: string[];
  keywordOptions:
    | React.ReactElement<DropdownSectionProps>
    | React.ReactElement<DropdownSectionProps>[];
  selectedKeywordsRef: React.RefObject<string>;
  defaultValue: string;
  onSearchChange: (value: string) => void;
  onChange: (value: string) => void;
  onRemoveKeyword: (keyword: string) => void;
  hideSectionNames?: boolean;
  sortSelectedKeywords?: boolean;
};

export default function KeywordSelectField({
  id,
  selectedKeywords,
  keywordOptions,
  selectedKeywordsRef,
  defaultValue,
  onSearchChange,
  onChange,
  onRemoveKeyword,
  hideSectionNames = false,
  sortSelectedKeywords = false,
}: KeywordSelectFieldProps) {
  const visibleKeywords = useMemo(() => {
    if (!sortSelectedKeywords) {
      return selectedKeywords;
    }
    return [...selectedKeywords].sort((left, right) => left.localeCompare(right));
  }, [selectedKeywords, sortSelectedKeywords]);

  return (
    <>
      <IsolatedSelect
        label="Palavras-chave"
        placeholder="Pesquise ou insira palavras-chave..."
        id={id}
        type="checkbox"
        hideSectionNames={hideSectionNames}
        searchable
        searchInputPlaceholder="Escreva para pesquisar ou criar..."
        searchNoResultsText="Nenhum resultado encontrado"
        defaultValue={defaultValue}
        onChangeRef={selectedKeywordsRef}
        onSearchCallback={onSearchChange}
        onChangeCallback={onChange}
      >
        {keywordOptions}
      </IsolatedSelect>

      {visibleKeywords.length > 0 && (
        <div className="flex flex-wrap gap-8 -mt-8">
          {visibleKeywords.map((keyword) => (
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
    </>
  );
}
