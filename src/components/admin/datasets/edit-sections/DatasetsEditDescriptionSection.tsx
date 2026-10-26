import React from "react";
import { useTranslation } from "react-i18next";
import { type DropdownSectionProps } from "@ama-pt/agora-design-system";
import { Icon } from "@ama-pt/agora-design-system";
import IsolatedInput from "@/components/admin/IsolatedInput";
import IsolatedTextArea from "@/components/admin/IsolatedTextArea";
import KeywordSelectField from "@/components/admin/forms/KeywordSelectField";
import type { AuxiliarItem } from "@/components/admin/AuxiliarList";
import { DatasetWizardHelp } from "../publication-wizard/DatasetWizardHelp";
import { getDatasetAuxiliarItem } from "../config/datasetsAuxiliarItems";
import { DatasetContentDescription, useDatasetSection } from "../DatasetContentProvider";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";

type DatasetsEditDescriptionSectionProps = {
  auxiliaryItems: AuxiliarItem[];
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
  auxiliaryItems,
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
  const identificationSection = useDatasetSection("dataset-identification");

  const requiredHint = (
    <span className="flex items-center gap-8 text-s-regular text-neutral-700">
      <Icon
        name="agora-solid-info-mark"
        dimensions="xs"
        className="fill-informative-500!"
        aria-hidden="true"
      />
      {t("form.fieldRequired")}
    </span>
  );
  const help = (key: string) => (
    <DatasetWizardHelp item={getDatasetAuxiliarItem(auxiliaryItems, key)} background="white" />
  );
  return (
    <section className="flex min-w-0 flex-col gap-32">
      <div className="flex max-w-[592px] flex-col gap-16 text-primary-900">
        <h2 className="text-xl-bold">{identificationSection?.title ?? ""}</h2>
        <DatasetContentDescription
          html={identificationSection?.description}
          className="text-m-regular"
        />
      </div>
      <div className="flex min-w-0 flex-col gap-16">
        <IsolatedInput
          label={t("form.titleInputLabel")}
          placeholder={t("form.titleInputPlaceholder")}
          id="edit-title"
          defaultValue={loadedTitle}
          required
          onChange={onTitleChange}
          hasError={!!formErrors.title}
          hasFeedback={!!formErrors.title}
          feedbackState="danger"
          errorFeedbackText={t("edit.fieldRequired")}
        />
        <div className="-mt-8">{requiredHint}</div>
        {help("title")}
      </div>
      <div className="flex min-w-0 flex-col gap-16">
        <IsolatedInput
          label={t("edit.acronymField")}
          placeholder={t("form.acronymInputPlaceholder")}
          id="edit-acronym"
          defaultValue={loadedAcronym}
          onChange={onAcronymChange}
        />
        {help("acronym")}
      </div>
      <div className="flex min-w-0 flex-col gap-16">
        <IsolatedTextArea
          className="h-[108px] min-h-[108px]"
          label={t("edit.descriptionField")}
          placeholder={t("form.descriptionInputPlaceholder")}
          id="edit-description"
          defaultValue={stripHtmlTags(description)}
          rows={3}
          required
          maxLength={3000}
          onChange={onDescriptionChange}
          hasError={!!formErrors.description}
          hasFeedback={!!formErrors.description}
          feedbackState="danger"
          errorFeedbackText={t("edit.fieldRequired")}
        />
        <div className="-mt-8 flex flex-col gap-8">
          {requiredHint}
          <div className="flex items-start justify-between gap-16">
            <span className="flex items-center gap-8 text-s-regular text-neutral-700">
              <Icon
                name="agora-solid-info-mark"
                dimensions="xs"
                className="fill-informative-500!"
                aria-hidden="true"
              />
              {t("form.descriptionRecommendation")}
            </span>
            <span className="shrink-0 text-s-regular text-neutral-700">
              {stripHtmlTags(description).length} / 3000
            </span>
          </div>
        </div>
        {help("description")}
      </div>
      <div className="flex min-w-0 flex-col gap-16">
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
        {help("keywords")}
      </div>
    </section>
  );
}
