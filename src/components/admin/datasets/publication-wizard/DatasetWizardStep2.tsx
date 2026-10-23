"use client";

import React, { type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Checkbox,
  InputDate,
  InputText,
  InputTextArea,
  StatusCard,
  Tag,
  Icon,
  type DropdownSectionProps,
} from "@ama-pt/agora-design-system";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import type { SpatialZone } from "@/service/types/catalog";
import type { ContactPoint } from "@/service/types/dataset";
import type { UserRef } from "@/service/types/identity";
import { getZoneName } from "@/utils/spatialLabels";
import type { DatasetWizardDraftContact } from "./datasetWizardTypes";
import type { AdminHelpBlock } from "@/service/types/admin/common";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import type { AuxiliarItem } from "@/components/admin/AuxiliarList";
import { DatasetWizardCoverageFields } from "./DatasetWizardCoverageFields";
import { DatasetWizardContacts } from "./DatasetWizardContacts";
import { DatasetWizardHelp } from "./DatasetWizardHelp";
import { getDatasetAuxiliarItem } from "../config/datasetsAuxiliarItems";
import { DatasetContentDescription, useDatasetSection } from "../DatasetContentProvider";

type DropdownSection = ReactElement<DropdownSectionProps> | ReactElement<DropdownSectionProps>[];

export interface DatasetWizardStep2Props {
  redesigned?: boolean;
  detailsSection?: "identity" | "coverage";
  auxiliaryItems?: AuxiliarItem[];
  introduction?: AdminHelpBlock;
  router: { push: (href: string) => void };
  user: UserRef | null;
  producerDefaultValue: string;
  selectedProducerRef: React.MutableRefObject<string>;
  onProducerChange: (value: string) => void;
  producerOptions: DropdownSection;
  formErrors: Partial<Record<string, boolean | string>>;
  datasetTitle: string;
  onDatasetTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  datasetAcronym: string;
  onDatasetAcronymChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  datasetDescription: string;
  onDatasetDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  keywordsDefaultValue: string;
  selectedKeywordsRef: React.MutableRefObject<string>;
  onKeywordsSearch: (q: string) => void;
  onKeywordsValueChange: (value: string) => void;
  tagOptions: DropdownSection;
  selectedKeywords: string[];
  onKeywordTagRemove: (keyword: string) => void;
  licenseDefaultValue: string;
  selectedLicenseRef: React.MutableRefObject<string>;
  onLicenseChange: (value: string) => void;
  licenseOptions: DropdownSection;
  selectedProducer: string;
  orgContactPoints: ContactPoint[];
  selectedContactPointIds: string[];
  onToggleExistingContact: (id: string) => void;
  onContactSaved: (contact: ContactPoint, isNew: boolean) => void;
  onRemoveContact: (id: string) => void;
  draftContacts: DatasetWizardDraftContact[];
  onDraftFieldChange: (draftId: number, field: string, value: string) => void;
  onSaveContactDraft: (draftId: number) => void;
  onAddDraftContactRow: () => void;
  frequencyDefaultValue: string;
  selectedFrequencyRef: React.MutableRefObject<string>;
  onFrequencyChange: (value: string) => void;
  frequencyOptions: DropdownSection;
  temporalStart: string;
  temporalEnd: string;
  onTemporalStartChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTemporalEndChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearTemporalCoverageErrors: () => void;
  spatialCoverageDefaultValue: string;
  spatialCoverageRef: React.MutableRefObject<string>;
  onSpatialCoverageChange: (value: string) => void;
  onSpatialZoneSearch: (q: string) => void;
  spatialCoverageOptions: DropdownSection;
  selectedZoneObjects: SpatialZone[];
  onRemoveSpatialZoneTag: (zoneId: string) => void;
  spatialGranularityDefaultValue: string;
  spatialGranularityRef: React.MutableRefObject<string>;
  onGranularityChange: (value: string) => void;
  granularityOptions: DropdownSection;
  onPreviousStep: () => void;
  onStep2Next: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  isSubmitting: boolean;
}

