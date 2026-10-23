"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button, Icon, ModalProvider, StatusCard } from "@ama-pt/agora-design-system";
import AuxiliarList from "@/components/admin/AuxiliarList";
import { AdminStepper } from "@/components/admin/AdminStepper";
import {
  getDatasetAuxiliarItems,
  getCreateDatasetAuxiliarItems,
  getResourceDatasetAuxiliarItems,
} from "@/components/admin/datasets/config/datasetsAuxiliarItems";
import { useAuth } from "@/context/AuthContext";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import type { BoDatasetsPage } from "@/service/types/admin/datasets";
import { localizeHref } from "@/utils/localizeHref";
import { splitLocale } from "@/utils/stripLocale";
import { DatasetWizardStep2 } from "./DatasetWizardStep2";
import { DatasetWizardStep3 } from "./DatasetWizardStep3";
import { DatasetWizardStep4 } from "./DatasetWizardStep4";
import { DatasetWizardCancelDialog } from "./DatasetWizardCancelDialog";
import { useDatasetWizardContactActions } from "./hooks/useDatasetWizardContactActions";
import { useDatasetWizardSubmissionActions } from "./hooks/useDatasetWizardSubmissionActions";
import { useDatasetWizardForm } from "./hooks/useDatasetWizardForm";
import { useDatasetWizardOptions } from "./hooks/useDatasetWizardOptions";
import { useDatasetWizardPersistence } from "./hooks/useDatasetWizardPersistence";

interface DatasetsAdminClientProps {
  pageContent: BoDatasetsPage;
  redesigned?: boolean;
  currentStep?: number;
  datasetId?: string | null;
  initialProducerId?: string;
  draftScope?: string;
  creationId?: string;
  onNextStep?: () => void;
  onPreviousStep?: () => void;
  onDatasetCreated?: (datasetId: string) => void;
  onComplete?: () => void;
}

