"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Button,
  InputText,
  Icon,
  StatusCard,
  InputSelect,
  DropdownSection,
  DropdownOption,
  Pill,
  Tag,
  Tabs,
  Tab,
  TabHeader,
  TabBody,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import AdminLayout from "@/components/Layout/AdminLayout";
import DataservicesEditDeletePopup from "@/components/admin/dataservices/DataservicesEditDeletePopup";
import DataservicesEditDiscussionsTab from "@/components/admin/dataservices/DataservicesEditDiscussionsTab";
import DataservicesEditActivitiesTab from "@/components/admin/dataservices/DataservicesEditActivitiesTab";
import DataserviceDescriptionSection from "@/components/admin/dataservices/form-sections/DataserviceDescriptionSection";
import DataserviceAccessSection from "@/components/admin/dataservices/form-sections/DataserviceAccessSection";
import AuxiliarList from "@/components/admin/AuxiliarList";
import { getEditDataserviceAuxiliaryItems } from "@/components/admin/dataservices/config/dataserviceAuxiliaryContent";
import AppIcon from "@/components/Primitives/AppIcon";
import TextLink from "@/components/Primitives/TextLink";
import {
  fetchDataservice,
  updateDataservice,
  deleteDataservice,
} from "@/service/api/dataservices";
import { fetchDataset, fetchDatasets, fetchMyDatasets } from "@/service/api/datasets";
import { fetchOrgDatasets } from "@/service/api/organizations";
import { searchDatasets } from "@/service/api/search";
import { fetchActivity } from "@/service/api/activity";
import { fetchDiscussions } from "@/service/api/discussions-topics";
import { useAuth } from "@/context/AuthContext";
import { translateActivityLabel } from "@/utils/activityLabels";
import {
  AUDIENCE_CONDITIONS,
  AUDIENCE_ROLES,
  RESTRICTION_REASONS,
} from "@/utils/dataserviceLabels";
import type { Dataservice } from "@/service/types/dataservice";
import type { Dataset } from "@/service/types/dataset";
import type { Discussion } from "@/service/types/discussion";
import type { Activity } from "@/service/types/catalog";
import type { AdminCard } from "@/service/types/admin/common";
import type { BoDataservicesPage } from "@/service/types/admin/dataservices";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface DataservicesEditClientProps {
  pageContent: BoDataservicesPage;
}

function findArchiveInfoCard(cards: AdminCard[] | undefined, isArchived: boolean) {
  if (!cards?.length) return undefined;
  return cards[isArchived ? 1 : 0] ?? cards[0];
}