export function DatasetWizardStep2(props: DatasetWizardStep2Props) {
  const { t } = useTranslation("admin-datasets");
  const identitySection = useDatasetSection("create-identity");
  const identificationSection = useDatasetSection("dataset-identification");
  const accessSection = useDatasetSection("access-conditions");
  const {
    router,
    redesigned = false,
    detailsSection,
    auxiliaryItems = [],
    introduction,
    user,
    producerDefaultValue,
    selectedProducerRef,
    onProducerChange,
    producerOptions,
    formErrors,
    datasetTitle,
    onDatasetTitleChange,
    datasetAcronym,
    onDatasetAcronymChange,
    datasetDescription,
    onDatasetDescriptionChange,
    keywordsDefaultValue,
    selectedKeywordsRef,
    onKeywordsSearch,
    onKeywordsValueChange,
    tagOptions,
    selectedKeywords,
    onKeywordTagRemove,
    licenseDefaultValue,
    selectedLicenseRef,
    onLicenseChange,
    licenseOptions,
    selectedProducer,
    orgContactPoints,
    selectedContactPointIds,
    onToggleExistingContact,
    onContactSaved,
    onRemoveContact,
    draftContacts,
    onDraftFieldChange,
    onSaveContactDraft,
    onAddDraftContactRow,
    frequencyDefaultValue,
    selectedFrequencyRef,
    onFrequencyChange,
    frequencyOptions,
    temporalStart,
    temporalEnd,
    onTemporalStartChange,
    onTemporalEndChange,
    clearTemporalCoverageErrors,
    spatialCoverageDefaultValue,
    spatialCoverageRef,
    onSpatialCoverageChange,
    onSpatialZoneSearch,
    spatialCoverageOptions,
    selectedZoneObjects,
    onRemoveSpatialZoneTag,
    spatialGranularityDefaultValue,
    spatialGranularityRef,
    onGranularityChange,
    granularityOptions,
    onPreviousStep,
    onStep2Next,
    isSubmitting,
  } = props;

  const hasTemporalCoverageError =
    !!formErrors.temporalCoverage || !!formErrors.temporalCoverageInvalidFormat;
  const temporalCoverageErrorText = formErrors.temporalCoverageInvalidFormat
    ? t("form.invalidDateFormat")
    : t("form.invalidTemporalRange");

  const requiredHint = (
    <span className="flex items-center gap-8 text-s-regular text-neutral-700 [&_svg]:size-16 [&_svg]:fill-informative-500!">
      <Icon name="agora-solid-info-mark" dimensions="s" />
      {t("form.fieldRequired")}
    </span>
  );
  const contactFields = (
    <>
      {selectedProducer && selectedProducer !== "user" && (
        <>
          <h3
            className={redesigned ? "text-m-medium text-primary-900" : "admin-page__section-title"}
          >
            {t(redesigned ? "form.contactAssignmentsLabel" : "form.contactPointsSectionTitle")}
          </h3>

          <div className="admin-page__fields-group">
            {formErrors.contactDrafts && (
              <StatusCard variant="danger" showIcon description={t("form.contactPointRequired")} />
            )}
            {orgContactPoints.length > 0 && (
              <div className="flex flex-col gap-2">
                {orgContactPoints.map((cp) => (
                  <Checkbox
                    key={cp.id}
                    label={cp.name}
                    value={cp.id}
                    name="contact-points"
                    checked={selectedContactPointIds.includes(cp.id)}
                    onChange={() => onToggleExistingContact(cp.id)}
                  />
                ))}
              </div>
            )}

            {draftContacts.map((draft) => (
              <div key={draft.id}>
                <div
                  className="text-base leading-7 font-medium text-primary-900"
                  style={{ paddingBottom: "16px" }}
                >
                  {t("form.newContactTitle")}
                </div>
                <div style={{ paddingBottom: "24px" }}>
                  <InputText
                    label={t("form.contactNameField")}
                    placeholder={t("form.contactNamePlaceholder")}
                    id={`contact-name-${draft.id}`}
                    value={draft.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      onDraftFieldChange(draft.id, "name", e.target.value)
                    }
                    hasError={!!draft.errors.name}
                    hasFeedback={!!draft.errors.name}
                    feedbackState="danger"
                    errorFeedbackText={t("form.fieldRequired")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-[18px]" style={{ paddingBottom: "24px" }}>
                  <InputText
                    label={t("form.contactEmailField")}
                    placeholder={t("form.contactEmailPlaceholder")}
                    id={`contact-email-${draft.id}`}
                    value={draft.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      onDraftFieldChange(draft.id, "email", e.target.value)
                    }
                    hasError={!!draft.errors.email}
                    hasFeedback={!!draft.errors.email}
                    feedbackState="danger"
                    errorFeedbackText={t("form.contactEmailRequired")}
                  />
                  <InputText
                    label={t("form.contactLinkField")}
                    placeholder={t("form.contactLinkPlaceholder")}
                    id={`contact-link-${draft.id}`}
                    value={draft.link}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      onDraftFieldChange(draft.id, "link", e.target.value)
                    }
                    hasError={!!draft.errors.link}
                    hasFeedback={!!draft.errors.link}
                    feedbackState="danger"
                    errorFeedbackText={t("form.contactLinkRequired")}
                  />
                </div>
                <div style={{ paddingBottom: "24px" }}>
                  <Button
                    type="button"
                    appearance="outline"
                    variant="primary"
                    hasIcon
                    leadingIcon="agora-line-check-circle"
                    leadingIconHover="agora-solid-check-circle"
                    onClick={() => onSaveContactDraft(draft.id)}
                  >
                    {t("form.saveContactAction")}
                  </Button>
                </div>
              </div>
            ))}

            <div style={{ marginTop: "-16px" }}>
              <Button
                type="button"
                appearance="outline"
                variant="primary"
                hasIcon
                leadingIcon="agora-line-plus-circle"
                leadingIconHover="agora-solid-plus-circle"
                onClick={onAddDraftContactRow}
              >
                {t("form.addContactAction")}
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );

  return (
    <>
      {!redesigned && introduction ? (
        <StatusCard
          variant="informative"
          showIcon
          description={formatHtmlParagraphs(introduction.description)}
        />
      ) : null}
      {!redesigned && (
        <p className="pt-32 text-base leading-7 text-neutral-900">{t("form.requiredFields")}</p>
      )}
      <form
        className={redesigned ? "flex flex-col gap-64" : "admin-page__form"}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onStep2Next();
        }}
      >
        {detailsSection !== "coverage" && (
          <>
            <section className={redesigned ? "flex flex-col gap-32" : "admin-page__fields-group"}>
              <div className="flex max-w-[592px] flex-col gap-16 text-primary-900 [&_p]:text-m-regular">
                <h2
                  className={
                    redesigned ? "text-xl-bold text-primary-900" : "admin-page__section-title"
                  }
                >
                  {redesigned ? (identitySection?.title ?? "") : t("form.producerSectionTitle")}
                </h2>
                {redesigned ? (
                  <DatasetContentDescription html={identitySection?.description} />
                ) : (
                  <p>{t("form.producerHelper")}</p>
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-16">
                <IsolatedSelect
                  label={t(redesigned ? "form.producerInputLabel" : "form.producerLabel")}
                  placeholder={t(
                    redesigned ? "form.producerInputPlaceholder" : "form.producerPlaceholder"
                  )}
                  id="dataset-producer"
                  defaultValue={producerDefaultValue}
                  onChangeRef={selectedProducerRef}
                  onChangeCallback={onProducerChange}
                  hasError={!!formErrors.datasetProducer}
                  errorFeedbackText={t("form.fieldRequired")}
                >
                  {producerOptions}
                </IsolatedSelect>
                {redesigned && <div className="-mt-8">{requiredHint}</div>}
              </div>
              {redesigned && (
                <DatasetWizardContacts
                  producerId={selectedProducer}
                  contacts={orgContactPoints}
                  selectedIds={selectedContactPointIds}
                  onToggle={onToggleExistingContact}
                  onSaved={onContactSaved}
                  onRemove={onRemoveContact}
                />
              )}
              {!redesigned && (!user?.organizations || user.organizations.length === 0) && (
                <div className="admin-page__org-card">
                  <h3>{t("form.noOrganizationTitle")}</h3>
                  <p>{t("form.noOrganizationDescription")}</p>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => router.push("/admin/organizations/new")}
                  >
                    {t("form.organizationLink")}
                  </Button>
                </div>
              )}
            </section>
            <section className={redesigned ? "flex flex-col gap-32" : "admin-page__fields-group"}>
              <div className="flex max-w-[592px] flex-col gap-16 text-primary-900 [&_p]:text-m-regular">
                <h2
                  className={
                    redesigned ? "text-xl-bold text-primary-900" : "admin-page__section-title"
                  }
                >
                  {redesigned
                    ? (identificationSection?.title ?? "")
                    : t("form.descriptionSectionTitle")}
                </h2>
                {redesigned && (
                  <DatasetContentDescription html={identificationSection?.description} />
                )}
              </div>

              <div className="admin-page__fields-group">
                {formErrors.datasetTitleTooLong && (
                  <StatusCard variant="danger" showIcon description={t("form.titleTooLong")} />
                )}
                <div className="flex min-w-0 flex-col gap-16">
                  <InputText
                    label={t(redesigned ? "form.titleInputLabel" : "form.titleField")}
                    placeholder={t(
                      redesigned ? "form.titleInputPlaceholder" : "form.titlePlaceholder"
                    )}
                    id="api-name"
                    value={datasetTitle}
                    onChange={onDatasetTitleChange}
                    hasError={!!formErrors.datasetTitle || !!formErrors.datasetTitleTooLong}
                    hasFeedback={!!formErrors.datasetTitle || !!formErrors.datasetTitleTooLong}
                    feedbackState="danger"
                    errorFeedbackText={
                      formErrors.datasetTitleTooLong
                        ? t("form.titleTooLong")
                        : t("form.fieldRequired")
                    }
                  />
                  {redesigned && <div className="-mt-8">{requiredHint}</div>}
                  {redesigned && (
                    <DatasetWizardHelp item={getDatasetAuxiliarItem(auxiliaryItems, "title")} />
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-16">
                  <InputText
                    label={t("form.acronymField")}
                    placeholder={t(
                      redesigned ? "form.acronymInputPlaceholder" : "form.acronymPlaceholder"
                    )}
                    id="api-acronym"
                    required={false}
                    value={datasetAcronym}
                    onChange={onDatasetAcronymChange}
                  />
                  {redesigned && (
                    <DatasetWizardHelp item={getDatasetAuxiliarItem(auxiliaryItems, "acronym")} />
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-16">
                  <InputTextArea
                    label={t(redesigned ? "form.descriptionInputLabel" : "form.descriptionField")}
                    placeholder={t(
                      redesigned
                        ? "form.descriptionInputPlaceholder"
                        : "form.descriptionPlaceholder"
                    )}
                    id="dataset-description"
                    rows={redesigned ? 2 : 4}
                    maxLength={3000}
                    showCharCounter={!redesigned}
                    value={datasetDescription}
                    onChange={onDatasetDescriptionChange}
                    hasError={!!formErrors.datasetDescription}
                    hasFeedback={
                      !!formErrors.datasetDescription ||
                      (!redesigned && datasetDescription.length < 1000)
                    }
                    feedbackState={formErrors.datasetDescription ? "danger" : "warning"}
                    feedbackText={t(
                      redesigned ? "form.fieldRequired" : "form.descriptionRecommendation"
                    )}
                    errorFeedbackText={t("form.fieldRequired")}
                  />
                  {redesigned && (
                    <div className="-mt-8 flex flex-col gap-8">
                      {requiredHint}
                      <div className="flex items-start justify-between gap-32">
                        <span className="flex items-center gap-8 text-s-regular text-neutral-700 [&_svg]:size-16 [&_svg]:fill-informative-500!">
                          <Icon name="agora-solid-info-mark" dimensions="s" />
                          {t("form.descriptionRecommendation")}
                        </span>
                        <span className="shrink-0 text-s-regular text-neutral-700">
                          {datasetDescription.length} / 3000
                        </span>
                      </div>
                    </div>
                  )}
                  {redesigned && (
                    <DatasetWizardHelp
                      item={getDatasetAuxiliarItem(auxiliaryItems, "description")}
                    />
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-16">
                  <IsolatedSelect
                    label={t("form.keywordsField")}
                    placeholder={t(
                      redesigned ? "form.keywordsInputPlaceholder" : "form.keywordsPlaceholder"
                    )}
                    id="dataset-keywords"
                    type="checkbox"
                    searchable
                    searchInputPlaceholder={t("form.keywordsSearchPlaceholder")}
                    searchNoResultsText={t("form.keywordsNoResults")}
                    defaultValue={keywordsDefaultValue}
                    onChangeRef={selectedKeywordsRef}
                    onSearchCallback={onKeywordsSearch}
                    onChangeCallback={onKeywordsValueChange}
                  >
                    {tagOptions}
                  </IsolatedSelect>

                  {selectedKeywords.length > 0 && (
                    <div className="-mt-8 flex flex-wrap gap-8">
                      {selectedKeywords.map((keyword) => (
                        <Tag
                          key={keyword}
                          aria-label={t("form.removeKeyword", { keyword })}
                          onClick={() => onKeywordTagRemove(keyword)}
                        >
                          {keyword}
                        </Tag>
                      ))}
                    </div>
                  )}
                  {redesigned && (
                    <DatasetWizardHelp item={getDatasetAuxiliarItem(auxiliaryItems, "keywords")} />
                  )}
                </div>
              </div>
            </section>
          </>
        )}
        {redesigned && detailsSection === "coverage" && <DatasetWizardCoverageFields {...props} />}
        {!redesigned && detailsSection !== "identity" && (
          <>
            <h2
              className={redesigned ? "text-xl-bold text-primary-900" : "admin-page__section-title"}
            >
              {accessSection?.title}
            </h2>

            <div className="admin-page__fields-group">
              <IsolatedSelect
                label={t("form.licenseField")}
                placeholder={t("form.licensePlaceholder")}
                id="dataset-license"
                defaultValue={licenseDefaultValue}
                onChangeRef={selectedLicenseRef}
                onChangeCallback={onLicenseChange}
              >
                {licenseOptions}
              </IsolatedSelect>
              {redesigned && (
                <DatasetWizardHelp item={getDatasetAuxiliarItem(auxiliaryItems, "license")} />
              )}
            </div>

            {!redesigned && contactFields}

            <h2
              className={redesigned ? "text-xl-bold text-primary-900" : "admin-page__section-title"}
            >
              {t("form.timeSectionTitle")}
            </h2>

            <div className="admin-page__fields-group">
              <IsolatedSelect
                label={t("form.frequencyField")}
                placeholder={t("form.frequencyPlaceholder")}
                id="dataset-frequency"
                defaultValue={frequencyDefaultValue}
                onChangeRef={selectedFrequencyRef}
                onChangeCallback={onFrequencyChange}
                hasError={!!formErrors.datasetFrequency}
                errorFeedbackText={t("form.fieldRequired")}
              >
                {frequencyOptions}
              </IsolatedSelect>
              {redesigned && (
                <DatasetWizardHelp item={getDatasetAuxiliarItem(auxiliaryItems, "frequency")} />
              )}

              <div className="grid grid-cols-2 gap-[18px]">
                <InputDate
                  label={t("form.temporalStartField")}
                  id="dataset-date-start"
                  defaultValue={temporalStart}
                  dayInputPlaceholder={t("edit.date.day")}
                  monthInputPlaceholder={t("edit.date.month")}
                  yearInputPlaceholder={t("edit.date.year")}
                  calendarIconAriaLabel={t("edit.date.openCalendar")}
                  previousYearAriaLabel={t("edit.date.previousYear")}
                  previousMonthAriaLabel={t("edit.date.previousMonth")}
                  nextMonthAriaLabel={t("edit.date.nextMonth")}
                  nextYearAriaLabel={t("edit.date.nextYear")}
                  selectedDayAriaLabel={t("edit.date.selectedDay")}
                  todayDayAriaLabel={t("edit.date.todayDay")}
                  todayLabel={t("edit.date.today")}
                  cancelLabel={t("edit.date.cancel")}
                  okLabel={t("edit.date.ok")}
                  hasError={hasTemporalCoverageError}
                  hasFeedback={hasTemporalCoverageError}
                  feedbackState="danger"
                  errorFeedbackText={temporalCoverageErrorText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    onTemporalStartChange(e);
                    clearTemporalCoverageErrors();
                  }}
                />
                <InputDate
                  label={t("form.temporalEndField")}
                  id="dataset-date-end"
                  defaultValue={temporalEnd}
                  dayInputPlaceholder={t("edit.date.day")}
                  monthInputPlaceholder={t("edit.date.month")}
                  yearInputPlaceholder={t("edit.date.year")}
                  calendarIconAriaLabel={t("edit.date.openCalendar")}
                  previousYearAriaLabel={t("edit.date.previousYear")}
                  previousMonthAriaLabel={t("edit.date.previousMonth")}
                  nextMonthAriaLabel={t("edit.date.nextMonth")}
                  nextYearAriaLabel={t("edit.date.nextYear")}
                  selectedDayAriaLabel={t("edit.date.selectedDay")}
                  todayDayAriaLabel={t("edit.date.todayDay")}
                  todayLabel={t("edit.date.today")}
                  cancelLabel={t("edit.date.cancel")}
                  okLabel={t("edit.date.ok")}
                  hasError={hasTemporalCoverageError}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    onTemporalEndChange(e);
                    clearTemporalCoverageErrors();
                  }}
                />
              </div>
            </div>

            {redesigned && (
              <DatasetWizardHelp
                item={getDatasetAuxiliarItem(auxiliaryItems, "temporal-coverage")}
              />
            )}
            <h2
              className={redesigned ? "text-xl-bold text-primary-900" : "admin-page__section-title"}
            >
              {t("form.spaceSectionTitle")}
            </h2>

            <div className="admin-page__fields-group">
              <IsolatedSelect
                label={t("form.spatialCoverageField")}
                placeholder={t("form.spatialCoveragePlaceholder")}
                id="dataset-spatial-coverage"
                type="checkbox"
                defaultValue={spatialCoverageDefaultValue}
                searchable
                searchInputPlaceholder={t("form.searchPlaceholder")}
                searchNoResultsText={t("form.searchNoResults")}
                onChangeRef={spatialCoverageRef}
                onChangeCallback={onSpatialCoverageChange}
                onSearchCallback={onSpatialZoneSearch}
              >
                {spatialCoverageOptions}
              </IsolatedSelect>

              {selectedZoneObjects.length > 0 && (
                <div className="-mt-8 flex flex-wrap gap-8">
                  {selectedZoneObjects.map((zone) => (
                    <Tag
                      key={zone.id}
                      aria-label={t("form.removeSpatialZone", { name: getZoneName(zone) })}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onRemoveSpatialZoneTag(zone.id)}
                    >
                      {zone.code ? `${getZoneName(zone)} (${zone.code})` : getZoneName(zone)}
                    </Tag>
                  ))}
                </div>
              )}

              <IsolatedSelect
                label={t("form.spatialGranularityField")}
                placeholder={t("form.spatialGranularityPlaceholder")}
                id="dataset-spatial-granularity"
                defaultValue={spatialGranularityDefaultValue}
                searchable
                searchInputPlaceholder={t("form.searchPlaceholder")}
                searchNoResultsText={t("form.searchNoResults")}
                onChangeRef={spatialGranularityRef}
                onChangeCallback={onGranularityChange}
              >
                {granularityOptions}
              </IsolatedSelect>
              {redesigned && (
                <DatasetWizardHelp
                  item={getDatasetAuxiliarItem(auxiliaryItems, "spatial-granularity")}
                />
              )}
            </div>
          </>
        )}
        <div data-dataset-actions className="admin-page__actions flex justify-between gap-[18px]">
          <Button
            type="button"
            variant="primary"
            appearance="outline"
            hasIcon
            leadingIcon="agora-line-arrow-left-circle"
            leadingIconHover="agora-solid-arrow-left-circle"
            onClick={onPreviousStep}
          >
            {t("form.previousAction")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            hasIcon
            trailingIcon="agora-line-arrow-right-circle"
            trailingIconHover="agora-solid-arrow-right-circle"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("form.creating") : t("form.nextAction")}
          </Button>
        </div>
      </form>
    </>
  );
}
