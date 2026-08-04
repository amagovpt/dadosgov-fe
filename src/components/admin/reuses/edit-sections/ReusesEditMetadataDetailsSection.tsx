import React from "react";
import { useTranslation } from "react-i18next";
import {
  DropdownOption,
  type DropdownSectionProps,
  DropdownSection,
  Switch,
} from "@ama-pt/agora-design-system";
import ImageUploadField from "@/components/admin/forms/ImageUploadField";
import KeywordSelectField from "@/components/admin/forms/KeywordSelectField";
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
  formErrors: Partial<Record<string, boolean | string>>;
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
  const { t } = useTranslation("admin-reuses");

  return (
    <>
      <h2 className="admin-page__section-title">{t("edit.featuredSectionTitle")}</h2>
      <div className="admin-page__fields-group">
        <Switch label={t("edit.featuredLabel")} checked={featured} onChange={onToggleFeatured} />
      </div>

      <h2 className="admin-page__section-title">{t("edit.metadataSectionTitle")}</h2>
      <div className="admin-page__fields-group">
        <IsolatedInput
          label={t("form.nameField")}
          placeholder={t("form.namePlaceholder")}
          id="edit-title"
          defaultValue={title}
          onChange={onTitleChange}
          hasError={!!formErrors.title}
          hasFeedback={!!formErrors.title}
          feedbackState="danger"
          errorFeedbackText={t("form.fieldRequired")}
        />
        <IsolatedInput
          label={t("form.fieldLabels.url") + " *"}
          placeholder={t("form.linkPlaceholder")}
          id="edit-url"
          defaultValue={url}
          onChange={onUrlChange}
          hasError={!!formErrors.url}
          hasFeedback={!!formErrors.url}
          feedbackState="danger"
          errorFeedbackText={t("form.fieldRequired")}
        />
        <IsolatedSelect
          label={t("form.typeField")}
          placeholder={t("form.typePlaceholder")}
          id="edit-type"
          searchable
          searchInputPlaceholder={t("form.datasetSearchInputPlaceholder")}
          searchNoResultsText={t("form.noResults")}
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
          label={t("form.topicField")}
          placeholder={t("form.topicPlaceholder")}
          id="edit-topic"
          searchable
          searchInputPlaceholder={t("form.datasetSearchInputPlaceholder")}
          searchNoResultsText={t("form.noResults")}
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
          label={t("form.descriptionField")}
          placeholder={t("form.descriptionPlaceholder")}
          id="edit-description"
          rows={6}
          maxLength={246}
          showCharCounter
          defaultValue={description}
          onChange={onDescriptionChange}
          hasError={formErrors.description ? true : undefined}
          hasFeedback={formErrors.description ? true : undefined}
          feedbackState="danger"
          feedbackText={t("form.fieldRequired")}
          errorFeedbackText={t("form.fieldRequired")}
        />
        <KeywordSelectField
          id="edit-keywords"
          selectedKeywords={selectedKeywords}
          keywordOptions={keywordOptions}
          selectedKeywordsRef={selectedKeywordsRef}
          defaultValue={selectedKeywordsValue}
          onSearchChange={onKeywordSearchChange}
          onChange={onKeywordsChange}
          onRemoveKeyword={onRemoveKeyword}
          sortSelectedKeywords
        />

        <ImageUploadField
          label={t("form.coverImageField")}
          required
          onChange={onImageUpload}
          onSecurityError={onImageSecurityError}
          error={imageError}
          previewSrc={reuse.image_thumbnail || reuse.image || undefined}
          previewAlt={t("edit.imagePreviewAlt")}
          previewPlacement="before"
          previewWrapperClassName="mt-2 mb-2"
          previewImageClassName="rounded border border-neutral-200 max-h-[180px] object-cover"
        />
      </div>
    </>
  );
}
