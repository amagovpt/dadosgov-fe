"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Button, InputText, InputTextArea, StatusCard } from "@ama-pt/agora-design-system";
import ImageUploadField from "@/components/admin/forms/ImageUploadField";

interface OrganizationDetailsStepProps {
  orgName: string;
  orgAcronym: string;
  orgDescription: string;
  orgWebsite: string;
  orgLogoError: string | null;
  orgLogoPreview: string | null;
  isSubmitting: boolean;
  hasNameError: boolean;
  hasDescriptionError: boolean;
  nameErrorMessage?: string;
  descriptionErrorMessage?: string;
  onNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAcronymChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onWebsiteChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLogoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLogoSecurityError: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
}

export default function OrganizationDetailsStep({
  orgName,
  orgAcronym,
  orgDescription,
  orgWebsite,
  orgLogoError,
  orgLogoPreview,
  isSubmitting,
  hasNameError,
  hasDescriptionError,
  nameErrorMessage,
  descriptionErrorMessage,
  onNameChange,
  onAcronymChange,
  onDescriptionChange,
  onWebsiteChange,
  onLogoChange,
  onLogoSecurityError,
  onPrevious,
  onSubmit,
}: OrganizationDetailsStepProps) {
  const { t } = useTranslation("admin-organizations");

  return (
    <>
      <StatusCard
        variant="informative"
        showIcon
        description={
          <>
            <strong>{t("form.whatIsOrganizationTitle")}</strong>
            <br />
            {t("form.whatIsOrganizationDescription")}
          </>
        }
      />

      <form
        className="admin-page__form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <p className="pt-32 text-base leading-7 text-neutral-900">
          {t("form.requiredFields")}
        </p>

        <h2 className="admin-page__section-title">
          {t("form.descriptionSectionTitle")}
        </h2>

        <div className="admin-page__fields-group">
          <InputText
            label={t("form.nameField")}
            placeholder={t("form.namePlaceholder")}
            id="org-name"
            value={orgName}
            onChange={onNameChange}
            hasError={hasNameError}
            hasFeedback={hasNameError}
            feedbackState="danger"
            errorFeedbackText={nameErrorMessage}
          />

          <InputText
            label={t("form.acronymField")}
            placeholder={t("form.acronymPlaceholder")}
            id="org-acronym"
            value={orgAcronym}
            onChange={onAcronymChange}
          />

          <InputTextArea
            label={t("form.descriptionField")}
            placeholder={t("form.descriptionPlaceholder")}
            id="org-description"
            rows={6}
            value={orgDescription}
            onChange={onDescriptionChange}
            hasError={hasDescriptionError}
            hasFeedback={hasDescriptionError}
            feedbackState="danger"
            errorFeedbackText={descriptionErrorMessage}
          />

          <InputText
            label={t("form.websiteField")}
            placeholder={t("form.websitePlaceholder")}
            id="org-website"
            value={orgWebsite}
            onChange={onWebsiteChange}
          />
        </div>

        <h2 className="admin-page__section-title">{t("form.logoSectionTitle")}</h2>

        <div className="admin-page__fields-group">
          <ImageUploadField
            label={t("form.logoFileLabel")}
            onChange={onLogoChange}
            onSecurityError={onLogoSecurityError}
            error={orgLogoError}
            previewSrc={orgLogoPreview || undefined}
            previewAlt={t("form.logoPreviewAlt")}
            previewLabel={t("form.logoPreviewLabel")}
            previewWrapperClassName="mt-12"
            previewImageClassName="max-h-[120px] max-w-[240px] rounded-8 border border-neutral-200 object-contain p-8"
            uploaderWrapperClassName="[&_.drag-and-drop-area_.agora-btn]:w-fit [&_.instructions]:items-center [&_.instructions]:text-center"
          />
        </div>

        <div className="admin-page__actions">
          <Button type="button" appearance="outline" variant="neutral" onClick={onPrevious}>
            {t("form.previous")}
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {t("form.createOrganization")}
          </Button>
        </div>
      </form>
    </>
  );
}
