import React from "react";
import { useTranslation } from "react-i18next";
import { type DropdownSectionProps } from "@ama-pt/agora-design-system";
import dynamic from "next/dynamic";
import IsolatedInput from "@/components/admin/IsolatedInput";
import KeywordSelectField from "@/components/admin/forms/KeywordSelectField";

const RichTextEditor = dynamic(() => import("@/components/admin/posts/form-ui/RichTextEditor"), {
  ssr: false,
  loading: () => <p>A carregar editor...</p>,
});

type DatasetsEditDescriptionSectionProps = {
  formErrors: Partial<Record<string, boolean | string>>;
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
  const { t } = useTranslation("admin-datasets");

  return (
    <>
      <h2 className="admin-page__section-title admin-page__section-title--no-top">
        {t("edit.descriptionSectionTitle")}
      </h2>
      <div className="admin-page__fields-group">
        <IsolatedInput
          label={t("edit.titleField")}
          placeholder={t("edit.titlePlaceholder")}
          id="edit-title"
          defaultValue={loadedTitle}
          onChange={onTitleChange}
          hasError={!!formErrors.title}
          hasFeedback={!!formErrors.title}
          feedbackState="danger"
          errorFeedbackText={t("edit.fieldRequired")}
        />
        <IsolatedInput
          label={t("edit.acronymField")}
          placeholder={t("edit.acronymPlaceholder")}
          id="edit-acronym"
          defaultValue={loadedAcronym}
          onChange={onAcronymChange}
        />
        <div className="flex flex-col gap-8">
          <span className="text-primary-900 text-base font-medium leading-7">
            {t("edit.descriptionField")}
          </span>
          <RichTextEditor content={description} onChange={onDescriptionChange} />
          {formErrors.description && (
            <span className="text-danger-600 text-sm">{t("edit.fieldRequired")}</span>
          )}
        </div>
        <KeywordSelectField
          id="edit-keywords"
          selectedKeywords={selectedKeywords}
          keywordOptions={keywordOptions}
          selectedKeywordsRef={keywordsRef}
          defaultValue={loadedKeywords}
          onSearchChange={onKeywordSearch}
          onChange={onKeywordsChange}
          onRemoveKeyword={onRemoveKeyword}
        />
      </div>
    </>
  );
}
