"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import {
  Button,
  Icon,
  StatusCard,
  Pill,
  Tabs,
  Tab,
  TabHeader,
  TabBody,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import AdminLayout from "@/components/Layout/AdminLayout";
import { Dropdown } from "@/components/Primitives/Dropdown";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
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
import type { License, Frequency, Granularity, SpatialZone, Activity, ResourceType } from "@/service/types/catalog";
import type { Dataset } from "@/service/types/dataset";
import type { Discussion } from "@/service/types/discussion";
import DatasetsEditDeletePopup from "@/components/admin/datasets/edit-dialogs/DatasetsEditDeletePopup";
import DatasetsEditMetadataTab from "@/components/admin/datasets/edit-tabs/DatasetsEditMetadataTab";
import DatasetsEditResourcesTab from "@/components/admin/datasets/edit-tabs/DatasetsEditResourcesTab";
import DatasetsEditDiscussionsTab from "@/components/admin/datasets/edit-tabs/DatasetsEditDiscussionsTab";
import DatasetsEditActivitiesTab from "@/components/admin/datasets/edit-tabs/DatasetsEditActivitiesTab";
import { getFrequencyLabel } from "@/utils/frequencyLabels";
import { getGranularityLabel } from "@/utils/granularityLabels";
import { POISONED_FILE_WARNING } from "@/lib/security/translateUploadError";
import TextLink from "@/components/Primitives/TextLink";
import { translateActivityLabel } from "@/utils/activityLabels";
import { useFormErrors } from "@/hooks/forms/useFormErrors";
import { useKeywordSelect } from "@/hooks/forms/useKeywordSelect";
import { useTemporaryMessage } from "@/hooks/forms/useTemporaryMessage";
import { useDatasetLifecycleActions } from "@/components/admin/datasets/hooks/useDatasetLifecycleActions";
import { useDatasetMetadataActions } from "@/components/admin/datasets/hooks/useDatasetMetadataActions";
import { useDatasetResourceActions } from "@/components/admin/datasets/hooks/useDatasetResourceActions";
import { type DatasetEditField } from "@/components/admin/datasets/form-state/datasetEditFormModel";