export default function DataservicesEditClient({ pageContent }: DataservicesEditClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { show, hide } = usePopupContext();
  const { t } = useTranslation(["admin-common", "admin-dataservices"]);
  const searchParams = useSearchParams();
  const idOrSlug = searchParams.get("id") || searchParams.get("slug") || "";

  const [dataservice, setDataservice] = useState<Dataservice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

  // Associated datasets management. The two input methods write to independent
  // buckets so neither clobbers the other: `dropdownDatasets` is owned by the
  // search multi-select (replace semantics), `linkDatasets` by the "add by URL"
  // field. The persisted/displayed selection is their deduped union.
  const [myDatasets, setMyDatasets] = useState<Dataset[]>([]);
  const [dropdownDatasets, setDropdownDatasets] = useState<Dataset[]>([]);
  const [linkDatasets, setLinkDatasets] = useState<Dataset[]>([]);
  const [datasetSearch, setDatasetSearch] = useState("");
  const [datasetSearchResults, setDatasetSearchResults] = useState<Dataset[]>([]);
  // Add a portal dataset by pasting its public URL.
  const [datasetLinkUrl, setDatasetLinkUrl] = useState("");
  const [datasetLinkError, setDatasetLinkError] = useState<string | null>(null);
  const [isResolvingLink, setIsResolvingLink] = useState(false);

  // Metadata form state — mirrors the create form (ApiRegistrationClient).
  const [title, setTitle] = useState("");
  const [acronym, setAcronym] = useState("");
  const [description, setDescription] = useState("");
  const [baseApiUrl, setBaseApiUrl] = useState("");
  const [machineDocUrl, setMachineDocUrl] = useState("");
  const [technicalDocUrl, setTechnicalDocUrl] = useState("");
  const [businessDocUrl, setBusinessDocUrl] = useState("");
  const [authRequestUrl, setAuthRequestUrl] = useState("");
  const [rateLimiting, setRateLimiting] = useState("");
  const [rateLimitingUrl, setRateLimitingUrl] = useState("");
  const [availability, setAvailability] = useState("");
  const [accessType, setAccessType] = useState("open");
  // Restricted-access details (only relevant when accessType === "restricted").
  const [accessAudiences, setAccessAudiences] = useState<Record<string, string>>({});
  const [reasonCategory, setReasonCategory] = useState("");
  const [reasonText, setReasonText] = useState("");

  // Discussions tab state.
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [discussionsLoaded, setDiscussionsLoaded] = useState(false);

  // Activities tab state.
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      if (!idOrSlug) {
        setIsLoading(false);
        return;
      }
      try {
        const d = await fetchDataservice(idOrSlug);
        setDataservice(d);
        setTitle(d.title || "");
        setAcronym(d.acronym || "");
        setDescription(d.description || "");
        setBaseApiUrl(d.base_api_url || "");
        setMachineDocUrl(d.machine_documentation_url || "");
        setTechnicalDocUrl(d.technical_documentation_url || "");
        setBusinessDocUrl(d.business_documentation_url || "");
        setAuthRequestUrl(d.authorization_request_url || "");
        setRateLimiting(d.rate_limiting || "");
        setRateLimitingUrl(d.rate_limiting_url || "");
        setAvailability(d.availability != null ? String(d.availability) : "");
        setAccessType(d.access_type || "open");
        // Restricted-access details.
        setAccessAudiences(
          Object.fromEntries((d.access_audiences || []).map((a) => [a.role, a.condition]))
        );
        if (d.access_type_reason_category) {
          setReasonCategory(d.access_type_reason_category);
        } else if (d.access_type_reason) {
          setReasonCategory("other");
          setReasonText(d.access_type_reason);
        }
        // Load the datasets currently associated with this API into the
        // dropdown bucket so they appear pre-selected and can be unchecked.
        const linked = await fetchDatasets(1, 100, { dataservice: d.id });
        setDropdownDatasets(linked.data);
      } catch (error) {
        console.error("Error loading dataservice:", error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [idOrSlug]);

  // Preload the dataset pool (user's own + their organizations' datasets).
  useEffect(() => {
    const dedupe = (items: Dataset[]) =>
      Array.from(new Map(items.map((d) => [d.id, d])).values());
    const personal = fetchMyDatasets(1, 100);
    const orgs = (user?.organizations || []).map((org) => fetchOrgDatasets(org.id, 1, 100));
    Promise.all([personal, ...orgs])
      .then((results) => setMyDatasets(dedupe(results.flatMap((r) => r.data || []))))
      .catch(() => {});
  }, [user?.organizations]);

  // Search datasets across the whole portal when the user types (debounced).
  useEffect(() => {
    const q = datasetSearch.trim();
    if (q.length < 2) return;
    const timer = setTimeout(async () => {
      try {
        const res = await searchDatasets(q, 1, 20);
        setDatasetSearchResults(res.data || []);
      } catch {
        setDatasetSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [datasetSearch]);

  // Deduped union of both buckets — the persisted/displayed selection.
  const selectedDatasets = useMemo(() => {
    const seen = new Set<string>();
    return [...dropdownDatasets, ...linkDatasets].filter((d) => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
  }, [dropdownDatasets, linkDatasets]);

  // Options offered by the search multi-select. Excludes link-added datasets so
  // the dropdown never reports (and thus can't drop) selections it doesn't own.
  const availableDatasets = (() => {
    const combined: Dataset[] = [...dropdownDatasets, ...datasetSearchResults, ...myDatasets];
    const seen = new Set<string>();
    return combined.filter((d) => {
      if (seen.has(d.id) || d.archived || d.deleted) return false;
      seen.add(d.id);
      return true;
    });
  })();

  const removeDataset = (id: string) => {
    setDropdownDatasets((prev) => prev.filter((d) => d.id !== id));
    setLinkDatasets((prev) => prev.filter((d) => d.id !== id));
  };

  // Resolve a pasted dados.gov.pt dataset URL to a portal dataset and add it to
  // the selection. The backend only accepts internal dataset references, so the
  // last path segment (the slug) is used to fetch the matching dataset.
  const handleAddDatasetLink = async () => {
    const raw = datasetLinkUrl.trim();
    if (!raw) return;
    setDatasetLinkError(null);

    let slug = "";
    try {
      const path = new URL(raw).pathname;
      slug = path.split("/").filter(Boolean).pop() || "";
    } catch {
      slug = raw.split("/").filter(Boolean).pop() || "";
    }
    if (!slug) {
      setDatasetLinkError(t("admin-dataservices:edit.invalidDatasetUrl"));
      return;
    }

    setIsResolvingLink(true);
    try {
      const dataset = await fetchDataset(slug);
      if (selectedDatasets.some((d) => d.id === dataset.id)) {
        setDatasetLinkError(t("admin-dataservices:edit.datasetAlreadyAdded"));
        return;
      }
      setLinkDatasets((prev) => [...prev, dataset]);
      setDatasetLinkUrl("");
    } catch {
      setDatasetLinkError(t("admin-dataservices:edit.datasetNotFound"));
    } finally {
      setIsResolvingLink(false);
    }
  };

  const clearError = (field: string) => {
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const loadDiscussions = () => {
    if (discussionsLoaded || !dataservice) return;
    setDiscussionsLoading(true);
    fetchDiscussions(dataservice.id)
      .then((res) => {
        setDiscussions(res.data);
        setDiscussionsLoaded(true);
      })
      .catch((err) => console.error("Error loading discussions:", err))
      .finally(() => setDiscussionsLoading(false));
  };

  const loadActivities = () => {
    if (activitiesLoaded || !dataservice) return;
    setActivitiesLoading(true);
    fetchActivity(dataservice.id)
      .then((res) => {
        setActivities(res.data);
        setActivitiesLoaded(true);
      })
      .catch((err) => console.error("Error loading activities:", err))
      .finally(() => setActivitiesLoading(false));
  };

  const discussionsCount = discussionsLoaded
    ? discussions.length
    : (dataservice?.metrics?.discussions ?? 0);

  const handleSave = async () => {
    if (!dataservice) return;
    const errors: Record<string, boolean> = {};
    if (!title.trim()) errors.title = true;
    if (!description.trim()) errors.description = true;
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      requestAnimationFrame(() => {
        document
          .querySelector('[aria-invalid="true"]')
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    setFormErrors({});
    setIsSaving(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      const isRestricted = accessType === "restricted";
      const audiences = isRestricted
        ? AUDIENCE_ROLES.filter((r) => accessAudiences[r.role]).map((r) => ({
            role: r.role,
            condition: accessAudiences[r.role],
          }))
        : [];
      const usesOtherReason = reasonCategory === "other";
      const updated = await updateDataservice(dataservice.id, {
        title: title.trim(),
        acronym: acronym.trim() || undefined,
        description: description.trim(),
        base_api_url: baseApiUrl.trim() || undefined,
        machine_documentation_url: machineDocUrl.trim() || undefined,
        technical_documentation_url: technicalDocUrl.trim() || undefined,
        business_documentation_url: businessDocUrl.trim() || undefined,
        authorization_request_url: authRequestUrl.trim() || undefined,
        rate_limiting: rateLimiting.trim() || undefined,
        rate_limiting_url: rateLimitingUrl.trim() || undefined,
        availability: availability.trim() ? parseFloat(availability) : undefined,
        access_type: accessType,
        access_audiences: audiences,
        access_type_reason_category:
          isRestricted && reasonCategory && !usesOtherReason ? reasonCategory : undefined,
        access_type_reason:
          isRestricted && usesOtherReason ? reasonText.trim() || undefined : undefined,
      });
      setDataservice(updated);
      setApiSuccess(t("admin-dataservices:edit.updateSuccess"));
      setTimeout(() => setApiSuccess(null), 10000);
    } catch (error: unknown) {
      const err = error as { data?: Record<string, unknown> };
      setApiError(
        err?.data
          ? Object.entries(err.data)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")
          : t("admin-dataservices:edit.saveError")
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDatasets = async () => {
    if (!dataservice) return;
    setIsSaving(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      const updated = await updateDataservice(dataservice.id, {
        datasets: selectedDatasets.map((d) => d.id),
      });
      setDataservice(updated);
      setApiSuccess(t("admin-dataservices:edit.datasetAssociationSuccess"));
      setTimeout(() => setApiSuccess(null), 10000);
    } catch (error: unknown) {
      const err = error as { data?: Record<string, unknown> };
      setApiError(
        err?.data
          ? Object.entries(err.data)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")
          : t("admin-dataservices:edit.datasetAssociationError")
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!dataservice) return;
    setIsSaving(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      const updated = await updateDataservice(dataservice.id, { private: false });
      setDataservice(updated);
      setApiSuccess(t("admin-dataservices:edit.publishSuccess"));
      setTimeout(() => setApiSuccess(null), 10000);
    } catch {
      setApiError(t("admin-dataservices:edit.publishError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!dataservice) return;
    setIsSaving(true);
    setApiError(null);
    setApiSuccess(null);
    const isArchiving = !dataservice.archived_at;
    try {
      const updated = await updateDataservice(dataservice.id, {
        archived_at: isArchiving ? new Date().toISOString() : null,
      });
      setDataservice(updated);
      setApiSuccess(
        isArchiving
          ? t("admin-dataservices:edit.archiveSuccess")
          : t("admin-dataservices:edit.unarchiveSuccess")
      );
      setTimeout(() => setApiSuccess(null), 10000);
    } catch (error) {
      console.error("Error archiving dataservice:", error);
      setApiError(
        isArchiving
          ? t("admin-dataservices:edit.archiveError")
          : t("admin-dataservices:edit.unarchiveError")
      );
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!dataservice) return;
    hide();
    setIsSaving(true);
    try {
      await deleteDataservice(dataservice.id);
      router.push("/admin/me/dataservices");
    } catch (error) {
      console.error("Error deleting dataservice:", error);
      setIsSaving(false);
    }
  };

  const handleOpenDeletePopup = () => {
    if (!dataservice) return;
    show(<DataservicesEditDeletePopup onClose={hide} onConfirm={confirmDelete} />, {
      title: t("admin-dataservices:edit.deleteTitle"),
      closeAriaLabel: t("admin-common:deleteAccount.closeAriaLabel"),
      dimensions: "m",
    });
  };

  const auxiliarItems = getEditDataserviceAuxiliaryItems({
    hasApiNameError: !!formErrors.title,
    hasApiDescriptionError: !!formErrors.description,
    items: pageContent.editAuxiliaryItems,
  });
  const archiveInfoCard = findArchiveInfoCard(
    pageContent.archiveInfoCard,
    !!dataservice?.archived_at
  );

  const lastActivityRaw =
    dataservice?.last_modified ||
    dataservice?.metadata_modified_at ||
    dataservice?.created_at ||
    "";
  const lastActivityDate =
    lastActivityRaw && !isNaN(new Date(lastActivityRaw).getTime())
      ? format(new Date(lastActivityRaw), "d 'de' MMMM 'de' yyyy", { locale: pt })
      : "—";

  return (
    <AdminLayout
      title={dataservice?.title || t("admin-dataservices:edit.titleFallback")}
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: t("admin-dataservices:title"), url: "/admin/dataservices" },
        { label: dataservice?.title || t("admin-dataservices:edit.breadcrumb"), url: "#" },
      ]}
      headerAction={
        <Button
          variant="primary"
          appearance="outline"
          disabled={!!(dataservice?.archived_at || dataservice?.deleted_at)}
          onClick={() =>
            dataservice && window.open(`/dataservices/${dataservice.slug}`, "_blank")
          }
        >
          <span className="admin-edit-info__btn-content">
            <Icon name="agora-line-eye" className="h-16 w-16" />
            {t("admin-dataservices:edit.viewPublicPage")}
          </span>
        </Button>
      }
    >
      {isLoading ? null : !dataservice ? (
        <p className="text-neutral-500">{t("admin-dataservices:edit.notFound")}</p>
      ) : (
        <>
          {apiError && (
            <div className="mb-16">
              <StatusCard variant="danger" showIcon description={apiError} />
            </div>
          )}
          {apiSuccess && (
            <div className="mb-16">
              <StatusCard variant="success" showIcon description={apiSuccess} />
            </div>
          )}

          <div className="admin-edit-info">
            <div className="admin-edit-info__badges">
              <Pill variant={dataservice.private ? "warning" : "success"}>
                {dataservice.private
                  ? t("admin-dataservices:edit.draftStatus")
                  : t("admin-dataservices:edit.publicStatus")}
              </Pill>
              {dataservice.archived_at && (
                <Pill variant="neutral">{t("admin-dataservices:edit.archivedStatus")}</Pill>
              )}
              <span className="admin-edit-info__stat">
                <Icon name="agora-line-eye" className="admin-edit-info__stat-icon" />
                {t("admin-dataservices:edit.views", {
                  count: dataservice.metrics?.views || 0,
                })}
              </span>
              <span className="admin-edit-info__stat">
                <Icon name="agora-line-star" className="admin-edit-info__stat-icon" />
                {t("admin-dataservices:edit.favorites", {
                  count: dataservice.metrics?.followers || 0,
                })}
              </span>
            </div>

            <p className="admin-edit-info__activity">
              <Icon name="agora-line-clock" className="admin-edit-info__clock-icon" />
              {` ${t("admin-dataservices:edit.latestActivity")} `}
              {dataservice.owner && (
                <TextLink href={`/users/${dataservice.owner.slug}`}>
                  {dataservice.owner.first_name} {dataservice.owner.last_name}
                </TextLink>
              )}
              {` — ${t("admin-dataservices:edit.updatedApi")} — `}
              <span>{lastActivityDate}</span>
            </p>
          </div>

          <Tabs
            onTabActivation={(index: number) => {
              setApiError(null);
              setApiSuccess(null);
              if (index === 2) loadDiscussions();
              if (index === 3) loadActivities();
            }}
          >
            {/* Metadata Tab */}
            <Tab>
              <TabHeader>{t("admin-dataservices:edit.metadataTab")}</TabHeader>
              <TabBody>
                <div className="admin-page__body">
                  <div className="admin-page__form-area">
                    {dataservice.private && pageContent.draftVisibilityCard && (
                      <div className="dataset-edit-visibility-banner">
                        <StatusCard
                          variant="informative"
                          showIcon
                          description={
                            <>
                              <strong>{pageContent.draftVisibilityCard.title}</strong>
                              <br />
                              {formatHtmlParagraphs(pageContent.draftVisibilityCard.description)}
                            </>
                          }
                        />
                        <div>
                          <Button
                            variant="primary"
                            appearance="outline"
                            onClick={handlePublish}
                            disabled={isSaving}
                          >
                            {t("admin-dataservices:form.publishApi")}
                          </Button>
                        </div>
                      </div>
                    )}

                    <form
                      className="admin-page__form"
                      noValidate
                      onSubmit={(e) => e.preventDefault()}
                    >
                      <p className="text-neutral-900 text-base leading-7">
                        {t("admin-dataservices:form.requiredFields")}
                      </p>

                      <DataserviceDescriptionSection
                        idPrefix="edit-api"
                        apiName={title}
                        apiAcronym={acronym}
                        apiDescription={description}
                        baseApiUrl={baseApiUrl}
                        machineDocUrl={machineDocUrl}
                        technicalDocUrl={technicalDocUrl}
                        rateLimiting={rateLimiting}
                        availability={availability}
                        hasApiNameError={!!formErrors.title}
                        hasApiDescriptionError={!!formErrors.description}
                        showRateLimiting={false}
                        onApiNameChange={(e) => {
                          setTitle(e.target.value);
                          if (e.target.value.trim()) clearError("title");
                        }}
                        onApiAcronymChange={(e) => setAcronym(e.target.value)}
                        onApiDescriptionChange={(e) => {
                          setDescription(e.target.value);
                          if (e.target.value.trim()) clearError("description");
                        }}
                        onBaseApiUrlChange={(e) => setBaseApiUrl(e.target.value)}
                        onMachineDocUrlChange={(e) => setMachineDocUrl(e.target.value)}
                        onTechnicalDocUrlChange={(e) => setTechnicalDocUrl(e.target.value)}
                        onRateLimitingChange={(e) => setRateLimiting(e.target.value)}
                        onAvailabilityChange={(e) => setAvailability(e.target.value)}
                      />

                      <DataserviceAccessSection
                        idPrefix="edit-api"
                        accountAccessValue="open_with_account"
                        accessType={accessType}
                        authRequestUrl={authRequestUrl}
                        businessDocUrl={businessDocUrl}
                        accessAudiences={accessAudiences}
                        audienceRoles={AUDIENCE_ROLES}
                        audienceConditions={AUDIENCE_CONDITIONS}
                        reasonCategory={reasonCategory}
                        restrictionReasons={RESTRICTION_REASONS}
                        reasonText={reasonText}
                        onAccessTypeChange={setAccessType}
                        onAuthRequestUrlChange={(e) => setAuthRequestUrl(e.target.value)}
                        onBusinessDocUrlChange={(e) => setBusinessDocUrl(e.target.value)}
                        onAudienceChange={(role, condition) =>
                          setAccessAudiences((prev) => ({ ...prev, [role]: condition }))
                        }
                        onReasonCategoryChange={setReasonCategory}
                        onReasonTextChange={(e) => setReasonText(e.target.value)}
                      />

                      <h2 className="admin-page__section-title">
                        {t("admin-dataservices:fields.termsOfUse")}
                      </h2>
                      <div className="admin-page__fields-group">
                        <InputText
                          label={t("admin-dataservices:fields.rateLimiting")}
                          placeholder={t("admin-dataservices:fields.shortPlaceholder")}
                          id="edit-api-rate-limit"
                          value={rateLimiting}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setRateLimiting(e.target.value)
                          }
                        />
                        <InputText
                          label={t("admin-dataservices:fields.rateLimitingUrl")}
                          placeholder="https://..."
                          id="edit-api-rate-limit-url"
                          value={rateLimitingUrl}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setRateLimitingUrl(e.target.value)
                          }
                        />
                      </div>

                      <div className="admin-page__actions flex justify-end mt-24">
                        <Button
                          variant="primary"
                          hasIcon
                          trailingIcon="agora-line-check-circle"
                          trailingIconHover="agora-solid-check-circle"
                          onClick={handleSave}
                          disabled={isSaving}
                        >
                          {isSaving
                            ? t("admin-common:actions.saving")
                            : t("admin-common:actions.save")}
                        </Button>
                      </div>

                      <div className="dataset-edit-danger-actions">
                        {archiveInfoCard ? (
                          <StatusCard
                            variant="warning"
                            showIcon
                            description={
                              <>
                                <strong>{archiveInfoCard.title}</strong>
                                <br />
                                {formatHtmlParagraphs(archiveInfoCard.description)}
                                <Button
                                  appearance="link"
                                  variant="primary"
                                  hasIcon
                                  trailingIcon="agora-line-arrow-right-circle"
                                  trailingIconHover="agora-solid-arrow-right-circle"
                                  onClick={handleArchive}
                                  disabled={isSaving}
                                >
                                  {dataservice.archived_at
                                    ? t("admin-dataservices:edit.unarchive")
                                    : t("admin-dataservices:edit.archive")}
                                </Button>
                              </>
                            }
                          />
                        ) : null}
                        <StatusCard
                          variant="danger"
                          showIcon
                          description={
                            <>
                              <strong>{t("admin-common:danger.irreversible")}</strong>
                              <br />
                              <Button
                                appearance="link"
                                variant="primary"
                                hasIcon
                                trailingIcon="agora-line-arrow-right-circle"
                                trailingIconHover="agora-solid-arrow-right-circle"
                                onClick={handleOpenDeletePopup}
                                disabled={isSaving}
                              >
                                {t("admin-common:actions.delete")}
                              </Button>
                            </>
                          }
                        />
                      </div>
                    </form>
                  </div>

                  {auxiliarItems.length > 0 ? (
                    <aside className="admin-page__auxiliar">
                      <div className="admin-page__auxiliar-inner">
                        <div className="admin-page__auxiliar-header">
                          <AppIcon name="agora-line-question-mark" className="w-24 h-24" />
                          <h2 className="admin-page__auxiliar-title">
                            {t("admin-common:auxiliary.title")}
                          </h2>
                        </div>
                        <AuxiliarList items={auxiliarItems} />
                      </div>
                    </aside>
                  ) : null}
                </div>
              </TabBody>
            </Tab>

            {/* Datasets Tab */}
            <Tab>
              <TabHeader>
                {t("admin-dataservices:edit.datasetsTab", {
                  count: selectedDatasets.length,
                })}
              </TabHeader>
              <TabBody>
                <div className="mt-24 admin-page__form-area">
                  {pageContent.datasetLinksInfo ? (
                    <StatusCard
                      variant="informative"
                      showIcon
                      description={
                        pageContent.datasetLinksInfo.title ? (
                          <>
                            <strong>{pageContent.datasetLinksInfo.title}</strong>
                            <br />
                            {formatHtmlParagraphs(pageContent.datasetLinksInfo.description)}
                          </>
                        ) : (
                          formatHtmlParagraphs(pageContent.datasetLinksInfo.description)
                        )
                      }
                    />
                  ) : null}

                  <form className="admin-page__form" onSubmit={(e) => e.preventDefault()}>
                    <InputSelect
                      label={t("admin-dataservices:datasetLinks.searchLabel")}
                      placeholder={t("admin-dataservices:edit.datasetSelectPlaceholder")}
                      id="edit-dataservice-datasets"
                      type="checkbox"
                      searchable
                      searchInputPlaceholder={t("admin-dataservices:edit.datasetSearchPlaceholder")}
                      searchNoResultsText={t("admin-dataservices:edit.noDatasetResults")}
                      onSearchInputChange={setDatasetSearch}
                      onChange={(options) => {
                        const ids = options.map((o) => String(o.value));
                        setDropdownDatasets(
                          availableDatasets.filter((d) => ids.includes(d.id))
                        );
                      }}
                    >
                      <DropdownSection name="datasets">
                        {availableDatasets.map((dataset) => (
                          <DropdownOption
                            key={dataset.id}
                            value={dataset.id}
                            selected={dropdownDatasets.some((s) => s.id === dataset.id)}
                          >
                            {dataset.title}
                          </DropdownOption>
                        ))}
                      </DropdownSection>
                    </InputSelect>

                    {selectedDatasets.length > 0 && (
                      <div className="mt-16 flex flex-wrap gap-8">
                        {selectedDatasets.map((dataset) => (
                          <Tag
                            key={dataset.id}
                            aria-label={t("admin-dataservices:edit.removeDataset", {
                              title: dataset.title,
                            })}
                            onClick={() => removeDataset(dataset.id)}
                          >
                            {dataset.title}
                          </Tag>
                        ))}
                      </div>
                    )}

                    <div className="admin-page__divider-or">
                      <span className="admin-page__divider-or-text">
                        {t("admin-dataservices:edit.or")}
                      </span>
                    </div>

                    <div className="flex flex-col gap-8">
                      <InputText
                        label={t("admin-dataservices:datasetLinks.linkLabel")}
                        placeholder="https://..."
                        id="edit-dataset-link-url"
                        value={datasetLinkUrl}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setDatasetLinkUrl(e.target.value);
                          if (datasetLinkError) setDatasetLinkError(null);
                        }}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddDatasetLink();
                          }
                        }}
                        hasError={!!datasetLinkError}
                      />
                      {datasetLinkError && (
                        <span className="text-sm text-danger-600">{datasetLinkError}</span>
                      )}
                      <div className="flex justify-end">
                        <Button
                          appearance="outline"
                          variant="primary"
                          hasIcon
                          leadingIcon="agora-line-plus-circle"
                          leadingIconHover="agora-solid-plus-circle"
                          onClick={handleAddDatasetLink}
                          disabled={isResolvingLink || !datasetLinkUrl.trim()}
                        >
                          {t("admin-dataservices:datasetLinks.add")}
                        </Button>
                      </div>
                    </div>

                    <div className="admin-page__actions flex justify-end mt-24">
                      <Button
                        variant="primary"
                        hasIcon
                        trailingIcon="agora-line-check-circle"
                        trailingIconHover="agora-solid-check-circle"
                        onClick={handleSaveDatasets}
                        disabled={isSaving}
                      >
                        {isSaving
                          ? t("admin-common:actions.saving")
                          : t("admin-common:actions.save")}
                      </Button>
                    </div>
                  </form>
                </div>
              </TabBody>
            </Tab>

            {/* Discussions Tab */}
            <Tab>
              <TabHeader>
                {t("admin-dataservices:edit.discussionsTab", { count: discussionsCount })}
              </TabHeader>
              <TabBody>
                <DataservicesEditDiscussionsTab
                  discussions={discussions}
                  discussionsLoading={discussionsLoading}
                  discussionsLoaded={discussionsLoaded}
                />
              </TabBody>
            </Tab>

            {/* Activities Tab */}
            <Tab>
              <TabHeader>{t("admin-dataservices:edit.activitiesTab")}</TabHeader>
              <TabBody>
                <DataservicesEditActivitiesTab
                  activities={activities}
                  activitiesLoading={activitiesLoading}
                  activitiesLoaded={activitiesLoaded}
                  translateActivityLabel={translateActivityLabel}
                />
              </TabBody>
            </Tab>
          </Tabs>
        </>
      )}
    </AdminLayout>
  );
}
