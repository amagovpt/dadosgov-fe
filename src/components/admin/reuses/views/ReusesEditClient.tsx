"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { POISONED_FILE_WARNING } from "@/lib/security/translateUploadError";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { fetchActivity } from "@/service/api/activity";
import { fetchDataset, fetchMyDatasets } from "@/service/api/datasets";
import { fetchDiscussions } from "@/service/api/discussions-topics";
import { fetchOrgDatasets } from "@/service/api/organizations";
import { fetchReuse, fetchReuseTypes, fetchReuseTopics, unlinkDatasetFromReuse } from "@/service/api/reuses";
import { searchDatasets } from "@/service/api/search";
import { requestTransfer } from "@/service/api/transfers";
import { useAuth } from "@/context/AuthContext";
import { Activity } from "@/service/types/catalog";
import { Dataset } from "@/service/types/dataset";
import { Discussion } from "@/service/types/discussion";
import { Reuse, ReuseType, ReuseTopic } from "@/service/types/reuse";
import { normalizeRemoteDatasets, type RemoteDatasetEntry } from "@/lib/reuse-remote-datasets";
import type { RecipientSelection } from "@/components/admin/RecipientSelect";
import ReusesEditMetadataTab from "@/components/admin/reuses/edit-tabs/ReusesEditMetadataTab";
import ReusesEditDatasetsTab from "@/components/admin/reuses/edit-tabs/ReusesEditDatasetsTab";
import ReusesEditApiTab from "@/components/admin/reuses/edit-tabs/ReusesEditApiTab";
import ReusesEditDiscussionsTab from "@/components/admin/reuses/edit-tabs/ReusesEditDiscussionsTab";
import ReusesEditActivitiesTab from "@/components/admin/reuses/edit-tabs/ReusesEditActivitiesTab";
import ReusesEditDeletePopup from "@/components/admin/reuses/edit-dialogs/ReusesEditDeletePopup";
import { useReuseAssociationActions } from "@/components/admin/reuses/hooks/useReuseAssociationActions";
import { useReuseLifecycleActions } from "@/components/admin/reuses/hooks/useReuseLifecycleActions";
import { useReuseMetadataActions } from "@/components/admin/reuses/hooks/useReuseMetadataActions";
import TextLink from "@/components/Primitives/TextLink";
import { useFormErrors } from "@/hooks/forms/useFormErrors";
import { useKeywordSelect } from "@/hooks/forms/useKeywordSelect";
import { useTemporaryMessage } from "@/hooks/forms/useTemporaryMessage";
import {
  addRemoteDatasetEntry,
  addUrlItem,
  buildSelectedDatasetsFromIds,
  clearIndexedErrorIfFilled,
  removeRemoteDatasetEntry,
  removeUrlItem,
  updateRemoteDatasetEntry,
  updateUrlItem,
} from "@/components/admin/reuses/form-state/reuseAssociationHelpers";

import { translateActivityLabel } from "@/utils/activityLabels";