export default function DatasetsEditClient() {
  const { t } = useTranslation("admin-datasets");
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
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
  const [uploaderKey, setUploaderKey] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    message: apiSuccess,
    setMessage: setApiSuccess,
    setTemporaryMessage: showApiSuccess,
  } = useTemporaryMessage<string | null>(null);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const { errors: formErrors, setErrors, clearError, resetErrors, focusFirstError } =
    useFormErrors<DatasetEditField>();
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
  const [discussionsTotal, setDiscussionsTotal] = useState<number | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);
  const [latestActivity, setLatestActivity] = useState<Activity | null>(null);

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
          spatialZoneSearchRef.current = results;
          setSpatialZoneSearch(results);
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

        fetchActivity(ds.id, 1, 1)
          .then((res) => {
            if (res.data.length > 0) setLatestActivity(res.data[0]);
          })
          .catch((err) => console.error("Error loading latest activity:", err));

        fetchDiscussions(ds.id, 1, 1)
          .then((res) => setDiscussionsTotal(res.total))
          .catch(() => {});
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
        setDiscussionsTotal(res.total);
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
        {getFrequencyLabel(freq.id, freq.label)}
      </Dropdown.Option>
    ));
    return <Dropdown.Section name="frequencies">{options}</Dropdown.Section>;
  }, [frequencies, frequencyDefaultValue]);

  const selectedKeywords = useMemo(
    () => (loadedKeywords ? loadedKeywords.split(",").filter(Boolean) : []),
    [loadedKeywords],
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
      const additions = spatialZoneSearchRef.current.filter((z) => ids.has(z.id) && !seen.has(z.id));
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
          -
        </Dropdown.Option>,
      );
    }
    return <Dropdown.Section name="spatial-coverage">{options}</Dropdown.Section>;
  }, [allSpatialZones, selectedSpatialZonesValue, loadedSpatialZones]);

  const spatialGranularityOptions = useMemo(() => {
    const options = [
      <Dropdown.Option key="empty" value="">
        -
      </Dropdown.Option>,
      ...granularities.map((g) => (
        <Dropdown.Option key={g.id} value={g.id} selected={g.id === loadedSpatialGranularity}>
          {getGranularityLabel(g.id, g.name)}
        </Dropdown.Option>
      )),
    ];
    return <Dropdown.Section name="spatial-granularity">{options}</Dropdown.Section>;
  }, [granularities, loadedSpatialGranularity]);

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      if (value.trim()) clearError("title");
    },
    [clearError],
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

  const { handleArchiveDataset, handleDeleteDataset, handlePublishDataset, handleUnarchiveDataset } =
    useDatasetLifecycleActions({
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

  void handleTransferDataset;

  const { handleDeleteResource, handleFileUpload, handleResourceClick, handleResourceEdit } =
    useDatasetResourceActions({
      dataset,
      slug,
      resourceTypes,
      show,
      hide,
      setDataset,
      setIsSubmitting,
      setApiError,
      setFileUploadError,
      setUploaderKey,
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
        <Button variant="primary" onClick={() => router.push("/admin/me/datasets")}>
          {t("edit.back")}
        </Button>
      </div>
    );
  }

  const qualityCriteria: (keyof NonNullable<Dataset["quality"]>)[] = [
    "dataset_description_quality",
    "has_resources",
    "license",
    "has_open_format",
    "all_resources_available",
    "resources_documentation",
    "spatial",
    "temporal_coverage",
    "update_frequency",
  ];

  const qualityScore = (() => {
    const q = dataset.quality;
    if (!q) return 0;
    if (q.score > 0) return Math.round(q.score * 100);
    const met = qualityCriteria.filter((key) => q[key] === true).length;
    return Math.round((met / qualityCriteria.length) * 100);
  })();

  const metadataCount = (() => {
    const q = dataset.quality;
    if (!q) return 0;
    return qualityCriteria.filter((key) => q[key] === true).length;
  })();

  const statsCount =
    (dataset.metrics?.views ?? 0) +
    (dataset.metrics?.resources_downloads ?? 0) +
    (dataset.metrics?.reuses ?? 0) +
    (dataset.metrics?.followers ?? 0);

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: t("edit.breadcrumbAdmin"), url: "/admin" },
        { label: t("title"), url: "/admin/me/datasets" },
        { label: dataset.title },
      ]}
      title={dataset.title}
      headerAction={
        <Button
          variant="primary"
          appearance="outline"
          onClick={() => window.open(`/datasets/${dataset.slug}`, "_blank")}
        >
          <span className="admin-edit-info__btn-content">
            <Icon name="agora-line-eye" className="h-16 w-16" />
            {t("edit.viewPublicPage")}
          </span>
        </Button>
      }
    >
      {apiError && (
        <div className="my-24">
          <StatusCard variant="danger" showIcon description={apiError} />
        </div>
      )}
      {apiSuccess && (
        <div className="my-24">
          <StatusCard variant="success" showIcon description={apiSuccess} />
        </div>
      )}

      <div className="admin-edit-info">
        <div className="admin-edit-info__badges">
          <Pill variant={dataset.private ? "warning" : "success"}>
            {dataset.private ? t("edit.statusDraft") : t("edit.statusPublic")}
          </Pill>
          {dataset.featured && <Pill variant="informative">{t("edit.statusFeatured")}</Pill>}
          <span className="admin-edit-info__stat">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="admin-edit-info__stat-icon"
            >
              <path
                d="M4 22.9091V15.2727C4 14.6702 4.47969 14.1818 5.07143 14.1818C5.66316 14.1818 6.14286 14.6702 6.14286 15.2727V22.9091C6.14286 23.5116 5.66316 24 5.07143 24C4.47969 24 4 23.5116 4 22.9091ZM10.4286 22.9091V1.09091C10.4286 0.488417 10.9083 0 11.5 0C12.0917 0 12.5714 0.488417 12.5714 1.09091V22.9091C12.5714 23.5116 12.0917 24 11.5 24C10.9083 24 10.4286 23.5116 10.4286 22.9091ZM16.8571 22.9091V9.81818C16.8571 9.21569 17.3368 8.72727 17.9286 8.72727C18.5203 8.72727 19 9.21569 19 9.81818V22.9091C19 23.5116 18.5203 24 17.9286 24C17.3368 24 16.8571 23.5116 16.8571 22.9091Z"
                fill="#64718B"
              />
            </svg>
            {t("edit.statisticsCount", { count: statsCount })}
          </span>
          <span className="admin-edit-info__stat">
            <Icon name="agora-line-document" className="admin-edit-info__stat-icon" />
            {t("edit.metadataCount", { count: metadataCount })}
          </span>
          <span className="admin-edit-info__stat">
            <Icon name="agora-line-star" className="admin-edit-info__stat-icon" />
            {qualityScore > 0 ? (qualityScore / 10).toFixed(1).replace(".", ",") : "0"}
          </span>
        </div>

        <p className="admin-edit-info__activity">
          <Icon name="agora-line-clock" className="admin-edit-info__clock-icon" />
          {latestActivity ? (
            <>
              {` ${t("edit.latestActivityPrefix")} `}
              <TextLink href={`/users/${latestActivity.actor.slug}`}>
                {latestActivity.actor.first_name} {latestActivity.actor.last_name}
              </TextLink>
              {" - "}
              {translateActivityLabel(latestActivity.label)}
              {" - "}
              <span>
                {format(new Date(latestActivity.created_at), "d 'de' MMMM 'de' yyyy", {
                  locale: pt,
                })}
              </span>
            </>
          ) : (
            <>
              {` ${t("edit.latestActivityPrefix")} `}
              {dataset.owner && (
                <TextLink href={`/users/${dataset.owner.slug}`}>
                  {dataset.owner.first_name} {dataset.owner.last_name}
                </TextLink>
              )}
              {` - ${t("edit.latestActivityFallback")} - `}
              <span>
                {format(new Date(dataset.last_modified), "d 'de' MMMM 'de' yyyy", {
                  locale: pt,
                })}
              </span>
            </>
          )}
        </p>
      </div>

      <div ref={tabsRef} tabIndex={-1} className="outline-none">
        <Tabs
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
                dataset={dataset}
                featured={featured}
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
                onPublishDataset={handlePublishDataset}
                onFeaturedChange={(checked) => setFeatured(checked)}
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
                      spatialZoneSearchRef.current = results;
                      setSpatialZoneSearch(results);
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
                onToggleArchive={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dataset.archived ? handleUnarchiveDataset() : handleArchiveDataset();
                }}
                onOpenDeletePopup={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  show(<DatasetsEditDeletePopup onClose={hide} onConfirm={handleDeleteDataset} />, {
                    title: t("edit.deleteModalTitle"),
                    closeAriaLabel: t("edit.closeAriaLabel"),
                    dimensions: "m",
                  });
                }}
              />
            </TabBody>
          </Tab>

          <Tab>
            <TabHeader>{`${t("edit.tabs.resources")} (${dataset.resources.length})`}</TabHeader>
            <TabBody>
              <DatasetsEditResourcesTab
                dataset={dataset}
                uploaderKey={uploaderKey}
                fileUploadError={fileUploadError}
                isSubmitting={isSubmitting}
                onFileUpload={handleFileUpload}
                onSecurityError={(rejections) => {
                  const tooLarge = rejections.find((r) => r.reason.includes("demasiado grande"));
                  setFileUploadError(tooLarge ? tooLarge.reason : POISONED_FILE_WARNING);
                }}
                onResourceClick={handleResourceClick}
                onResourceEdit={handleResourceEdit}
                onDeleteResource={handleDeleteResource}
              />
            </TabBody>
          </Tab>

          <Tab>
            <TabHeader>{`${t("edit.tabs.discussions")} (${discussionsTotal ?? 0})`}</TabHeader>
            <TabBody>
              <DatasetsEditDiscussionsTab
                discussionsLoading={discussionsLoading}
                discussionsLoaded={discussionsLoaded}
                discussions={discussions}
              />
            </TabBody>
          </Tab>

          <Tab>
            <TabHeader>{t("edit.tabs.activities")}</TabHeader>
            <TabBody>
              <DatasetsEditActivitiesTab
                activitiesLoading={activitiesLoading}
                activitiesLoaded={activitiesLoaded}
                activities={activities}
                translateActivityLabel={translateActivityLabel}
              />
            </TabBody>
          </Tab>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
