"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StatusCard } from "@ama-pt/agora-design-system";
import {
  createCommunityResource,
  uploadCommunityResourceFile,
} from "@/service/api/community-resources";
import { fetchDataset, fetchMyDatasets, fetchResourceTypes } from "@/service/api/datasets";
import type { ResourceType } from "@/service/types/catalog";
import type { CommunityResource } from "@/service/types/community-resource";
import type { Dataset } from "@/service/types/dataset";
import { useAuth } from "@/context/AuthContext";
import { POISONED_FILE_WARNING } from "@/lib/security/translateUploadError";
import { MAX_UPLOAD_SIZE } from "@/lib/security/constants";
import { useFormErrors } from "@/hooks/forms/useFormErrors";
import { useAsyncSubmit } from "@/hooks/forms/useAsyncSubmit";
import { normalizeApiError } from "@/service/utils/normalizeApiError";
import {
  buildDatasetItems,
  buildProducerItems,
  buildResourceTypeItems,
  buildSchemaItems,
  renderDropdownSection,
} from "@/components/admin/community-resources/config/dropdownOptions";
import {
  handleRequiredTextFieldChange,
  handleSchemaUrlFieldChange,
  handleTextFieldChange,
} from "@/components/admin/community-resources/form-state/communityResourceFieldHandlers";
import { buildValidationErrors } from "@/components/admin/community-resources/form-state/communityResourceValidation";
import { getCreateCommunityResourceAuxiliaryItems } from "@/components/admin/community-resources/config/communityResourceAuxiliaryContent";
import CreatedResourceCard from "@/components/admin/community-resources/form-ui/CreatedResourceCard";
import ProducerSection from "@/components/admin/community-resources/form-sections/ProducerSection";
import FileOrLinkSection from "@/components/admin/community-resources/form-sections/FileOrLinkSection";
import ResourceDescriptionSection from "@/components/admin/community-resources/form-sections/ResourceDescriptionSection";
import SchemaSection from "@/components/admin/community-resources/form-sections/SchemaSection";
import DatasetSelectionSection from "@/components/admin/community-resources/form-sections/DatasetSelectionSection";
import FormStatusMessages from "@/components/admin/community-resources/form-ui/FormStatusMessages";
import CommunityResourceAuxiliarySidebar from "@/components/admin/community-resources/form-ui/CommunityResourceAuxiliarySidebar";
import AdminStepActions from "@/components/admin/forms/AdminStepActions";
import type { BoCommunityResourcesPage } from "@/service/types/admin/community-resources";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface CommunityResourceFormClientProps {
  datasetId: string;
  currentStep: number;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onPublicPageReady?: (url: string) => void;
  pageContent: BoCommunityResourcesPage;
}

type CommunityResourceCreateField = "title" | "resourceUrl" | "type" | "dataset";