export default function DatasetsAdminClient({
  pageContent,
  redesigned = false,
  currentStep: controlledCurrentStep,
  datasetId,
  initialProducerId,
  draftScope = "/admin/me",
  creationId,
  onNextStep,
  onPreviousStep,
  onDatasetCreated,
  onComplete,
}: DatasetsAdminClientProps) {
  const { t } = useTranslation(["admin-common", "admin-datasets"]);
  const router = useRouter();
  const { locale } = splitLocale(usePathname());
  const { user } = useAuth();
  const { organizations } = useActiveOrganization();
  const storageScope = redesigned && user?.id ? `dataset-creation:${user.id}:${draftScope}` : null;
  const [internalCurrentStep, setInternalCurrentStep] = useState(2);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const currentStep = controlledCurrentStep ?? internalCurrentStep;
  const handleNextStep = onNextStep ?? (() => setInternalCurrentStep((step) => step + 1));
  const handlePreviousStep =
    onPreviousStep ?? (() => setInternalCurrentStep((step) => Math.max(0, step - 1)));

  const isDetailsStep = redesigned ? currentStep <= 2 : currentStep === 2;

  const form = useDatasetWizardForm({ redesigned, initialProducerId });
  const options = useDatasetWizardOptions({ form, user, organizations });
  const persistence = useDatasetWizardPersistence({
    form,
    storageScope,
    creationId,
    datasetId,
    licenseDefaultValue: options.licenseDefaultValue,
    currentStep,
    redesigned,
  });
  const contacts = useDatasetWizardContactActions(form);
  const completeWizard = () => {
    persistence.clearSession();
    if (onComplete) onComplete();
    else router.push(localizeHref(`${draftScope}/datasets`, locale));
  };

  const {
    updateResourceMetadata,
    handlePublish,
    handleSaveDraft,
    handleStep2Next,
    handleStep3Next,
  } = useDatasetWizardSubmissionActions({
    currentStep,
    optionalContacts: redesigned,
    datasetId,
    ...form,
    uploadProgressKey: persistence.uploadProgressKey,
    onDatasetCreated: (id) => {
      if (onDatasetCreated) onDatasetCreated(id);
      else
        router.push(
          localizeHref(`${draftScope}/datasets/new?step=${currentStep + 1}&datasetId=${id}`, locale)
        );
    },
    onNextStep: handleNextStep,
    onComplete: completeWizard,
    navigateToStep: (nextStep, nextDatasetId) => {
      router.push(
        localizeHref(`/admin/me/datasets/new?step=${nextStep}&datasetId=${nextDatasetId}`, locale)
      );
    },
    finishWizard: () => {
      router.push(localizeHref("/admin/me/datasets", locale));
    },
    validationMessages: {
      producerRequired: t("admin-datasets:form.fieldRequired"),
      titleRequired: t("admin-datasets:form.fieldRequired"),
      titleTooLong: t("admin-datasets:form.titleTooLong"),
      descriptionRequired: t("admin-datasets:form.fieldRequired"),
      frequencyRequired: t("admin-datasets:form.fieldRequired"),
      invalidDate: t("admin-datasets:form.invalidDateFormat"),
      invalidRange: t("admin-datasets:form.invalidTemporalRange"),
      contactDraftRequired: t("admin-datasets:form.contactPointRequired"),
    },
    restoreErrors: {
      missingDataset: t("admin-datasets:form.missingDatasetError"),
      loadDataset: t("admin-datasets:form.step3LoadError"),
      saveDataset: t("admin-datasets:form.step2SaveError"),
      saveResource: t("admin-datasets:form.step3SaveError", { message: "{{message}}" }),
      saveResourceRetry: t("admin-datasets:form.step3SaveRetryError", {
        statusHint: "{{statusHint}}",
      }),
      publish: t("admin-datasets:form.publishError"),
      saveDraft: t("admin-datasets:form.saveDraftError"),
    },
  });

  const auxiliarItemsStep2 = redesigned
    ? getCreateDatasetAuxiliarItems({ items: pageContent.createAuxiliaryItems })
    : getDatasetAuxiliarItems({ items: pageContent.createAuxiliaryItems });

  const auxiliarItemsStep3 = getResourceDatasetAuxiliarItems(pageContent.resourceAuxiliaryItems);

  const auxiliarItems =
    currentStep === 3 || currentStep === 4 ? auxiliarItemsStep3 : auxiliarItemsStep2;

  if (!persistence.isRestored) {
    return form.apiError ? (
      <StatusCard variant="danger" showIcon description={form.apiError} />
    ) : null;
  }

  return (
    <ModalProvider>
      {cancelDialogOpen && (
        <DatasetWizardCancelDialog
          onClose={() => {
            setCancelDialogOpen(false);
            cancelButtonRef.current?.focus();
          }}
          onConfirm={() => {
            setCancelDialogOpen(false);
            completeWizard();
          }}
        />
      )}
      {redesigned && (
        <>
          {currentStep !== 4 && (
            <div className="flex flex-wrap items-center justify-start gap-8 md:justify-end">
              <Button
                ref={cancelButtonRef}
                type="button"
                appearance="link"
                variant="danger"
                hasIcon
                leadingIcon="agora-line-trash"
                leadingIconHover="agora-solid-trash"
                disabled={form.isSubmitting}
                onClick={() => setCancelDialogOpen(true)}
              >
                {t("admin-datasets:form.cancelCreation")}
              </Button>
              <span className="hidden h-[60px] w-px bg-neutral-700 md:block" aria-hidden="true" />
              <Button
                type="button"
                appearance="link"
                variant="primary"
                hasIcon
                leadingIcon="agora-line-download"
                leadingIconHover="agora-solid-download"
                disabled={form.isSubmitting}
                onClick={() => void handleSaveDraft()}
              >
                {form.isSubmitting
                  ? t("admin-datasets:form.savingDraft")
                  : t("admin-datasets:form.saveCreationDraft")}
              </Button>
            </div>
          )}
          <div
            className={
              currentStep === 4
                ? "[&_h1]:text-2xl-bold! [&_h1>span]:text-2xl-bold!"
                : "[&_h2>span]:text-xl-bold!"
            }
          >
            <AdminStepper
              headingLevel={currentStep === 4 ? "h1" : "h2"}
              currentStep={currentStep}
              totalSteps={4}
              labelFormat="de"
              appearance="form"
              stepTitle={pageContent.steps?.[currentStep - 1]?.title ?? ""}
            />
          </div>
        </>
      )}
      <div
        className={
          redesigned
            ? `flex ${currentStep >= 3 ? "w-full" : "w-[800px]"} max-w-full flex-col gap-32`
            : "flex flex-col gap-32 min-[1025px]:flex-row"
        }
      >
        {/* Left: Form */}
        <div className="flex min-w-0 flex-1 flex-col gap-24">
          {persistence.localSaveError && (
            <StatusCard
              variant="danger"
              showIcon
              description={t("admin-datasets:form.localSaveError")}
            />
          )}
          {form.apiError && <StatusCard variant="danger" showIcon description={form.apiError} />}

          {isDetailsStep && (
            <DatasetWizardStep2
              redesigned={redesigned}
              detailsSection={
                redesigned ? (currentStep === 1 ? "identity" : "coverage") : undefined
              }
              auxiliaryItems={auxiliarItemsStep2}
              introduction={pageContent.publicationIntroduction}
              router={router}
              user={user}
              producerDefaultValue={form.selectedProducer}
              selectedProducerRef={form.selectedProducerRef}
              onProducerChange={form.handleProducerFieldChange}
              producerOptions={options.producerOptions}
              formErrors={form.formErrors}
              datasetTitle={form.datasetTitle}
              onDatasetTitleChange={(e) => {
                form.setDatasetTitle(e.target.value);
                if (e.target.value.trim()) form.clearError("datasetTitle");
                form.clearError("datasetTitleTooLong");
              }}
              datasetAcronym={form.datasetAcronym}
              onDatasetAcronymChange={(e) => form.setDatasetAcronym(e.target.value)}
              datasetDescription={form.datasetDescription}
              onDatasetDescriptionChange={(e) => {
                form.setDatasetDescription(e.target.value);
                if (e.target.value.trim()) form.clearError("datasetDescription");
              }}
              keywordsDefaultValue={form.keywordsDefaultValue}
              selectedKeywordsRef={form.selectedKeywordsRef}
              onKeywordsSearch={options.handleKeywordsSearchInput}
              onKeywordsValueChange={options.handleKeywordsSelectValueChange}
              tagOptions={options.tagOptions}
              selectedKeywords={form.selectedKeywords}
              onKeywordTagRemove={options.handleKeywordTagRemove}
              licenseDefaultValue={options.licenseDefaultValue}
              selectedLicenseRef={form.selectedLicenseRef}
              onLicenseChange={form.setSelectedLicenseValue}
              licenseOptions={options.licenseOptions}
              selectedProducer={form.selectedProducer}
              orgContactPoints={form.orgContactPoints}
              selectedContactPointIds={form.selectedContactPointIds}
              onToggleExistingContact={contacts.toggleExistingContact}
              onContactSaved={contacts.handleContactSaved}
              onRemoveContact={contacts.handleRemoveContact}
              draftContacts={form.draftContacts}
              onDraftFieldChange={contacts.updateDraftContactField}
              onSaveContactDraft={contacts.handleSaveContactDraft}
              onAddDraftContactRow={contacts.handleAddDraftContactRow}
              frequencyDefaultValue={form.frequencyDefaultValue}
              selectedFrequencyRef={form.selectedFrequencyRef}
              onFrequencyChange={(value) => {
                form.setSelectedFrequencyValue(value);
                if (value) form.clearError("datasetFrequency");
              }}
              frequencyOptions={options.frequencyOptions}
              temporalStart={form.temporalStart}
              temporalEnd={form.temporalEnd}
              onTemporalStartChange={(e) => form.setTemporalStart(e.target.value)}
              onTemporalEndChange={(e) => form.setTemporalEnd(e.target.value)}
              clearTemporalCoverageErrors={form.clearTemporalCoverageErrors}
              spatialCoverageDefaultValue={form.spatialCoverageDefaultValue}
              spatialCoverageRef={form.spatialCoverageRef}
              onSpatialCoverageChange={options.handleSpatialCoverageChange}
              onSpatialZoneSearch={options.handleSpatialZonesSearchQuery}
              spatialCoverageOptions={options.spatialCoverageOptions}
              selectedZoneObjects={options.selectedZoneObjects}
              onRemoveSpatialZoneTag={options.handleRemoveSpatialZoneTag}
              spatialGranularityDefaultValue={form.spatialGranularityDefaultValue}
              spatialGranularityRef={form.spatialGranularityRef}
              onGranularityChange={form.setSelectedGranularityValue}
              granularityOptions={options.granularityOptions}
              onPreviousStep={handlePreviousStep}
              onStep2Next={
                redesigned && currentStep === 1
                  ? () => form.handleIdentityNext(handleNextStep)
                  : handleStep2Next
              }
              isSubmitting={form.isSubmitting}
            />
          )}

          {currentStep === 3 && (
            <DatasetWizardStep3
              redesigned={redesigned}
              datasetId={form.createdDataset?.id}
              savedResources={form.createdDataset?.resources}
              onResourcesChange={(resources) =>
                form.setCreatedDataset((previous) =>
                  previous ? { ...previous, resources } : previous
                )
              }
              introduction={pageContent.resourceIntroduction}
              auxiliaryItems={redesigned ? auxiliarItemsStep3 : undefined}
              uploadedFiles={form.uploadedFiles}
              setUploadedFiles={form.setUploadedFiles}
              resourceUrls={form.resourceUrls}
              setResourceUrls={form.setResourceUrls}
              showFileError={form.showFileError}
              setShowFileError={form.setShowFileError}
              allowedExtensions={options.allowedExtensions}
              resourceTypes={options.resourceTypes}
              resourceMetadata={form.resourceMetadata}
              onEditMeta={updateResourceMetadata}
              onPreviousStep={handlePreviousStep}
              onStep3Next={handleStep3Next}
              isSubmitting={form.isSubmitting}
            />
          )}

          {currentStep === 4 && (
            <DatasetWizardStep4
              redesigned={redesigned}
              publishStepCard={pageContent.publishStepCard}
              createdDataset={form.createdDataset}
              datasetTitle={form.datasetTitle}
              datasetDescription={form.datasetDescription}
              onPublish={handlePublish}
              onSaveDraft={handleSaveDraft}
              isSubmitting={form.isSubmitting}
            />
          )}
        </div>

        {/* Right: Auxiliar sidebar */}
        {!redesigned && currentStep !== 4 && auxiliarItems.length > 0 && (
          <aside className="w-[360px] max-w-full shrink-0">
            <div className="bg-neutral-100 p-32">
              <div className="admin-page__auxiliar-header">
                <Icon name="agora-line-question-mark" className="h-24 w-24" />
                <h2 className="admin-page__auxiliar-title">{t("admin-common:auxiliary.title")}</h2>
              </div>
              <AuxiliarList items={auxiliarItems} />
            </div>
          </aside>
        )}
      </div>
    </ModalProvider>
  );
}
