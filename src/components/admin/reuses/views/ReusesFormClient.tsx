"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { DropdownOption, DropdownSection } from "@ama-pt/agora-design-system";
import { fetchMyDatasets } from "@/service/api/datasets";
import { fetchOrgDatasets } from "@/service/api/organizations";
import {
  createReuse,
  fetchReuseTopics,
  fetchReuseTypes,
  linkDatasetToReuse,
  linkDataserviceToReuse,
  updateReuse,
  uploadReuseImage,
} from "@/service/api/reuses";
import { searchDatasets } from "@/service/api/search";
import type { Dataset } from "@/service/types/dataset";
import type { Reuse, ReuseTopic, ReuseType } from "@/service/types/reuse";
import type { RemoteDatasetEntry } from "@/lib/reuse-remote-datasets";
import { useAuth } from "@/context/AuthContext";
import { localizeReuseTopic, localizeReuseType } from "@/lib/reuse-labels";
import {
  POISONED_FILE_WARNING,
  translateUploadError,
} from "@/lib/security/translateUploadError";
import AdminAuxiliarySidebar from "@/components/admin/AdminAuxiliarySidebar";
import { getReuseAuxiliarItems } from "@/components/admin/reuses/config/reusesAuxiliarItems";
import ReusesFormDetailsStep from "@/components/admin/reuses/form-steps/ReusesFormDetailsStep";
import ReusesFormDatasetsStep from "@/components/admin/reuses/form-steps/ReusesFormDatasetsStep";
import ReusesFormPublishStep from "@/components/admin/reuses/form-steps/ReusesFormPublishStep";
import { useFormErrors } from "@/hooks/forms/useFormErrors";
import { useKeywordSelect } from "@/hooks/forms/useKeywordSelect";
import {
  buildRemoteDatasetEntries,
  buildReuseCreatePayload,
  normalizeReuseUrl,
  type ReuseFormField,
  validateReuseDatasetSelection,
  validateReuseDetails,
} from "@/components/admin/reuses/form-state/reuseFormModel";
import {
  addRemoteDatasetEntry,
  clearIndexedErrorIfFilled,
  removeRemoteDatasetEntry,
  updateRemoteDatasetEntry,
} from "@/components/admin/reuses/form-state/reuseAssociationHelpers";
import type { BoReusesPage } from "@/service/types/admin/reuses";

interface ReusesFormClientProps {
  pageContent: BoReusesPage;
  currentStep: number;
  onNextStep: () => void;
  onPreviousStep: () => void;
}

