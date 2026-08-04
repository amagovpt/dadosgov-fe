"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionGroup,
  Button,
  Checkbox,
  InputText,
  InputTextArea,
  StatusCard,
} from "@ama-pt/agora-design-system";
import ImageUploadField from "@/components/admin/forms/ImageUploadField";
import type { OrgBadges } from "@/service/types/identity";

interface OrganizationProfileFormSectionProps {
  name: string;
  acronym: string;
  description: string;
  url: string;
  availableBadges: OrgBadges;
  selectedBadgeKinds: string[];
  canEdit: boolean;
  isSaving: boolean;
  nameError: boolean;
  descriptionError: boolean;
  logoError: string | null;
  saveStatus: "success" | "error" | null;
  onNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAcronymChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBadgeToggle: (kind: string, checked: boolean) => void;
  onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLogoSecurityError: () => void;
  onSave: () => void;
}

export default function OrganizationProfileFormSection({
  name,
  acronym,
  description,
  url,
  availableBadges,
  selectedBadgeKinds,
  canEdit,
  isSaving,
  nameError,
  descriptionError,
  logoError,
  saveStatus,
  onNameChange,
  onAcronymChange,
  onDescriptionChange,
  onUrlChange,
  onBadgeToggle,
  onLogoUpload,
  onLogoSecurityError,
  onSave,
}: OrganizationProfileFormSectionProps) {
  const { t } = useTranslation(["admin-common", "admin-profile"]);

  return (
    <form
      className="admin-page__form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <h2 className="admin-page__section-title hidden">{t("admin-profile:organization.form.sectionTitle")}</h2>

      <div className="admin-page__fields-group pt-32">
        {saveStatus && (
          <StatusCard
            variant={saveStatus === "success" ? "success" : "danger"}
            showIcon
            description={
              saveStatus === "success"
                ? t("admin-profile:organization.form.saveSuccess")
                : t("admin-profile:organization.form.saveError")
            }
          />
        )}

        <InputText
          label={t("admin-profile:organization.form.nameLabel")}
          placeholder={t("admin-profile:organization.form.namePlaceholder")}
          id="org-name"
          value={name}
          onChange={onNameChange}
          hasError={nameError}
          hasFeedback={nameError}
          feedbackState="danger"
          errorFeedbackText={t("admin-common:forms.requiredField")}
          readOnly={!canEdit}
          disabled={!canEdit}
        />

        <InputText
          label={t("admin-profile:organization.form.acronymLabel")}
          placeholder={t("admin-profile:organization.form.acronymPlaceholder")}
          id="org-acronym"
          value={acronym}
          onChange={onAcronymChange}
          readOnly={!canEdit}
          disabled={!canEdit}
        />

        <InputTextArea
          label={t("admin-profile:organization.form.descriptionLabel")}
          placeholder={t("admin-profile:organization.form.descriptionPlaceholder")}
          id="org-description"
          rows={4}
          value={description}
          onChange={onDescriptionChange}
          hasError={descriptionError}
          hasFeedback={descriptionError}
          feedbackState="danger"
          errorFeedbackText={t("admin-common:forms.requiredField")}
          readOnly={!canEdit}
          disabled={!canEdit}
        />

        <InputText
          label={t("admin-profile:organization.form.websiteLabel")}
          placeholder={t("admin-profile:organization.form.websitePlaceholder")}
          id="org-url"
          value={url}
          onChange={onUrlChange}
          readOnly={!canEdit}
          disabled={!canEdit}
        />

        {Object.keys(availableBadges).length > 0 && (
          <AccordionGroup>
            <Accordion headingTitle={t("admin-profile:organization.form.badges")} headingLevel="h3">
              <div className="flex flex-col gap-8 p-16">
                {Object.entries(availableBadges).map(([kind, label]) => (
                  <Checkbox
                    key={kind}
                    id={`org-badge-${kind}`}
                    label={label}
                    value={kind}
                    name={`org-badge-${kind}`}
                    required={false}
                    checked={selectedBadgeKinds.includes(kind)}
                    disabled={isSaving}
                    onChange={(event) => onBadgeToggle(kind, event.target.checked)}
                  />
                ))}
              </div>
            </Accordion>
          </AccordionGroup>
        )}

        {canEdit && (
          <div>
            <ImageUploadField
              label={t("admin-profile:organization.form.logoLabel")}
              uploaderLabel={t("admin-profile:organization.form.logoUploaderLabel")}
              onChange={onLogoUpload}
              onSecurityError={onLogoSecurityError}
              error={logoError}
              maxSize={512000}
              extensionsInstructions={t("admin-profile:organization.form.logoExtensions")}
              maxSizeExceededErrorLabel={t("admin-profile:organization.form.logoMaxSizeExceeded")}
            />
          </div>
        )}

        {canEdit && (
          <div className="mt-16 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              hasIcon
              trailingIcon="agora-line-check-circle"
              trailingIconHover="agora-solid-check-circle"
              disabled={isSaving}
            >
              {isSaving ? t("admin-common:actions.saving") : t("admin-common:actions.save")}
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}