export default function ReusesEditClient() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const { show, hide } = usePopupContext();
  const reuseId =
    (params?.reuseId as string) || searchParams.get("id") || searchParams.get("slug") || "";

  const [reuse, setReuse] = useState<Reuse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const selectedTypeRef = useRef("");
  const selectedTopicRef = useRef("");

  // API state
  const [featured, setFeatured] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const {
    message: apiSuccess,
    setMessage: setApiSuccess,
    setTemporaryMessage: showApiSuccess,
  } = useTemporaryMessage<string | null>(null);
  const { errors: formErrors, setErrors, clearError, resetErrors, focusFirstError } =
    useFormErrors();

  // Dropdown data
  const [reuseTypes, setReuseTypes] = useState<ReuseType[]>([]);
  const [reuseTopics, setReuseTopics] = useState<ReuseTopic[]>([]);

  // Keywords state (IsolatedSelect pattern)
  const selectedKeywordsRef = useRef("");
  const [selectedKeywordsValue, setSelectedKeywordsValue] = useState("");

  // Discussions tab state
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [discussionsLoaded, setDiscussionsLoaded] = useState(false);

  // Activities tab state
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);

  // Datasets tab state
  const [myDatasets, setMyDatasets] = useState<Dataset[]>([]);
  const [associatedDatasets, setAssociatedDatasets] = useState<Dataset[]>([]);
  const [selectedDatasets, setSelectedDatasets] = useState<Dataset[]>([]);
  const [datasetSearch, setDatasetSearch] = useState("");
  const [datasetSearchResults, setDatasetSearchResults] = useState<Dataset[]>([]);
  const [datasetLinks, setDatasetLinks] = useState<RemoteDatasetEntry[]>([{ url: "" }]);
  const [datasetLinkErrors, setDatasetLinkErrors] = useState<Record<number, string>>({});
  // Tracks the entries that were already persisted on the reuse when the page
  // loaded. Used to detect whether the save needs to write a (possibly empty)
  // remote_datasets list when the user removes all rows OR edits any of the
  // per-URL metadata fields (title / description).
  const previousRemoteEntriesRef = useRef<RemoteDatasetEntry[]>([]);
  const [apiLinks, setApiLinks] = useState([{ url: "" }]);
  const [apiLinkErrors, setApiLinkErrors] = useState<Record<number, string>>({});
  const { user } = useAuth();

  useEffect(() => {
    async function loadData() {
      try {
        const [r, types, topics] = await Promise.all([
          fetchReuse(reuseId),
          fetchReuseTypes(),
          fetchReuseTopics(),
        ]);
        setReuse(r);
        setTitle(r.title);
        setUrl(r.url);
        setDescription(r.description);
        setSelectedType(r.type || "");
        setSelectedTopic(r.topic || "");
        selectedTypeRef.current = r.type || "";
        selectedTopicRef.current = r.topic || "";
        setFeatured(r.featured || false);
        setReuseTypes(types);
        setReuseTopics(topics);
        const initialKeywords = (r.tags || []).join(",");
        setSelectedKeywordsValue(initialKeywords);
        selectedKeywordsRef.current = initialKeywords;
        // LEDG-1748: populate the external dataset URL inputs from
        // extras.remote_datasets so the user can see, edit or remove what
        // was already saved (instead of seeing empty fields and assuming
        // the URLs were lost). The normaliser also reads per-URL title /
        // description from the richer entry shape (PR 2) while still
        // accepting the legacy string[] shape from older data.
        const remoteEntries = normalizeRemoteDatasets(r.extras);
        previousRemoteEntriesRef.current = remoteEntries;
        setDatasetLinks(remoteEntries.length > 0 ? remoteEntries : [{ url: "" }]);
      } catch (error) {
        console.error("Error loading reuse:", error);
        setApiError("Erro ao carregar a reutilização.");
      } finally {
        setIsLoading(false);
      }
    }
    if (reuseId) loadData();
  }, [reuseId]);

  // Load an initial pool of datasets (user's own + from each org the user
  // belongs to). The search dropdown still queries the whole portal via
  // searchDatasets() when the user types a query.
  useEffect(() => {
    const dedupe = (items: Dataset[]) => Array.from(new Map(items.map((d) => [d.id, d])).values());
    const personal = fetchMyDatasets(1, 100);
    const orgs = (user?.organizations || []).map((org) => fetchOrgDatasets(org.id, 1, 100));
    Promise.all([personal, ...orgs])
      .then((results) => {
        const all = results.flatMap((r) => r.data || []);
        setMyDatasets(dedupe(all));
      })
      .catch(() => {
        /* graceful fallback: dropdown stays empty, search still works */
      });
  }, [user?.organizations]);

  // Debounced portal-wide dataset search when the user types in the dropdown.
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

  const selectedKeywords = useMemo(
    () =>
      selectedKeywordsValue
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    [selectedKeywordsValue]
  );

  const { keywordOptions, setKeywordSearch, registerSelectedKeywordValue } = useKeywordSelect({
    selectedKeywords,
  });

  useEffect(() => {
    if (!reuse || !reuse.datasets || reuse.datasets.length === 0) return;
    async function loadAssociatedDatasets() {
      try {
        const slugs = reuse!.datasets.map((d) => d.uri.split("/").filter(Boolean).pop() || d.id);
        const results = await Promise.all(slugs.map((s) => fetchDataset(s).catch(() => null)));
        setAssociatedDatasets(results.filter((d): d is Dataset => d !== null));
      } catch {
        setAssociatedDatasets([]);
      }
    }
    loadAssociatedDatasets();
  }, [reuse]);

  const loadActivities = () => {
    if (activitiesLoaded || !reuseId) return;
    setActivitiesLoading(true);
    fetchActivity(reuseId)
      .then((res) => {
        setActivities(res.data);
        setActivitiesLoaded(true);
      })
      .catch((err) => console.error("Error loading activities:", err))
      .finally(() => setActivitiesLoading(false));
  };

  const loadDiscussions = () => {
    if (discussionsLoaded || !reuseId) return;
    setDiscussionsLoading(true);
    fetchDiscussions(reuseId)
      .then((res) => {
        setDiscussions(res.data);
        setDiscussionsLoaded(true);
      })
      .catch((err) => console.error("Error loading discussions:", err))
      .finally(() => setDiscussionsLoading(false));
  };

  const discussionsCount = discussionsLoaded
    ? discussions.length
    : (reuse?.metrics?.discussions ?? 0);

  const handleDatasetSearchChange = (value: string) => {
    setDatasetSearch(value);
    if (value.trim().length < 2) {
      setDatasetSearchResults([]);
    }
  };

  const handleKeywordSearchChange = (value: string) => {
    setKeywordSearch(value);
  };

  const {
    handleArchiveReuse,
    handleImageUpload: handleImageUploadBase,
    handleOpenDeletePopup,
    handlePublishReuse,
    handleUnarchiveReuse,
  } = useReuseLifecycleActions({
    reuse,
    hide,
    push: router.push,
    setReuse,
    setIsSubmitting,
    setApiError,
    setApiSuccess,
    showApiSuccess,
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setImageError(null);
      await handleImageUploadBase(e);
    } catch (error) {
      if (error instanceof Error && error.message === "MAX_FILE_SIZE") {
        setImageError("O ficheiro excede o tamanho m\u00e1ximo de 4 MB.");
      }
    }
  };

  const handleKeywordsChange = (value: string) => {
    setSelectedKeywordsValue(value);
    registerSelectedKeywordValue(value);
  };

  const handleRemoveKeyword = (keyword: string) => {
    const next = selectedKeywords
      .filter((value) => value.toLowerCase() !== keyword.toLowerCase())
      .join(",");
    setSelectedKeywordsValue(next);
    selectedKeywordsRef.current = next;
  };

  const openDeletePopup = () => {
    handleOpenDeletePopup(
      (onConfirm) => <ReusesEditDeletePopup onClose={hide} onConfirm={onConfirm} />,
      show,
    );
  };

  const handleDatasetSelectChange = (selectedIds: string[]) => {
    const pool: Dataset[] = [...selectedDatasets, ...datasetSearchResults, ...myDatasets];
    setSelectedDatasets(buildSelectedDatasetsFromIds(selectedIds, pool));
  };

  const handleRemoveSelectedDataset = (datasetId: string) => {
    setSelectedDatasets((prev) => prev.filter((dataset) => dataset.id !== datasetId));
  };

  const handleDatasetLinkChange = (index: number, value: string) => {
    setDatasetLinks((previous) => updateRemoteDatasetEntry(previous, index, { url: value }));
    setDatasetLinkErrors((previous) => clearIndexedErrorIfFilled(previous, index, value));
  };

  // LEDG-1748 PR 2: per-URL metadata fields kept on the same row so the
  // user can describe each external dataset alongside its URL.
  const handleDatasetTitleChange = (index: number, value: string) => {
    setDatasetLinks((previous) => updateRemoteDatasetEntry(previous, index, { title: value }));
  };

  const handleDatasetDescriptionChange = (index: number, value: string) => {
    setDatasetLinks((previous) =>
      updateRemoteDatasetEntry(previous, index, { description: value }),
    );
  };

  const handleRemoveDatasetLink = (index: number) => {
    const result = removeRemoteDatasetEntry(datasetLinks, datasetLinkErrors, index);
    setDatasetLinks(result.entries);
    setDatasetLinkErrors(result.errors);
  };

  const handleAddDatasetLink = () => {
    const result = addRemoteDatasetEntry(
      datasetLinks,
      datasetLinkErrors,
      "Campo obrigat\u00f3rio",
    );
    setDatasetLinks(result.entries);
    setDatasetLinkErrors(result.errors);
  };

  const handleRemoveAssociatedDataset = async (datasetId: string) => {
    if (!reuse) return;
    setApiError(null);
    setIsSubmitting(true);
    try {
      await unlinkDatasetFromReuse(reuse.id, datasetId);
      const updated = await fetchReuse(reuseId);
      setReuse(updated);
      setAssociatedDatasets((prev) => prev.filter((d) => d.id !== datasetId));
      showApiSuccess("Conjunto de dados removido com sucesso.");
    } catch {
      setApiError("Erro ao remover o conjunto de dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAllAssociatedDatasets = async () => {
    if (!reuse) return;
    setApiError(null);
    setIsSubmitting(true);
    try {
      for (const dataset of associatedDatasets) {
        await unlinkDatasetFromReuse(reuse.id, dataset.id);
      }
      const updated = await fetchReuse(reuseId);
      setReuse(updated);
      setAssociatedDatasets([]);
      showApiSuccess("Todos os conjuntos de dados foram removidos.");
    } catch {
      setApiError("Erro ao remover os conjuntos de dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApiLinkChange = (index: number, value: string) => {
    setApiLinks((previous) => updateUrlItem(previous, index, { url: value }));
    setApiLinkErrors((previous) => clearIndexedErrorIfFilled(previous, index, value));
  };

  const handleRemoveApiLink = (index: number) => {
    setApiLinks((previous) => removeUrlItem(previous, index, () => ({ url: "" })));
  };

  const handleAddApiLink = () => {
    const result = addUrlItem(
      apiLinks,
      apiLinkErrors,
      "Campo obrigat\u00f3rio",
      () => ({ url: "" }),
    );
    setApiLinks(result.items);
    setApiLinkErrors(result.errors);
  };

  const { handleSaveApiAssociations, handleSaveDatasetAssociations } =
    useReuseAssociationActions({
      reuse,
      reuseId,
      selectedDatasets,
      datasetLinks,
      apiLinks,
      previousRemoteEntriesRef,
      setReuse,
      setDatasetLinks,
      setDatasetLinkErrors,
      setSelectedDatasets,
      setApiLinks,
      setApiLinkErrors,
      setIsSubmitting,
      setApiError,
      showApiSuccess,
    });

  const { handleSaveMetadata } = useReuseMetadataActions({
    reuse,
    title,
    url,
    description,
    selectedTypeRef,
    selectedTopicRef,
    selectedKeywordsRef,
    setReuse,
    setIsSubmitting,
    setApiError,
    setApiSuccess,
    setErrors,
    resetErrors,
    focusFirstError,
    showApiSuccess,
  });

  const handleTransferReuse = async (recipient: RecipientSelection, comment: string) => {
    if (!reuse) throw new Error("Reutilização não carregada.");
    setApiError(null);
    setApiSuccess(null);
    await requestTransfer({
      subject: { class: "Reuse", id: reuse.id },
      recipient: { class: recipient.class, id: recipient.id },
      comment: comment || undefined,
    });
    hide();
    showApiSuccess(
      `Pedido de transferência enviado para ${recipient.label}. O destinatário tem de aceitar o pedido para a transferência ficar concluída.`,
      15000,
    );
  };

  if (isLoading) {
    return (
      <div className="admin-page">
        <p className="text-neutral-600">A carregar...</p>
      </div>
    );
  }

  if (!reuse) {
    return (
      <div className="admin-page">
        <StatusCard variant="danger" showIcon description="Reutilização não encontrada." />
        <Button variant="primary" onClick={() => router.push("/admin/me/reuses")}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: "Administração", url: "/admin" },
        { label: "Reutilizações", url: "/admin/me/reuses" },
        { label: reuse.title },
      ]}
      title={reuse.title}
      headerAction={
        <Button
          variant="primary"
          appearance="outline"
          disabled={!!(reuse.archived || reuse.deleted)}
          onClick={() => window.open(`/reuses/${reuse.slug}`, "_blank")}
        >
          <span className="admin-edit-info__btn-content">
            <Icon name="agora-line-eye" className="h-16 w-16" />
            Ver página pública
          </span>
        </Button>
      }
    >

      {reuse.deleted && (
        <div className="mb-16">
          <StatusCard
            variant="warning"
            showIcon
            description="Esta reutilização foi excluída e a sua página pública não está disponível."
          />
        </div>
      )}
      {!reuse.deleted && reuse.archived && (
        <div className="mb-16">
          <StatusCard
            variant="warning"
            showIcon
            description="Esta reutilização está arquivada e a sua página pública não está disponível."
          />
        </div>
      )}
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
          <Pill variant={reuse.private ? "warning" : "success"}>
            {reuse.private ? "RASCUNHO" : "PÚBLICO"}
          </Pill>
          {reuse.featured && <Pill variant="informative">DESTAQUE</Pill>}
          <span className="admin-edit-info__stat">
            <Icon name="agora-line-eye" className="admin-edit-info__stat-icon" />
            {`${reuse.metrics?.views || 0} visualizações`}
          </span>
          <span className="admin-edit-info__stat">
            <Icon name="agora-line-star" className="admin-edit-info__stat-icon" />
            {`${reuse.metrics?.followers || 0} favoritos`}
          </span>
        </div>

        <p className="admin-edit-info__activity">
          <Icon name="agora-line-clock" className="admin-edit-info__clock-icon" />
          {" Atividade mais recente: "}
          {reuse.owner && (
            <>
              <TextLink href={`/users/${reuse.owner.slug}`}>
                {reuse.owner.first_name} {reuse.owner.last_name}
              </TextLink>
            </>
          )}
          {" — editou a reutilização — "}
          <span>
            {reuse.last_modified && !isNaN(new Date(reuse.last_modified).getTime())
              ? format(new Date(reuse.last_modified), "d 'de' MMMM 'de' yyyy", { locale: pt })
              : "—"}
          </span>
        </p>
      </div>

      <Tabs
        onTabActivation={(index: number) => {
          setApiError(null);
          setApiSuccess(null);
          if (index === 3) loadDiscussions();
          if (index === 4) loadActivities();
        }}
      >
        <Tab>
          <TabHeader>Metadados</TabHeader>
          <TabBody>
            <ReusesEditMetadataTab
              reuse={reuse}
              isSubmitting={isSubmitting}
              featured={featured}
              title={title}
              url={url}
              description={description}
              selectedType={selectedType}
              selectedTopic={selectedTopic}
              selectedTypeRef={selectedTypeRef}
              selectedTopicRef={selectedTopicRef}
              selectedKeywordsRef={selectedKeywordsRef}
              selectedKeywordsValue={selectedKeywordsValue}
              selectedKeywords={selectedKeywords}
              keywordOptions={keywordOptions}
              imageError={imageError}
              formErrors={formErrors}
              reuseTypes={reuseTypes}
              reuseTopics={reuseTopics}
              onPublishReuse={handlePublishReuse}
              onToggleFeatured={() => setFeatured((value) => !value)}
              onTitleChange={(value) => {
                setTitle(value);
                if (value.trim()) clearError("title");
              }}
              onUrlChange={(value) => {
                setUrl(value);
                if (value.trim()) clearError("url");
              }}
              onTypeChange={(value) => setSelectedType(value)}
              onTopicChange={(value) => setSelectedTopic(value)}
              onDescriptionChange={(value) => {
                setDescription(value);
                if (value.trim()) clearError("description");
              }}
              onKeywordSearchChange={handleKeywordSearchChange}
              onKeywordsChange={handleKeywordsChange}
              onRemoveKeyword={handleRemoveKeyword}
              onImageUpload={handleImageUpload}
              onImageSecurityError={() => setImageError(POISONED_FILE_WARNING)}
              onSaveMetadata={handleSaveMetadata}
              onArchiveReuse={handleArchiveReuse}
              onUnarchiveReuse={handleUnarchiveReuse}
              onOpenDeletePopup={openDeletePopup}
            />
          </TabBody>
        </Tab>
        {/* Datasets Tab */}
        <Tab>
          <TabHeader>Conjuntos de dados ({reuse.datasets?.length || 0})</TabHeader>
          <TabBody>
            <ReusesEditDatasetsTab
              associatedDatasets={associatedDatasets}
              selectedDatasets={selectedDatasets}
              datasetSearchResults={datasetSearchResults}
              myDatasets={myDatasets}
              datasetLinks={datasetLinks}
              datasetLinkErrors={datasetLinkErrors}
              isSubmitting={isSubmitting}
              onDatasetSearchChange={handleDatasetSearchChange}
              onDatasetSelectChange={handleDatasetSelectChange}
              onRemoveSelectedDataset={handleRemoveSelectedDataset}
              onRemoveAssociatedDataset={handleRemoveAssociatedDataset}
              onRemoveAllAssociatedDatasets={handleRemoveAllAssociatedDatasets}
              onDatasetLinkChange={handleDatasetLinkChange}
              onDatasetTitleChange={handleDatasetTitleChange}
              onDatasetDescriptionChange={handleDatasetDescriptionChange}
              onRemoveDatasetLink={handleRemoveDatasetLink}
              onAddDatasetLink={handleAddDatasetLink}
              onSave={handleSaveDatasetAssociations}
            />
          </TabBody>
        </Tab>
        {/* API Tab */}
        <Tab>
          <TabHeader>API ({reuse.dataservices?.length || 0})</TabHeader>
          <TabBody>
            <ReusesEditApiTab
              dataservices={reuse.dataservices}
              apiLinks={apiLinks}
              apiLinkErrors={apiLinkErrors}
              isSubmitting={isSubmitting}
              onApiLinkChange={handleApiLinkChange}
              onRemoveApiLink={handleRemoveApiLink}
              onAddApiLink={handleAddApiLink}
              onSave={handleSaveApiAssociations}
            />
          </TabBody>
        </Tab>
        {/* Discussions Tab */}
        <Tab>
          <TabHeader>Discussões ({discussionsCount})</TabHeader>
          <TabBody>
            <ReusesEditDiscussionsTab
              discussions={discussions}
              discussionsLoading={discussionsLoading}
              discussionsLoaded={discussionsLoaded}
            />
          </TabBody>
        </Tab>
        {/* Activities Tab */}
        <Tab>
          <TabHeader>Atividades</TabHeader>
          <TabBody>
            <ReusesEditActivitiesTab
              activities={activities}
              activitiesLoading={activitiesLoading}
              activitiesLoaded={activitiesLoaded}
              translateActivityLabel={translateActivityLabel}
            />
          </TabBody>
        </Tab>
      </Tabs>
    </AdminLayout>
  );
}