export default function ReusesFormClient({
  pageContent,
  currentStep,
  onNextStep,
  onPreviousStep,
}: ReusesFormClientProps) {
  const { t } = useTranslation("admin-reuses");
  const { user, hasOrganization } = useAuth();
  const selectedProducerRef = useRef("user");
  const selectedReuseTypeRef = useRef("");
  const selectedReuseTopicRef = useRef("");
  const selectedKeywordsRef = useRef("");

  const [reuseName, setReuseName] = useState("");
  const [reuseLink, setReuseLink] = useState("");
  const [reuseLinkInvalid, setReuseLinkInvalid] = useState(false);
  const [reuseDescription, setReuseDescription] = useState("");
  const [reuseCoverImageFile, setReuseCoverImageFile] = useState<File | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdReuse, setCreatedReuse] = useState<Reuse | null>(null);
  const {
    errors: formErrors,
    hasError,
    setErrors,
    clearError,
    resetErrors,
    focusFirstError,
  } = useFormErrors<ReuseFormField>();

  const [reuseTypes, setReuseTypes] = useState<ReuseType[]>([]);
  const [reuseTopics, setReuseTopics] = useState<ReuseTopic[]>([]);
  const [selectedKeywordsValue, setSelectedKeywordsValue] = useState("");
  const [selectedProducerValue, setSelectedProducerValue] = useState("user");
  const [selectedReuseTypeValue, setSelectedReuseTypeValue] = useState("");
  const [selectedReuseTopicValue, setSelectedReuseTopicValue] = useState("");

  const [datasetLinks, setDatasetLinks] = useState<RemoteDatasetEntry[]>([{ url: "" }]);
  const [datasetLinkErrors, setDatasetLinkErrors] = useState<Record<number, string>>({});
  const [apiLinks, setApiLinks] = useState([{ url: "" }]);
  const [apiLinkErrors, setApiLinkErrors] = useState<Record<number, string>>({});
  const [myDatasets, setMyDatasets] = useState<Dataset[]>([]);
  const [selectedDatasets, setSelectedDatasets] = useState<Dataset[]>([]);
  const [datasetSearch, setDatasetSearch] = useState("");
  const [datasetSearchResults, setDatasetSearchResults] = useState<Dataset[]>([]);
  const [producerId, setProducerId] = useState<string>("user");

  useEffect(() => {
    fetchReuseTypes().then(setReuseTypes);
    fetchReuseTopics().then(setReuseTopics);
  }, []);

  useEffect(() => {
    const dedupe = (items: Dataset[]) =>
      Array.from(new Map(items.map((dataset) => [dataset.id, dataset])).values());

    if (producerId === "user" || producerId === "") {
      const personal = fetchMyDatasets(1, 100);
      const organizations = (user?.organizations || []).map((organization) =>
        fetchOrgDatasets(organization.id, 1, 100),
      );

      Promise.all([personal, ...organizations]).then((results) => {
        const all = results.flatMap((result) => result.data || []);
        setMyDatasets(dedupe(all));
      });
    } else {
      fetchOrgDatasets(producerId, 1, 100).then((result) =>
        setMyDatasets(dedupe(result.data || [])),
      );
    }
  }, [producerId, user?.organizations]);

  const clearStep2Errors = useCallback(() => {
    setDatasetLinkErrors({});
    setApiLinkErrors({});
  }, []);

  const goToNextStep = useCallback(() => {
    clearStep2Errors();
    onNextStep();
  }, [clearStep2Errors, onNextStep]);

  const goToPreviousStep = useCallback(() => {
    clearStep2Errors();
    onPreviousStep();
  }, [clearStep2Errors, onPreviousStep]);

  useEffect(() => {
    const query = datasetSearch.trim();
    if (query.length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await searchDatasets(query, 1, 20);
        setDatasetSearchResults(response.data || []);
      } catch {
        setDatasetSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [datasetSearch]);

  const selectedKeywords = useMemo(
    () =>
      selectedKeywordsValue
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    [selectedKeywordsValue],
  );
  const {
    keywordOptions: keywordsChildren,
    setKeywordSearch,
    registerSelectedKeywordValue,
  } = useKeywordSelect({
    selectedKeywords,
    includeSelectedOutsideSuggestions: false,
  });

  const handleKeywordChange = useCallback(
    (value: string) => {
      setSelectedKeywordsValue(value);
      registerSelectedKeywordValue(value);
    },
    [registerSelectedKeywordValue],
  );

  const handleStep1Next = async () => {
    const errors = validateReuseDetails({
      name: reuseName,
      url: reuseLink,
      type: selectedReuseTypeRef.current,
      topic: selectedReuseTopicRef.current,
      description: reuseDescription,
      messages: {
        reuseName: t("form.validationErrors.name"),
        reuseLink: reuseLink.trim()
          ? t("form.validationErrors.urlInvalid")
          : t("form.validationErrors.urlRequired"),
        reuseType: t("form.validationErrors.type"),
        reuseTopic: t("form.validationErrors.topic"),
        reuseDescription: t("form.validationErrors.description"),
      },
    });
    setReuseLinkInvalid(Boolean(reuseLink.trim() && errors.reuseLink));

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      focusFirstError();
      return;
    }

    resetErrors();
    setApiError(null);
    setIsSubmitting(true);

    try {
      const payload = buildReuseCreatePayload({
        name: reuseName,
        url: reuseLink,
        type: selectedReuseTypeRef.current,
        topic: selectedReuseTopicRef.current,
        description: reuseDescription,
        producer: selectedProducerRef.current,
        keywords: selectedKeywordsValue,
      });

      const reuse = createdReuse
        ? await updateReuse(createdReuse.id, payload)
        : await createReuse(payload);

      if (reuseCoverImageFile) {
        await uploadReuseImage(reuse.id, reuseCoverImageFile);
      }

      setCreatedReuse(reuse);
      goToNextStep();
    } catch (error: unknown) {
      const err = error as {
        status?: number;
        data?: { errors?: Record<string, string>; message?: string };
      };

      const fieldLabels: Record<string, string> = {
        url: t("form.fieldLabels.url"),
        title: t("form.fieldLabels.title"),
        description: t("form.fieldLabels.description"),
        type: t("form.fieldLabels.type"),
        topic: t("form.fieldLabels.topic"),
        organization: t("form.fieldLabels.organization"),
      };
      const errorMessages: Record<string, string> = {
        "This URL is already registered": t("form.errorMessages.urlRegistered"),
      };

      if (err.status === 500) {
        setApiError(t("form.errorMessages.server"));
      } else if (err.data?.errors && typeof err.data.errors === "object") {
        const messages = Object.entries(err.data.errors)
          .map(([field, message]) => {
            const label = fieldLabels[field] || field;
            const translated = errorMessages[String(message)] || String(message);
            return `${label}: ${translated}`;
          })
          .join("\n");
        setApiError(messages);
      } else if (err.data?.message) {
        const translated = errorMessages[err.data.message] || err.data.message;
        setApiError(translateUploadError(translated));
      } else {
        setApiError(t("form.errorMessages.create"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDatasetUrlChange = (index: number, value: string) => {
    setDatasetLinks((previous) => updateRemoteDatasetEntry(previous, index, { url: value }));
    setDatasetLinkErrors((previous) => clearIndexedErrorIfFilled(previous, index, value));
  };

  const handleDatasetTitleChange = (index: number, value: string) => {
    setDatasetLinks((previous) => updateRemoteDatasetEntry(previous, index, { title: value }));
  };

  const handleDatasetDescriptionChange = (index: number, value: string) => {
    setDatasetLinks((previous) =>
      updateRemoteDatasetEntry(previous, index, { description: value }),
    );
  };

  const addDatasetLink = () => {
    const result = addRemoteDatasetEntry(
      datasetLinks,
      datasetLinkErrors,
      t("form.fieldRequired"),
    );
    setDatasetLinks(result.entries);
    setDatasetLinkErrors(result.errors);
  };

  const removeDatasetLink = (index: number) => {
    const result = removeRemoteDatasetEntry(datasetLinks, datasetLinkErrors, index);
    setDatasetLinks(result.entries);
    setDatasetLinkErrors(result.errors);
  };

  const auxiliarItems = getReuseAuxiliarItems({
    items: pageContent.createAuxiliaryItems,
  });

  const producerOptions = useMemo(() => {
    const options = [
      <DropdownOption key="user" value="user">
        {user ? `${user.first_name} ${user.last_name}` : t("form.producerSelf")}
      </DropdownOption>,
      ...(user?.organizations || []).map((organization) => (
        <DropdownOption key={organization.id} value={organization.id}>
          {organization.name}
        </DropdownOption>
      )),
    ];
    return <DropdownSection name="identity">{options}</DropdownSection>;
  }, [t, user]);

  const typeOptions = useMemo(
    () => (
      <DropdownSection name="types">
        {reuseTypes.map((type) => (
          <DropdownOption key={type.id} value={type.id}>
            {localizeReuseType(type)}
          </DropdownOption>
        ))}
      </DropdownSection>
    ),
    [reuseTypes],
  );

  const datasetOptions = useMemo(() => {
    const selectedIds = new Set(selectedDatasets.map((dataset) => dataset.id));
    const visibleDatasetSearchResults =
      datasetSearch.trim().length >= 2 ? datasetSearchResults : [];
    const combined: Dataset[] = [...selectedDatasets, ...visibleDatasetSearchResults, ...myDatasets];
    const unique = Array.from(new Map(combined.map((dataset) => [dataset.id, dataset])).values());
    const options = unique.map((dataset) => (
      <DropdownOption
        key={dataset.id}
        value={dataset.id}
        selected={selectedIds.has(dataset.id)}
      >
        {dataset.title}
      </DropdownOption>
    ));
    return <DropdownSection name="datasets">{options}</DropdownSection>;
  }, [datasetSearch, datasetSearchResults, myDatasets, selectedDatasets]);

  const topicOptions = useMemo(
    () => (
      <DropdownSection name="themes">
        {reuseTopics.map((topic) => (
          <DropdownOption key={topic.id} value={topic.id}>
            {localizeReuseTopic(topic)}
          </DropdownOption>
        ))}
      </DropdownSection>
    ),
    [reuseTopics],
  );

  return (
    <div className="admin-page__body">
      <div className="admin-page__form-area">
        {/* Step 1 */}
        {currentStep === 1 && (
          <ReusesFormDetailsStep
            introduction={pageContent.introduction}
            apiError={apiError}
            hasOrganization={hasOrganization}
            selectedProducerRef={selectedProducerRef}
            selectedProducerValue={selectedProducerValue}
            producerOptions={producerOptions}
            onProducerChange={(value) => {
              const nextValue = value || "user";
              selectedProducerRef.current = nextValue;
              setSelectedProducerValue(nextValue);
              setProducerId(nextValue);
              setSelectedDatasets([]);
              setDatasetSearch("");
              setDatasetSearchResults([]);
            }}
            reuseName={reuseName}
            reuseLink={reuseLink}
            reuseLinkInvalid={reuseLinkInvalid}
            reuseDescription={reuseDescription}
            formErrors={formErrors}
            onReuseNameChange={(event) => {
              setReuseName(event.target.value);
              if (event.target.value.trim()) clearError("reuseName");
            }}
            onReuseLinkChange={(event) => {
              const value = event.target.value;
              setReuseLink(value);
              if (value.trim()) {
                clearError("reuseLink");
                setReuseLinkInvalid(!normalizeReuseUrl(value));
              } else {
                setReuseLinkInvalid(false);
              }
            }}
            selectedReuseTypeRef={selectedReuseTypeRef}
            typeOptions={typeOptions}
            selectedReuseTypeValue={selectedReuseTypeValue}
            onReuseTypeChange={(value) => {
              const nextValue = value || "";
              selectedReuseTypeRef.current = nextValue;
              setSelectedReuseTypeValue(nextValue);
            }}
            selectedReuseTopicRef={selectedReuseTopicRef}
            topicOptions={topicOptions}
            selectedReuseTopicValue={selectedReuseTopicValue}
            onReuseTopicChange={(value) => {
              const nextValue = value || "";
              selectedReuseTopicRef.current = nextValue;
              setSelectedReuseTopicValue(nextValue);
            }}
            onReuseDescriptionChange={(event) => {
              setReuseDescription(event.target.value);
              if (event.target.value.trim()) clearError("reuseDescription");
            }}
            selectedKeywordsRef={selectedKeywordsRef}
            keywordsChildren={keywordsChildren}
            selectedKeywordsValue={selectedKeywordsValue}
            onKeywordSearch={setKeywordSearch}
            onKeywordChange={(value) => {
              selectedKeywordsRef.current = value;
              handleKeywordChange(value);
            }}
            onKeywordRemove={(keyword) => {
              const next = selectedKeywordsValue
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean)
                .filter((value) => value.toLowerCase() !== keyword.toLowerCase())
                .join(",");
              setSelectedKeywordsValue(next);
              selectedKeywordsRef.current = next;
            }}
            reuseCoverImageFile={reuseCoverImageFile}
            onReuseCoverImageChange={(event) => {
              const files = event.target.files;
              setReuseCoverImageFile(files && files.length > 0 ? files[0] : null);
              clearError("reuseCoverImage");
            }}
            onReuseCoverImageSecurityError={() => setApiError(POISONED_FILE_WARNING)}
            onPreviousStep={goToPreviousStep}
            onNextStep={handleStep1Next}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Step 2 */}
        {currentStep === 2 && (
          <ReusesFormDatasetsStep
            datasetAssociationInfo={pageContent.datasetAssociationInfo}
            datasetAssociationWarning={pageContent.datasetAssociationWarning}
            apiError={apiError}
            producerId={producerId}
            datasetOptions={datasetOptions}
            selectedDatasets={selectedDatasets}
            datasetSearchResults={datasetSearchResults}
            myDatasets={myDatasets}
            onDatasetSearch={setDatasetSearch}
            onSelectedDatasetsChange={setSelectedDatasets}
            onSelectedDatasetRemove={(datasetId) => {
              setSelectedDatasets((previous) =>
                previous.filter((dataset) => dataset.id !== datasetId),
              );
            }}
            datasetLinks={datasetLinks}
            datasetLinkErrors={datasetLinkErrors}
            onDatasetUrlChange={handleDatasetUrlChange}
            onDatasetTitleChange={handleDatasetTitleChange}
            onDatasetDescriptionChange={handleDatasetDescriptionChange}
            onDatasetLinkRemove={removeDatasetLink}
            onDatasetLinkAdd={addDatasetLink}
            onPreviousStep={goToPreviousStep}
            onNextStep={async () => {
              if (!createdReuse) return;

              const remoteEntries = buildRemoteDatasetEntries(datasetLinks);
              const hasRemote = remoteEntries.length > 0;

              const selectionError = validateReuseDatasetSelection(
                selectedDatasets.length,
                remoteEntries,
                t("form.validationErrors.datasetSelection"),
              );
              if (selectionError) {
                setApiError(selectionError);
                return;
              }

              setIsSubmitting(true);
              setApiError(null);
              try {
                for (const dataset of selectedDatasets) {
                  const updated = await linkDatasetToReuse(createdReuse.id, dataset.id);
                  setCreatedReuse(updated);
                }

                if (hasRemote) {
                  const updated = await updateReuse(createdReuse.id, {
                    extras: {
                      ...(createdReuse.extras || {}),
                      remote_datasets: remoteEntries,
                    },
                  });
                  setCreatedReuse(updated);
                }

                for (const link of apiLinks) {
                  if (link.url.trim()) {
                    try {
                      await linkDataserviceToReuse(createdReuse.id, link.url.trim());
                    } catch {
                      // API links UI is hidden for now.
                    }
                  }
                }

                goToNextStep();
              } catch (error: unknown) {
                const err = error as { data?: Record<string, unknown> };
                if (err.data && typeof err.data === "object") {
                  const messages = Object.entries(err.data)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(", ");
                  setApiError(messages);
                } else {
                  setApiError(t("form.errorMessages.associateData"));
                }
              } finally {
                setIsSubmitting(false);
              }
            }}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Step 3 */}
        {currentStep === 3 && (
          <ReusesFormPublishStep
            createdCard={pageContent.createdCard}
            createdReuse={createdReuse}
            reuseName={reuseName}
            reuseDescription={reuseDescription}
            apiError={apiError}
            isSubmitting={isSubmitting}
            onPublish={async () => {
              if (!createdReuse) return;
              setIsSubmitting(true);
              setApiError(null);
              try {
                await updateReuse(createdReuse.id, { private: false });
                window.location.href = "/admin/me/reuses";
              } catch {
                setApiError(t("form.errorMessages.publish"));
              } finally {
                setIsSubmitting(false);
              }
            }}
          />
        )}
      </div>

      {currentStep === 1 && auxiliarItems.length > 0 && (
        <AdminAuxiliarySidebar items={auxiliarItems} />
      )}
    </div>
  );
}