function normalizeCommunityResourceUrl(resourceUrl: string, file: File | null) {
  if (file) {
    return "https://example.com/placeholder";
  }

  const trimmedUrl = resourceUrl.trim();
  return trimmedUrl.match(/^https?:\/\//) ? trimmedUrl : `https://${trimmedUrl}`;
}

export default function CommunityResourceFormClient({
  datasetId,
  currentStep,
  onNextStep,
  onPreviousStep,
  onPublicPageReady,
  pageContent,
}: CommunityResourceFormClientProps) {
  const { user } = useAuth();
  const { t } = useTranslation("admin-community-resources");

  const [title, setTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [description, setDescription] = useState("");
  const selectedTypeRef = useRef("");
  const selectedProducerRef = useRef("");
  const selectedSchemaRef = useRef("");
  const [schemaUrl, setSchemaUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [createdResource, setCreatedResource] = useState<CommunityResource | null>(null);

  const [myDatasets, setMyDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(datasetId);

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const activeDataset = selectedDatasetId ? dataset : null;

  const {
    hasError,
    setErrors,
    clearError,
    setError,
    resetErrors,
    focusFirstError,
  } = useFormErrors<CommunityResourceCreateField>();

  const { isSubmitting, run } = useAsyncSubmit({
    clearError: () => setApiError(null),
    onError: (error) => {
      const normalized = normalizeApiError(error, t("form.createError"));
      if (normalized.status === 401) {
        setApiError(t("form.sessionExpired"));
        return;
      }
      setApiError(normalized.message || t("form.createError"));
    },
  });

  useEffect(() => {
    if (!selectedDatasetId) {
      return;
    }

    fetchDataset(selectedDatasetId)
      .then(setDataset)
      .catch(() => console.error("Error loading dataset"));
  }, [selectedDatasetId]);

  useEffect(() => {
    fetchResourceTypes()
      .then(setResourceTypes)
      .catch(() => console.error("Error loading resource types"));
  }, []);

  useEffect(() => {
    if (datasetId) {
      return;
    }

    fetchMyDatasets(1, 50)
      .then((response) => setMyDatasets(response.data || []))
      .catch(() => console.error("Error loading datasets"));
  }, [datasetId]);

  function getValidationErrors() {
    return buildValidationErrors<CommunityResourceCreateField>({
      title: !title.trim(),
      resourceUrl: !file && !resourceUrl.trim(),
      type: !selectedTypeRef.current,
      dataset: !selectedDatasetId,
    });
  }

  function getPublicPageUrl() {
    return activeDataset
      ? `/datasets/${activeDataset.slug}`
      : "/admin/me/community-resources";
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    const selected = files && files.length > 0 ? files[0] : null;

    if (selected && selected.size > MAX_UPLOAD_SIZE) {
      setFileError(t("form.fileTooLarge"));
      setFile(null);
      return;
    }

    setFileError(null);
    setFile(selected);

    if (selected) {
      clearError("resourceUrl");
    }
  }

  function handleDatasetChange(options: { value: string }[]) {
    if (options.length > 0) {
      setSelectedDatasetId(options[0].value);
      clearError("dataset");
      return;
    }

    setSelectedDatasetId("");
    setError("dataset");
  }

  function handleResourceUrlChange(event: React.ChangeEvent<HTMLInputElement>) {
    handleRequiredTextFieldChange(event, setResourceUrl, clearError, "resourceUrl");
  }

  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    handleRequiredTextFieldChange(event, setTitle, clearError, "title");
  }

  function handleSchemaUrlChange(event: React.ChangeEvent<HTMLInputElement>) {
    handleSchemaUrlFieldChange(event, setSchemaUrl);
  }

  function handleDescriptionChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    handleTextFieldChange(event, setDescription);
  }

  function handleTypeChange() {
    clearError("type");
  }

  function handleRemoveSelectedDataset() {
    setSelectedDatasetId("");
    setDataset(null);
    clearError("dataset");
  }

  const handleStep1Next = async () => {
    const errors = getValidationErrors();

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      focusFirstError();
      if (errors.dataset) {
        setApiError(t("form.selectDataset"));
      }
      return;
    }

    resetErrors();

    await run(async () => {
      const resource = await createCommunityResource(buildCreatePayload());

      if (file) {
        await uploadCommunityResourceFile(resource.id, file);
      }

      setCreatedResource(resource);
      onPublicPageReady?.(getPublicPageUrl());
      onNextStep();
    });
  };

  const auxiliarItems = getCreateCommunityResourceAuxiliaryItems({
    hasResourceUrlError: hasError("resourceUrl"),
    hasTitleError: hasError("title"),
    hasTypeError: hasError("type"),
    items: pageContent.createAuxiliaryItems,
  });

  const producerOptions = useMemo(
    () =>
      renderDropdownSection(
        "identity",
        buildProducerItems(
          user
            ? `${user.first_name} ${user.last_name}`
            : t("form.producerSelf"),
          (user?.organizations || []).map((organization) => ({
            id: organization.id,
            name: organization.name,
          })),
        ),
      ),
    [t, user],
  );

  const typeOptions = useMemo(
    () => renderDropdownSection("types", buildResourceTypeItems(resourceTypes)),
    [resourceTypes],
  );

  const schemaOptions = useMemo(
    () => renderDropdownSection("schemas", buildSchemaItems([])),
    [],
  );

  const datasetOptions = useMemo(
    () => renderDropdownSection("datasets", buildDatasetItems(myDatasets)),
    [myDatasets],
  );

  function buildCreatePayload() {
    return {
      title: title.trim(),
      url: normalizeCommunityResourceUrl(resourceUrl, file),
      filetype: "remote" as const,
      type: selectedTypeRef.current || undefined,
      description: description.trim() || undefined,
      dataset: selectedDatasetId,
      ...(selectedProducerRef.current && selectedProducerRef.current !== "user"
        ? { organization: selectedProducerRef.current }
        : {}),
    };
  }

  return (
    <>
      <div className="admin-page__body">
        <div className="admin-page__form-area">
          {currentStep === 1 && (
            <>
              {pageContent.introduction ? (
                <StatusCard
                  variant="informative"
                  showIcon
                  description={
                    <>
                      <strong>{pageContent.introduction.title}</strong>
                      <br />
                      {formatHtmlParagraphs(pageContent.introduction.description)}
                    </>
                  }
                />
              ) : null}

              <FormStatusMessages errorMessage={apiError} errorClassName="mb-16 mt-32" />

              <form
                className="admin-page__form"
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleStep1Next();
                }}
              >
                <p className="pt-32 text-base leading-7 text-neutral-900">
                  {t("form.requiredFields")}
                </p>

                <ProducerSection
                  producerOptions={producerOptions}
                  selectedProducerRef={selectedProducerRef}
                  helper={pageContent.producerHelper}
                />

                <FileOrLinkSection
                  file={file}
                  fileError={fileError}
                  resourceUrl={resourceUrl}
                  hasResourceUrlError={hasError("resourceUrl")}
                  onFileChange={handleFileChange}
                  onSecurityError={() => setFileError(POISONED_FILE_WARNING)}
                  onResourceUrlChange={handleResourceUrlChange}
                />

                <ResourceDescriptionSection
                  title={title}
                  description={description}
                  typeOptions={typeOptions}
                  selectedTypeRef={selectedTypeRef}
                  hasTitleError={hasError("title")}
                  hasTypeError={hasError("type")}
                  onTitleChange={handleTitleChange}
                  onDescriptionChange={handleDescriptionChange}
                  onTypeChange={handleTypeChange}
                />

                <SchemaSection
                  schemaOptions={schemaOptions}
                  selectedSchemaRef={selectedSchemaRef}
                  schemaUrl={schemaUrl}
                  onSchemaUrlChange={handleSchemaUrlChange}
                />

                <DatasetSelectionSection
                  datasetId={datasetId}
                  activeDataset={activeDataset}
                  datasetOptions={datasetOptions}
                  hasDatasetError={hasError("dataset")}
                  onDatasetChange={handleDatasetChange}
                  onRemoveSelectedDataset={handleRemoveSelectedDataset}
                />

                <AdminStepActions
                  className="admin-page__actions flex justify-between gap-[18px]"
                  previousAction={{
                    label: t("form.previous"),
                    appearance: "outline",
                    variant: "primary",
                    hasIcon: true,
                    leadingIcon: "agora-line-arrow-left-circle",
                    leadingIconHover: "agora-solid-arrow-left-circle",
                    onClick: onPreviousStep,
                  }}
                  primaryAction={{
                    label: isSubmitting ? t("form.creating") : t("form.next"),
                    type: "submit",
                    hasIcon: true,
                    trailingIcon: "agora-line-arrow-right-circle",
                    trailingIconHover: "agora-solid-arrow-right-circle",
                    disabled: isSubmitting,
                  }}
                />
              </form>
            </>
          )}

          {currentStep === 2 && (
            <>
              {pageContent.createdCard ? (
                <StatusCard
                  variant="success"
                  showIcon
                  description={
                    <>
                      <strong>{pageContent.createdCard.title}</strong>
                      <br />
                      {formatHtmlParagraphs(pageContent.createdCard.description)}
                    </>
                  }
                />
              ) : null}

              {createdResource && <CreatedResourceCard resource={createdResource} />}

              <FormStatusMessages errorMessage={apiError} errorClassName="mb-16 mt-32" />
            </>
          )}
        </div>

        {currentStep === 1 && auxiliarItems.length > 0 ? (
          <CommunityResourceAuxiliarySidebar items={auxiliarItems} />
        ) : null}
      </div>
    </>
  );
}
