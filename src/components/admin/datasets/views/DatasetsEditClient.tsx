"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useRouter, useParams, usePathname } from "next/navigation";
import {
  Button,
  StatusCard,
  Tabs,
  Tab,
  TabHeader,
  TabBody,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import AdminLayout from "@/components/Layout/AdminLayout";
import { adminProfileBasePath, useActiveProfile } from "@/context/ActiveProfileContext";
import { Dropdown } from "@/components/Primitives/Dropdown";
import { fetchActivity } from "@/service/api/activity";
import {
  fetchDataset,
  fetchLicenses,
  fetchFrequencies,
  fetchResourceTypes,
  fetchGranularities,
  fetchSpatialZonesByIds,
} from "@/service/api/datasets";
import { fetchDiscussions } from "@/service/api/discussions-topics";
import { suggestSpatialZones } from "@/service/api/search";
import { requestTransfer } from "@/service/api/transfers";
import type { RecipientSelection } from "@/components/admin/RecipientSelect";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import { ResourceStatusBanner } from "@/components/admin/ResourceStatusBanner";
import type {
  License,
  Frequency,
  Granularity,
  SpatialZone,
  Activity,
  ResourceType,
} from "@/service/types/catalog";
import type { Dataset } from "@/service/types/dataset";
import type { Discussion } from "@/service/types/discussion";
import DatasetsEditDeletePopup from "@/components/admin/datasets/edit-dialogs/DatasetsEditDeletePopup";
import DatasetsEditTransferPopup from "@/components/admin/datasets/edit-dialogs/DatasetsEditTransferPopup";
import DatasetsEditMetadataTab from "@/components/admin/datasets/edit-tabs/DatasetsEditMetadataTab";
import DatasetsEditResourcesTab from "@/components/admin/datasets/edit-tabs/DatasetsEditResourcesTab";
import DatasetsEditDiscussionsTab from "@/components/admin/datasets/edit-tabs/DatasetsEditDiscussionsTab";
import DatasetsEditActivitiesTab from "@/components/admin/datasets/edit-tabs/DatasetsEditActivitiesTab";
import { getFrequencyLabel } from "@/utils/frequencyLabels";
import { getGranularityLabel } from "@/utils/granularityLabels";
import { translateActivityLabel } from "@/utils/activityLabels";
import { useFormErrors } from "@/hooks/forms/useFormErrors";
import { useKeywordSelect } from "@/hooks/forms/useKeywordSelect";
import { useTemporaryMessage } from "@/hooks/forms/useTemporaryMessage";
import { useDatasetLifecycleActions } from "@/components/admin/datasets/hooks/useDatasetLifecycleActions";
import { useDatasetMetadataActions } from "@/components/admin/datasets/hooks/useDatasetMetadataActions";
import { useDatasetResourceActions } from "@/components/admin/datasets/hooks/useDatasetResourceActions";
import { type DatasetEditField } from "@/components/admin/datasets/form-state/datasetEditFormModel";
import type { BoDatasetsPage } from "@/service/types/admin/datasets";

import { can } from "@/utils/permissions";
import { localizeHref } from "@/utils/localizeHref";
import { splitLocale } from "@/utils/stripLocale";

interface DatasetsEditClientProps {
  pageContent: BoDatasetsPage;
}

export default function DatasetsEditClient({ pageContent }: DatasetsEditClientProps) {
  const { t } = useTranslation("admin-datasets");
  const { activeProfile } = useActiveProfile();
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const { locale } = splitLocale(usePathname());
  const listUrl = localizeHref(`${adminProfileBasePath(activeProfile)}/datasets`, locale);
  const { show, hide } = usePopupContext();
  const datasetId = (params?.datasetId as string) || searchParams.get("id") || "";
  const slug = searchParams.get("slug") || datasetId;

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [acronym, setAcronym] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const selectedLicenseRef = useRef("");
  const selectedFrequencyRef = useRef("");
  const [temporalStart, setTemporalStart] = useState("");
  const [temporalEnd, setTemporalEnd] = useState("");
  const [featured, setFeatured] = useState(false);
  const keywordsRef = useRef("");
  const spatialCoverageRef = useRef("");
  const spatialGranularityRef = useRef("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isUploadingRef = useRef(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    message: apiSuccess,
    setMessage: setApiSuccess,
    setTemporaryMessage: showApiSuccess,
  } = useTemporaryMessage<string | null>(null);
  const {
    errors: formErrors,
    setErrors,
    clearError,
    resetErrors,
    focusFirstError,
  } = useFormErrors<DatasetEditField>();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [granularities, setGranularities] = useState<Granularity[]>([]);
  const [spatialZones, setSpatialZones] = useState<SpatialZone[]>([]);
  const [spatialZoneSearch, setSpatialZoneSearch] = useState<SpatialZone[]>([]);
  const spatialZoneSearchRef = useRef<SpatialZone[]>([]);
  const [selectedSpatialZonesValue, setSelectedSpatialZonesValue] = useState("");
  const [loadedTitle, setLoadedTitle] = useState("");
  const [loadedAcronym, setLoadedAcronym] = useState("");
  const [loadedLicense, setLoadedLicense] = useState("");
  const [loadedFrequency, setLoadedFrequency] = useState("");
  const [loadedKeywords, setLoadedKeywords] = useState("");
  const [loadedSpatialGranularity, setLoadedSpatialGranularity] = useState("");
  const [loadedSpatialZones, setLoadedSpatialZones] = useState<string[]>([]);
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [discussionsLoaded, setDiscussionsLoaded] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [ds, licensesData, frequenciesData, granularitiesData, resTypes] = await Promise.all([
          fetchDataset(slug),
          fetchLicenses(),
          fetchFrequencies(),
          fetchGranularities(),
          fetchResourceTypes(),
        ]);
        setDataset(ds);
        setTitle(ds.title);
        setAcronym(ds.acronym || "");
        setLoadedTitle(ds.title);
        setLoadedAcronym(ds.acronym || "");
        setDescription(ds.description);
        setShortDescription(ds.description_short || "");
        setFeatured(ds.featured || false);

        const license = ds.license || "";
        const frequency = ds.frequency || "";
        const keywords = (ds.tags || []).join(",");
        const spatialGranularity = ds.spatial?.granularity || "";

        selectedLicenseRef.current = license;
        selectedFrequencyRef.current = frequency;
        keywordsRef.current = keywords;
        spatialGranularityRef.current = spatialGranularity;

        setLoadedLicense(license);
        setLoadedFrequency(frequency);
        setLoadedKeywords(keywords);
        setLoadedSpatialGranularity(spatialGranularity);

        if (ds.temporal_coverage) {
          const toDateOnly = (iso: string) => {
            if (!iso) return "";
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(iso)) return iso;
            const d = new Date(iso);
            if (isNaN(d.getTime())) return iso;
            return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
          };
          setTemporalStart(toDateOnly(ds.temporal_coverage.start || ""));
          setTemporalEnd(toDateOnly(ds.temporal_coverage.end || ""));
        }
        setLicenses(licensesData);
        setFrequencies(frequenciesData);
        setGranularities(granularitiesData);
        setResourceTypes(resTypes);

        suggestSpatialZones("", 20).then((results) => {
          spatialZoneSearchRef.current = results ?? [];
          setSpatialZoneSearch(results ?? []);
        });

        if (ds.spatial?.zones?.length) {
          fetchSpatialZonesByIds(ds.spatial.zones).then((currentZones) => {
            const currentIds = currentZones.map((z) => z.id);
            setSpatialZones(currentZones);
            setLoadedSpatialZones(currentIds);
            setSelectedSpatialZonesValue(currentIds.join(","));
            spatialCoverageRef.current = currentIds.join(",");
          });
        }
      } catch (error) {
        console.error("Error loading dataset:", error);
        setApiError(t("edit.loadError"));
      } finally {
        setIsLoading(false);
      }
    }
    if (slug) void loadData();
  }, [slug, t]);

  const loadDiscussions = () => {
    if (discussionsLoaded || !dataset) return;
    setDiscussionsLoading(true);
    fetchDiscussions(dataset.id)
      .then((res) => {
        setDiscussions(res.data);
        setDiscussionsLoaded(true);
      })
      .catch((err) => console.error("Error loading discussions:", err))
      .finally(() => setDiscussionsLoading(false));
  };

  const loadActivities = () => {
    if (activitiesLoaded || !dataset) return;
    setActivitiesLoading(true);
    fetchActivity(dataset.id)
      .then((res) => {
        setActivities(res.data);
        setActivitiesLoaded(true);
      })
      .catch((err) => console.error("Error loading activities:", err))
      .finally(() => setActivitiesLoading(false));
  };

  const licenseOptions = useMemo(() => {
    const options = licenses.map((license) => (
      <Dropdown.Option key={license.id} value={license.id} selected={license.id === loadedLicense}>
        {license.title}
      </Dropdown.Option>
    ));
    return <Dropdown.Section name="licenses">{options}</Dropdown.Section>;
  }, [licenses, loadedLicense]);

  const frequencyDefaultValue = loadedFrequency;

  const frequencyOptions = useMemo(() => {
    const options = frequencies.map((freq) => (
      <Dropdown.Option key={freq.id} value={freq.id} selected={freq.id === frequencyDefaultValue}>
        {getFrequencyLabel(freq.id, freq.label, (key, options) => t(`datasets:${key}`, options))}
      </Dropdown.Option>
    ));
    return <Dropdown.Section name="frequencies">{options}</Dropdown.Section>;
  }, [frequencies, frequencyDefaultValue, t]);

  const selectedKeywords = useMemo(
    () => (loadedKeywords ? loadedKeywords.split(",").filter(Boolean) : []),
    [loadedKeywords]
  );
  const { keywordOptions, setKeywordSearch, registerSelectedKeywordValue } = useKeywordSelect({
    selectedKeywords,
  });

  const allSpatialZones = useMemo(() => {
    const seen = new Set<string>();
    const merged: SpatialZone[] = [];
    for (const z of [...spatialZones, ...spatialZoneSearch]) {
      if (!seen.has(z.id)) {
        seen.add(z.id);
        merged.push(z);
      }
    }
    return merged.sort((a, b) => a.name.localeCompare(b.name, "pt"));
  }, [spatialZones, spatialZoneSearch]);

  const effectiveSpatialIds = (selectedSpatialZonesValue || loadedSpatialZones.join(","))
    .split(",")
    .filter(Boolean);
  const handleSpatialCoverageChange = useCallback((value: string) => {
    const normalized = value
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .join(",");
    setSelectedSpatialZonesValue(normalized);
    spatialCoverageRef.current = normalized;
    const ids = new Set(normalized.split(",").filter(Boolean));
    setSpatialZones((prev) => {
      const seen = new Set(prev.map((z) => z.id));
      const additions = spatialZoneSearchRef.current.filter(
        (z) => ids.has(z.id) && !seen.has(z.id)
      );
      const kept = prev.filter((z) => ids.has(z.id));
      if (additions.length === 0 && kept.length === prev.length) return prev;
      return [...kept, ...additions];
    });
  }, []);
  const selectedZoneObjects = useMemo<SpatialZone[]>(() => {
    const effective = selectedSpatialZonesValue || loadedSpatialZones.join(",");
    const ids = effective.split(",").filter(Boolean);
    if (ids.length === 0) return [];

    const zoneMap = new Map(allSpatialZones.map((z) => [z.id, z]));
    return ids.map((id) => zoneMap.get(id)).filter((z): z is SpatialZone => Boolean(z));
  }, [selectedSpatialZonesValue, loadedSpatialZones, allSpatialZones]);

  const spatialCoverageOptions = useMemo(() => {
    const effective = selectedSpatialZonesValue || loadedSpatialZones.join(",");
    const selectedIds = new Set(effective.split(",").filter(Boolean));
    const options = allSpatialZones.map((z) => (
      <Dropdown.Option key={z.id} value={z.id} selected={selectedIds.has(z.id)}>
        {z.code ? `${z.name} (${z.code})` : z.name}
      </Dropdown.Option>
    ));
    if (options.length === 0) {
      options.push(
        <Dropdown.Option key="empty" value="">
          —
        </Dropdown.Option>
      );
    }
    return <Dropdown.Section name="spatial-coverage">{options}</Dropdown.Section>;
  }, [allSpatialZones, selectedSpatialZonesValue, loadedSpatialZones]);

  const spatialGranularityOptions = useMemo(() => {
    const options = [
      <Dropdown.Option key="empty" value="">
        —
      </Dropdown.Option>,
      ...granularities.map((g) => (
        <Dropdown.Option key={g.id} value={g.id} selected={g.id === loadedSpatialGranularity}>
          {getGranularityLabel(g.id, g.name, (key, options) => t(`datasets:${key}`, options))}
        </Dropdown.Option>
      )),
    ];
    return <Dropdown.Section name="spatial-granularity">{options}</Dropdown.Section>;
  }, [granularities, loadedSpatialGranularity, t]);

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      if (value.trim()) clearError("title");
    },
    [clearError]
  );

  const { handleSaveMetadata } = useDatasetMetadataActions({
    dataset,
    title,
    description,
    shortDescription,
    acronym,
    featured,
    temporalStart,
    temporalEnd,
    keywordsRef,
    selectedLicenseRef,
    selectedFrequencyRef,
    spatialCoverageRef,
    spatialGranularityRef,
    setDataset,
    setIsSubmitting,
    setApiError,
    setApiSuccess,
    setErrors,
    resetErrors,
    focusFirstError,
    setSelectedSpatialZonesValue,
    showApiSuccess,
    focusAfterSave: () => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        tabsRef.current?.focus({ preventScroll: true });
      });
    },
  });

  const {
    handleArchiveDataset,
    handleDeleteDataset,
    handlePublishDataset,
    handleMoveToDraft,
    handleUnarchiveDataset,
  } = useDatasetLifecycleActions({
    listUrl,
    dataset,
    hide,
    push: router.push,
    keywordsRef,
    setDataset,
    setIsSubmitting,
    setApiError,
    showApiSuccess,
  });

  const handleTransferDataset = async (recipient: RecipientSelection, comment: string) => {
    if (!dataset) throw new Error(t("edit.notFound"));
    setApiError(null);
    setApiSuccess(null);
    await requestTransfer({
      subject: { class: "Dataset", id: dataset.id },
      recipient: { class: recipient.class, id: recipient.id },
      comment: comment || undefined,
    });
    hide();
    showApiSuccess(t("edit.transferRequested", { recipient: recipient.label }), 15000);
  };

  const { handleFilesUpload, handleUrlAdd, handleResourceClick } = useDatasetResourceActions({
    dataset,
    slug,
    resourceTypes,
    show,
    hide,
    setDataset,
    setIsSubmitting,
    setApiError,
    showApiSuccess,
    isUploadingRef,
  });

  if (isLoading) {
    return (
      <div className="admin-page">
        <p className="text-neutral-600">{t("edit.loading")}</p>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="admin-page">
        <StatusCard variant="danger" showIcon description={t("edit.notFound")} />
        <Button variant="primary" onClick={() => router.push(listUrl)}>
          {t("edit.back")}
        </Button>
      </div>
    );
  }

  const canEdit = can(dataset, "edit");
  const canDelete = can(dataset, "delete");
  const openTransfer = () =>
    show(
      <DatasetsEditTransferPopup datasetTitle={dataset.title} onConfirm={handleTransferDataset} />,
      { title: t("edit.transferTitle"), closeAriaLabel: t("edit.closeAriaLabel"), dimensions: "m" }
    );
  const openDelete = () =>
    show(<DatasetsEditDeletePopup onClose={hide} onConfirm={handleDeleteDataset} />, {
      title: t("edit.deleteModalTitle"),
      closeAriaLabel: t("edit.closeAriaLabel"),
      dimensions: "m",
    });
  const feedback =
    apiError || apiSuccess || dataset.archived || dataset.deleted ? (
      <div className="flex flex-col gap-32">
        {apiSuccess && (
          <StatusCard
            variant="success"
            showIcon
            description={apiSuccess}
            className="bg-success-600! text-white! [&_*]:text-white! [&_svg]:fill-success-200!"
          />
        )}
        {apiError && <StatusCard variant="danger" showIcon description={apiError} />}
        <ResourceStatusBanner
          item={dataset}
          messages={{ deleted: t("edit.deletedBanner"), archived: t("edit.archivedBanner") }}
        />
      </div>
    ) : null;

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: t("title"), url: `${adminProfileBasePath(activeProfile)}/datasets` },
        { label: dataset.title },
      ]}
      title={dataset.title}
      className="max-w-[1112px]! gap-64 [&_.agora-breadcrumb-desktop_li:first-child>span]:border-b-2 [&_.agora-breadcrumb-desktop_li:first-child>span]:border-neutral-900 [&_.agora-breadcrumb-desktop_li:first-child>span]:py-2 [&_.agora-btn]:min-h-[60px] [&_.agora-btn]:py-[14px] [&_.input-label-wrapper]:mb-8 [&_.input-label-wrapper_label]:text-m-medium [&_.input-label-wrapper_label]:text-primary-900 [&_textarea.agora-input-textarea]:h-[108px]! [&_textarea.agora-input-textarea]:min-h-[108px]!"
      headerClassName="xl:items-center"
      headerInfoClassName="w-full max-w-[592px]"
      headerMeta={
        <ResourceStatusBadge
          item={dataset}
          labels={{ public: t("resourceEditing.published") }}
          display="pill"
          className="h-32! w-fit rounded-[999px]! px-16! text-s-regular"
        />
      }
      headerAction={
        canEdit && !dataset.archived && !dataset.deleted ? (
          <Button
            variant="primary"
            hasIcon
            appearance={dataset.private ? "solid" : "outline"}
            leadingIcon={dataset.private ? "agora-line-document" : "/Icons/dataset-move-to-draft.svg"}
            leadingIconHover={dataset.private ? "agora-solid-document" : "/Icons/dataset-move-to-draft.svg"}
            disabled={isSubmitting}
            onClick={dataset.private ? handlePublishDataset : handleMoveToDraft}
          >
            {t(dataset.private ? "review.publishAction" : "resourceEditing.moveToDraft")}
          </Button>
        ) : null
      }
    >
      <div className="flex flex-wrap items-center justify-start gap-8 md:justify-end">
        {canDelete && (
          <>
            <Button
              appearance="link"
              variant="danger"
              hasIcon
              leadingIcon="agora-line-trash"
              leadingIconHover="agora-solid-trash"
              disabled={isSubmitting || !!dataset.deleted}
              onClick={openDelete}
            >
              {t("edit.confirmDelete")}
            </Button>
            <span aria-hidden="true" className="hidden h-[60px] w-px bg-neutral-700 md:block" />
          </>
        )}
        {canEdit && (
          <>
            <Button
              appearance="link"
              variant="primary"
              hasIcon
              leadingIcon="agora-line-folder"
              leadingIconHover="agora-solid-folder"
              disabled={isSubmitting || !!dataset.deleted}
              onClick={dataset.archived ? handleUnarchiveDataset : handleArchiveDataset}
            >
              {t(dataset.archived ? "editPage.unarchive" : "editPage.archive")}
            </Button>
            <span aria-hidden="true" className="hidden h-[60px] w-px bg-neutral-700 md:block" />
            <Button
              appearance="link"
              variant="primary"
              hasIcon
              leadingIcon="agora-line-download"
              leadingIconHover="agora-solid-download"
              disabled={isSubmitting || !!dataset.deleted}
              onClick={openTransfer}
            >
              {t("editPage.transferOwnership")}
            </Button>
            <span aria-hidden="true" className="hidden h-[60px] w-px bg-neutral-700 md:block" />
          </>
        )}
        <Button
          appearance="link"
          variant="primary"
          hasIcon
          leadingIcon="agora-line-eye"
          leadingIconHover="agora-solid-eye"
          disabled={!!dataset.deleted}
          onClick={() =>
            window.open(
              localizeHref(`/datasets/${dataset.slug}`, locale),
              "_blank",
              "noopener,noreferrer"
            )
          }
        >
          {t("edit.viewPublicPage")}
        </Button>
      </div>

      <div ref={tabsRef} tabIndex={-1} className="outline-none">
        <Tabs
          fullWidth
          currentType="primary"
          className="[&_.accordion-body>.children-wrapper]:w-full [&_.accordion-body>.children-wrapper]:min-w-0 [&_.tab-list]:mb-0! [&_.tab-list-item]:text-m-medium [&_.tab-list-item.active]:bg-neutral-100! [&_.tab-list.mobile_.accordion-body-block]:p-16! [&_.tab-panel]:mt-0! [&_.tab-panel]:border-0! [&_.tab-panel]:bg-neutral-100! [&_.tab-panel]:px-0! [&_.tab-panel]:py-64! min-[1440px]:[&_.tab-panel]:-mr-[112px] min-[1440px]:[&_.tab-panel]:-ml-[104px] min-[1440px]:[&_.tab-panel]:pr-[112px]! min-[1440px]:[&_.tab-panel]:pl-[104px]!"
          onTabActivation={(index: number) => {
            setApiError(null);
            setApiSuccess(null);
            if (index === 2) loadDiscussions();
            if (index === 3) loadActivities();
          }}
        >
          <Tab>
            <TabHeader>{t("edit.tabs.metadata")}</TabHeader>
            <TabBody>
              <DatasetsEditMetadataTab
                feedback={feedback}
                onCancel={() => router.push(listUrl)}
                auxiliaryItems={pageContent.editAuxiliaryItems}
                dataset={dataset}
                isSubmitting={isSubmitting}
                formErrors={formErrors}
                loadedTitle={loadedTitle}
                loadedAcronym={loadedAcronym}
                description={description}
                loadedKeywords={loadedKeywords}
                selectedKeywords={selectedKeywords}
                keywordOptions={keywordOptions}
                loadedLicense={loadedLicense}
                licenseOptions={licenseOptions}
                loadedFrequency={loadedFrequency}
                frequencyOptions={frequencyOptions}
                temporalStart={temporalStart}
                temporalEnd={temporalEnd}
                loadedSpatialZones={loadedSpatialZones}
                spatialCoverageValue={selectedSpatialZonesValue}
                spatialCoverageOptions={spatialCoverageOptions}
                selectedZoneObjects={selectedZoneObjects}
                effectiveSpatialIds={effectiveSpatialIds}
                loadedSpatialGranularity={loadedSpatialGranularity}
                spatialGranularityOptions={spatialGranularityOptions}
                keywordsRef={keywordsRef}
                selectedLicenseRef={selectedLicenseRef}
                selectedFrequencyRef={selectedFrequencyRef}
                spatialCoverageRef={spatialCoverageRef}
                spatialGranularityRef={spatialGranularityRef}
                onTitleChange={handleTitleChange}
                onAcronymChange={setAcronym}
                onDescriptionChange={(html) => {
                  setDescription(html);
                  if (html.trim()) clearError("description");
                }}
                onKeywordSearch={(q) => {
                  setKeywordSearch(q);
                }}
                onKeywordsChange={(value) => {
                  setLoadedKeywords(value);
                  registerSelectedKeywordValue(value);
                }}
                onRemoveKeyword={(keyword) => {
                  const next = selectedKeywords
                    .filter((v) => v.toLowerCase() !== keyword.toLowerCase())
                    .join(",");
                  setLoadedKeywords(next);
                  keywordsRef.current = next;
                }}
                onTemporalStartChange={setTemporalStart}
                onTemporalEndChange={setTemporalEnd}
                onSpatialCoverageChange={handleSpatialCoverageChange}
                onSpatialSearch={(q) => {
                  if (q.length < 2) {
                    spatialZoneSearchRef.current = [];
                    setSpatialZoneSearch([]);
                    return;
                  }
                  suggestSpatialZones(q, 50)
                    .then((results) => {
                      spatialZoneSearchRef.current = results ?? [];
                      setSpatialZoneSearch(results ?? []);
                    })
                    .catch(() => {
                      spatialZoneSearchRef.current = [];
                      setSpatialZoneSearch([]);
                    });
                }}
                onRemoveSpatialZone={(zoneId) => {
                  const next = effectiveSpatialIds.filter((id) => id !== zoneId).join(",");
                  setSelectedSpatialZonesValue(next);
                  spatialCoverageRef.current = next;
                  setSpatialZones((prev) => prev.filter((z) => z.id !== zoneId));
                }}
                onSaveMetadata={handleSaveMetadata}
              />
            </TabBody>
          </Tab>

          <Tab>
            <TabHeader>{t("editPage.resourcesTab")}</TabHeader>
            <TabBody>
              {feedback}
              <DatasetsEditResourcesTab
                dataset={dataset}
                resourceTypes={resourceTypes}
                auxiliaryItems={pageContent.resourceAuxiliaryItems}
                introduction={pageContent.resourceIntroduction}
                isSubmitting={isSubmitting}
                onFilesUpload={handleFilesUpload}
                onUrlAdd={handleUrlAdd}
                onResourceClick={handleResourceClick}
              />
            </TabBody>
          </Tab>

          <Tab>
            <TabHeader>{t("edit.tabs.discussions")}</TabHeader>
            <TabBody>
              {feedback}
              <DatasetsEditDiscussionsTab
                discussionsLoading={discussionsLoading}
                discussionsLoaded={discussionsLoaded}
                discussions={discussions}
              />
            </TabBody>
          </Tab>

          <Tab>
            <TabHeader>{t("editPage.activityTab")}</TabHeader>
            <TabBody>
              {feedback}
              <DatasetsEditActivitiesTab
                activitiesLoading={activitiesLoading}
                activitiesLoaded={activitiesLoaded}
                activities={activities}
                translateActivityLabel={(label) => translateActivityLabel(label, t)}
              />
            </TabBody>
          </Tab>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
