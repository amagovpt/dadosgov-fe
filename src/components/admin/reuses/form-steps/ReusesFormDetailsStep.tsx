"use client";

import type { ChangeEvent, MutableRefObject, ReactElement } from "react";
import { useTranslation } from "react-i18next";
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
import type { AdminHelpBlock } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface ReusesFormDetailsStepProps {
  introduction?: AdminHelpBlock;
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
  introduction,
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
  const { t } = useTranslation("admin-reuses");

  return (
    <>
      {introduction ? (
        <StatusCard
          variant="informative"
          showIcon
          description={
            <>
              {introduction.title ? (
                <>
                  <strong>{introduction.title}</strong>
                  <br />
                  {formatHtmlParagraphs(introduction.description)}
                </>
              ) : (
                formatHtmlParagraphs(introduction.description)
              )}
            </>
          }
        />
      ) : null}

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
          {t("form.requiredFields")}
        </p>
        <h2 className="admin-page__section-title">{t("form.producerSectionTitle")}</h2>

        <IsolatedSelect
          label={t("form.producerLabel")}
          placeholder={t("form.producerPlaceholder")}
          id="producer-identity"
          onChangeRef={selectedProducerRef}
          defaultValue={selectedProducerValue}
          onChangeCallback={onProducerChange}
        >
          {producerOptions}
        </IsolatedSelect>

        {!hasOrganization && (
          <div className="admin-page__org-card">
            <p className="admin-page__org-card-title">{t("form.noOrganizationTitle")}</p>
            <p className="admin-page__org-card-description">
              {t("form.noOrganizationDescription")}
            </p>
            <a href="/admin/organizations/new" className="admin-page__org-card-link">
              {t("form.organizationLink")}
              <AppIcon name="agora-line-arrow-right-circle" className="h-24 w-24" />
            </a>
          </div>
        )}

        <h2 className="admin-page__section-title">{t("form.descriptionSectionTitle")}</h2>

        <div className="admin-page__fields-group">
          <InputText
            label={t("form.nameField")}
            placeholder={t("form.namePlaceholder")}
            id="reuse-title"
            value={reuseName}
            onChange={onReuseNameChange}
            hasError={!!formErrors.reuseName}
            hasFeedback={!!formErrors.reuseName}
            feedbackState="danger"
            errorFeedbackText={t("form.fieldRequired")}
          />
          <InputText
            label={t("form.linkField")}
            placeholder={t("form.linkPlaceholder")}
            id="reuse-link"
            value={reuseLink}
            onChange={onReuseLinkChange}
            hasError={!!formErrors.reuseLink || reuseLinkInvalid}
            hasFeedback={!!formErrors.reuseLink || reuseLinkInvalid}
            feedbackState="danger"
            errorFeedbackText={reuseLinkInvalid ? t("form.linkInvalid") : t("form.fieldRequired")}
          />
          {reuseLinkInvalid && (
            <div className="mt-8">
              <StatusCard
                variant="danger"
                showIcon
                description={t("form.linkInvalidDescription")}
              />
            </div>
          )}
          <IsolatedSelect
            label={t("form.typeField")}
            placeholder={t("form.typePlaceholder")}
            id="reuse-type"
            searchable
            searchInputPlaceholder={t("form.noResults")}
            searchNoResultsText={t("form.noResults")}
            onChangeRef={selectedReuseTypeRef}
            defaultValue={selectedReuseTypeValue}
            onChangeCallback={onReuseTypeChange}
            hasError={!!formErrors.reuseType}
            errorFeedbackText={t("form.fieldRequired")}
          >
            {typeOptions}
          </IsolatedSelect>
          <IsolatedSelect
            label={t("form.topicField")}
            placeholder={t("form.topicPlaceholder")}
            id="reuse-theme"
            searchable
            searchInputPlaceholder={t("form.noResults")}
            searchNoResultsText={t("form.noResults")}
            onChangeRef={selectedReuseTopicRef}
            defaultValue={selectedReuseTopicValue}
            onChangeCallback={onReuseTopicChange}
            hasError={!!formErrors.reuseTopic}
            errorFeedbackText={t("form.fieldRequired")}
          >
            {topicOptions}
          </IsolatedSelect>
          <InputTextArea
            label={t("form.descriptionField")}
            placeholder={t("form.descriptionPlaceholder")}
            id="reuse-description"
            rows={4}
            maxLength={3000}
            showCharCounter
            value={reuseDescription}
            onChange={onReuseDescriptionChange}
            hasError={!!formErrors.reuseDescription}
            hasFeedback={!!formErrors.reuseDescription}
            feedbackState="danger"
            errorFeedbackText={t("form.fieldRequired")}
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
            label={t("form.coverImageField")}
            files={reuseCoverImageFile ? [reuseCoverImageFile] : undefined}
            onChange={onReuseCoverImageChange}
            onSecurityError={onReuseCoverImageSecurityError}
            dragAndDropLabel={t("form.coverDropLabel")}
            inputLabel={t("form.coverInputLabel")}
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
            {t("form.previous")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            hasIcon
            trailingIcon="agora-line-arrow-right-circle"
            trailingIconHover="agora-solid-arrow-right-circle"
            disabled={isSubmitting || reuseLinkInvalid}
          >
            {isSubmitting ? t("form.creating") : t("form.next")}
          </Button>
        </div>
      </form>
    </>
  );
}
