"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import {
  Breadcrumb,
  Button,
  DropdownOption,
  DropdownSection,
  Icon,
  StatusCard,
  Pill,
  Tabs,
  Tab,
  TabHeader,
  TabBody,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import { POISONED_FILE_WARNING } from "@/lib/security/translateUploadError";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  fetchReuse,
  fetchDataset,
  updateReuse,
  deleteReuse,
  fetchReuseTypes,
  fetchReuseTopics,
  fetchMyDatasets,
  fetchOrgDatasets,
  searchDatasets,
  linkDatasetToReuse,
  unlinkDatasetFromReuse,
  linkDataserviceToReuse,
  fetchActivity,
  fetchDiscussions,
  suggestTags,
  requestTransfer,
} from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import {
  Reuse,
  ReuseType,
  ReuseTopic,
  Dataset,
  Activity,
  Discussion,
  TagSuggestion,
} from "@/types/api";
import { normalizeRemoteDatasets, type RemoteDatasetEntry } from "@/lib/reuse-remote-datasets";
import type { RecipientSelection } from "@/components/admin/RecipientSelect";
import ReusesEditMetadataTab from "@/components/admin/reuses/ReusesEditMetadataTab";
import ReusesEditDatasetsTab from "@/components/admin/reuses/ReusesEditDatasetsTab";
import ReusesEditApiTab from "@/components/admin/reuses/ReusesEditApiTab";
import ReusesEditDiscussionsTab from "@/components/admin/reuses/ReusesEditDiscussionsTab";
import ReusesEditActivitiesTab from "@/components/admin/reuses/ReusesEditActivitiesTab";
import ReusesEditDeletePopup from "@/components/admin/reuses/ReusesEditDeletePopup";
import { AppLink } from "@/components/Primitives/AppLink";

const activityLabels: Record<string, string> = {
  "created a dataset": "criou um conjunto de dados",
  "updated a dataset": "atualizou um conjunto de dados",
  "deleted a dataset": "eliminou um conjunto de dados",
  "added a resource to a dataset": "adicionou um recurso a um conjunto de dados",
  "updated a resource": "atualizou um recurso",
  "removed a resource from a dataset": "removeu um recurso de um conjunto de dados",
  "created a dataservice": "criou um serviço de dados",
  "updated a dataservice": "atualizou um serviço de dados",
  "deleted a dataservice": "eliminou um serviço de dados",
  "created a topic": "criou um tema",
  "updated a topic": "atualizou um tema",
  "added an element to a topic": "adicionou um elemento a um tema",
  "updated an element in a topic": "atualizou um elemento num tema",
  "removed an element from a topic": "removeu um elemento de um tema",
  "created an organization": "criou uma organização",
  "updated an organization": "atualizou uma organização",
  "followed a user": "seguiu um utilizador",
  "discussed a dataservice": "comentou um serviço de dados",
  "discussed a dataset": "comentou um conjunto de dados",
  "discussed a reuse": "comentou uma reutilização",
  "followed a dataservice": "seguiu um serviço de dados",
  "followed a dataset": "seguiu um conjunto de dados",
  "followed a reuse": "seguiu uma reutilização",
  "followed an organization": "seguiu uma organização",
  "created a reuse": "criou uma reutilização",
  "updated a reuse": "atualizou uma reutilização",
  "deleted a reuse": "eliminou uma reutilização",
};

const translateActivityLabel = (label: string) => activityLabels[label] ?? label;

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
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

  // Dropdown data
  const [reuseTypes, setReuseTypes] = useState<ReuseType[]>([]);
  const [reuseTopics, setReuseTopics] = useState<ReuseTopic[]>([]);

  // Keywords state (IsolatedSelect pattern)
  const selectedKeywordsRef = useRef("");
  const [selectedKeywordsValue, setSelectedKeywordsValue] = useState("");
  const [keywordSearch, setKeywordSearch] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<TagSuggestion[]>([]);
  const [tagSearch, setTagSearch] = useState<TagSuggestion[]>([]);

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

  // Initial pool of tag suggestions for the keywords dropdown.
  useEffect(() => {
    suggestTags("", 50)
      .then(setTagSuggestions)
      .catch(() => setTagSuggestions([]));
  }, []);

  // Debounced tag search while user types in the keywords dropdown.
  useEffect(() => {
    const q = keywordSearch.trim();
    if (q.length < 2) return;
    const timer = setTimeout(async () => {
      try {
        const res = await suggestTags(q, 20);
        setTagSearch(res);
      } catch {
        setTagSearch([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [keywordSearch]);

  const selectedKeywords = useMemo(
    () =>
      selectedKeywordsValue
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    [selectedKeywordsValue]
  );

  const keywordOptions = useMemo(() => {
    const trimmed = keywordSearch.trim();
    const trimmedLower = trimmed.toLowerCase();
    // Selected tags stay visible regardless of query so the InputSelect keeps
    // tracking them across searches; otherwise typing a new query would drop
    // them from the children and the next onChange would lose those selections.
    const selectedLowerSet = new Set(selectedKeywords.map((k) => k.toLowerCase()));
    const seen = new Set<string>();
    const uniqueTags = [...tagSuggestions, ...tagSearch].filter((t) => {
      const key = t.text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      if (selectedLowerSet.has(key)) return true;
      if (trimmedLower && !key.includes(trimmedLower)) return false;
      return true;
    });
    const selectedNotInSuggestions = selectedKeywords.filter(
      (keyword) => !seen.has(keyword.toLowerCase())
    );
    const showCreate =
      trimmed.length > 0 &&
      ![...tagSuggestions, ...tagSearch].some((t) => t.text.toLowerCase() === trimmedLower) &&
      !selectedLowerSet.has(trimmedLower);
    const options = [
      ...(showCreate
        ? [
            <DropdownOption key={`__create__${trimmedLower}`} value={trimmed} selected={false}>
              Criar &quot;{trimmed}&quot;
            </DropdownOption>,
          ]
        : []),
      ...selectedNotInSuggestions.map((keyword) => (
        <DropdownOption key={`selected-${keyword.toLowerCase()}`} value={keyword} selected>
          {keyword}
        </DropdownOption>
      )),
      ...uniqueTags.map((tag) => (
        <DropdownOption
          key={tag.text.toLowerCase()}
          value={tag.text}
          selected={selectedLowerSet.has(tag.text.toLowerCase())}
        >
          {tag.text}
        </DropdownOption>
      )),
    ];
    return <DropdownSection name="keywords">{options}</DropdownSection>;
  }, [tagSuggestions, tagSearch, selectedKeywords, keywordSearch]);

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

  const clearError = (field: string) => {
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleDatasetSearchChange = (value: string) => {
    setDatasetSearch(value);
    if (value.trim().length < 2) {
      setDatasetSearchResults([]);
    }
  };

  const handleKeywordSearchChange = (value: string) => {
    setKeywordSearch(value);
    if (value.trim().length < 2) {
      setTagSearch([]);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !reuse) return;
    const file = files[0];
    if (file.size > 4194304) {
      setImageError("O ficheiro excede o tamanho máximo de 4 MB.");
      return;
    }
    setImageError(null);
    setIsSubmitting(true);
    try {
      const { uploadReuseImage } = await import("@/services/api");
      await uploadReuseImage(reuse.id, file);
      const updated = await fetchReuse(reuse.id);
      setReuse(updated);
      setApiSuccess("Imagem de capa atualizada com sucesso.");
      setTimeout(() => setApiSuccess(null), 10000);
    } catch {
      setApiError("Erro ao carregar imagem de capa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishReuse = async () => {
    if (!reuse) return;
    setApiError(null);
    setApiSuccess(null);
    setIsSubmitting(true);
    try {
      const updated = await updateReuse(reuse.id, {
        private: false,
      });
      setReuse(updated);
      setApiSuccess("Reutilização publicada com sucesso.");
      setTimeout(() => setApiSuccess(null), 10000);
    } catch {
      setApiError("Erro ao publicar a reutilização.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeywordsChange = (value: string) => {
    setSelectedKeywordsValue(value);
    const selected = value.split(",").filter(Boolean);
    let addedNew = false;
    selected.forEach((keyword) => {
      const lower = keyword.toLowerCase();
      const existsInSuggestions = tagSuggestions.some((tag) => tag.text.toLowerCase() === lower);
      const existsInSearch = tagSearch.some((tag) => tag.text.toLowerCase() === lower);
      if (!existsInSuggestions && !existsInSearch) {
        addedNew = true;
        setTagSuggestions((prev) => {
          if (prev.some((tag) => tag.text.toLowerCase() === lower)) {
            return prev;
          }
          return [...prev, { text: keyword }];
        });
      }
    });
    if (addedNew) {
      setKeywordSearch("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    const next = selectedKeywords
      .filter((value) => value.toLowerCase() !== keyword.toLowerCase())
      .join(",");
    setSelectedKeywordsValue(next);
    selectedKeywordsRef.current = next;
  };

  const handleOpenDeletePopup = () => {
    if (!reuse) return;
    show(<ReusesEditDeletePopup onClose={hide} onConfirm={handleDeleteReuse} />, {
      title: "Elimine a reutilização",
      closeAriaLabel: "Fechar",
      dimensions: "m",
    });
  };

  const handleDatasetSelectChange = (selectedIds: string[]) => {
    const selectedIdsSet = new Set(selectedIds);
    const pool: Dataset[] = [...selectedDatasets, ...datasetSearchResults, ...myDatasets];
    const seen = new Set<string>();
    const next: Dataset[] = [];
    for (const dataset of pool) {
      if (selectedIdsSet.has(dataset.id) && !seen.has(dataset.id)) {
        seen.add(dataset.id);
        next.push(dataset);
      }
    }
    setSelectedDatasets(next);
  };

  const handleRemoveSelectedDataset = (datasetId: string) => {
    setSelectedDatasets((prev) => prev.filter((dataset) => dataset.id !== datasetId));
  };

  const handleDatasetLinkChange = (index: number, value: string) => {
    const nextLinks = [...datasetLinks];
    nextLinks[index] = { ...nextLinks[index], url: value };
    setDatasetLinks(nextLinks);
    if (value.trim()) {
      setDatasetLinkErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[index];
        return nextErrors;
      });
    }
  };

  // LEDG-1748 PR 2: per-URL metadata fields kept on the same row so the
  // user can describe each external dataset alongside its URL.
  const handleDatasetTitleChange = (index: number, value: string) => {
    const nextLinks = [...datasetLinks];
    nextLinks[index] = { ...nextLinks[index], title: value };
    setDatasetLinks(nextLinks);
  };

  const handleDatasetDescriptionChange = (index: number, value: string) => {
    const nextLinks = [...datasetLinks];
    nextLinks[index] = { ...nextLinks[index], description: value };
    setDatasetLinks(nextLinks);
  };

  const handleRemoveDatasetLink = (index: number) => {
    const nextLinks = datasetLinks.filter((_, currentIndex) => currentIndex !== index);
    setDatasetLinks(nextLinks.length > 0 ? nextLinks : [{ url: "" }]);
  };

  const handleAddDatasetLink = () => {
    const lastIndex = datasetLinks.length - 1;
    if (!datasetLinks[lastIndex].url.trim()) {
      setDatasetLinkErrors((prev) => ({
        ...prev,
        [lastIndex]: "Campo obrigatório",
      }));
      return;
    }
    setDatasetLinks([...datasetLinks, { url: "" }]);
  };

  const handleSaveDatasetAssociations = async () => {
    if (!reuse) return;
    // LEDG-1748 PR 2: build the entries list with the new
    // { url, title?, description? } shape. Dedupe by URL (first occurrence
    // wins so the title / description the user typed is the one that
    // sticks). Compare against the snapshot taken at load time to know
    // whether anything was edited or removed — empty/whitespace fields
    // become `undefined` rather than persisted empty strings.
    const seenUrls = new Set<string>();
    const remoteEntries: RemoteDatasetEntry[] = [];
    for (const link of datasetLinks) {
      const url = link.url.trim();
      if (!url || seenUrls.has(url)) continue;
      seenUrls.add(url);
      const title = link.title?.trim();
      const description = link.description?.trim();
      remoteEntries.push({
        url,
        title: title || undefined,
        description: description || undefined,
      });
    }
    const hasLocal = selectedDatasets.length > 0;
    const hasRemote = remoteEntries.length > 0;
    const previousRemoteEntries = previousRemoteEntriesRef.current;
    const previousHadRemote = previousRemoteEntries.length > 0;
    // JSON-equality is good enough here: the entries are small flat objects
    // with no field-order ambiguity (we always emit url, title, description
    // in the same order via the constructor above).
    const remoteListChanged =
      JSON.stringify(remoteEntries) !== JSON.stringify(previousRemoteEntries);

    if (hasLocal && hasRemote) {
      setApiError(
        "Pode associar conjuntos de dados deste portal ou indicar links para conjuntos de dados externos, mas não as duas opções na mesma reutilização."
      );
      return;
    }
    // Allow saving when the user removed every URL (previousHadRemote &&
    // !hasRemote). Only short-circuit when there's nothing local to add and
    // the remote list is unchanged.
    if (!hasLocal && !remoteListChanged) return;

    setDatasetLinkErrors({});
    setIsSubmitting(true);
    setApiError(null);
    try {
      for (const dataset of selectedDatasets) {
        await linkDatasetToReuse(reuse.id, dataset.id);
      }
      // Overwrite remote_datasets with the current list — no more silent
      // merge with previously-saved entries, so removals stick.
      if (remoteListChanged || (previousHadRemote && !hasRemote)) {
        await updateReuse(reuse.id, {
          extras: {
            ...(reuse.extras || {}),
            remote_datasets: remoteEntries,
          },
        });
      }
      const updated = await fetchReuse(reuseId);
      setReuse(updated);
      const refreshedEntries = normalizeRemoteDatasets(updated.extras);
      previousRemoteEntriesRef.current = refreshedEntries;
      setDatasetLinks(refreshedEntries.length > 0 ? refreshedEntries : [{ url: "" }]);
      setSelectedDatasets([]);
      setApiSuccess("Conjuntos de dados associados com sucesso.");
      setTimeout(() => setApiSuccess(null), 10000);
    } catch (error: unknown) {
      const err = error as { data?: Record<string, unknown> };
      if (err.data && typeof err.data === "object") {
        const messages = Object.entries(err.data)
          .map(([key, val]) => `${key}: ${val}`)
          .join(", ");
        setApiError(messages);
      } else {
        setApiError("Erro ao associar conjuntos de dados.");
      }
    } finally {
      setIsSubmitting(false);
    }
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
      setApiSuccess("Conjunto de dados removido com sucesso.");
      setTimeout(() => setApiSuccess(null), 10000);
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
      setApiSuccess("Todos os conjuntos de dados foram removidos.");
      setTimeout(() => setApiSuccess(null), 10000);
    } catch {
      setApiError("Erro ao remover os conjuntos de dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApiLinkChange = (index: number, value: string) => {
    const nextLinks = [...apiLinks];
    nextLinks[index] = { url: value };
    setApiLinks(nextLinks);
    if (value.trim()) {
      setApiLinkErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[index];
        return nextErrors;
      });
    }
  };

  const handleRemoveApiLink = (index: number) => {
    const nextLinks = apiLinks.filter((_, currentIndex) => currentIndex !== index);
    setApiLinks(nextLinks.length > 0 ? nextLinks : [{ url: "" }]);
  };

  const handleAddApiLink = () => {
    const lastIndex = apiLinks.length - 1;
    if (!apiLinks[lastIndex].url.trim()) {
      setApiLinkErrors((prev) => ({
        ...prev,
        [lastIndex]: "Campo obrigatório",
      }));
      return;
    }
    setApiLinks([...apiLinks, { url: "" }]);
  };

  const handleSaveApiAssociations = async () => {
    if (!reuse) return;
    const errors: Record<number, string> = {};
    apiLinks.forEach((link, index) => {
      if (!link.url.trim() && apiLinks.length > 1) {
        errors[index] = "Campo obrigatório";
      }
    });
    if (Object.keys(errors).length > 0) {
      setApiLinkErrors(errors);
      return;
    }

    setApiLinkErrors({});
    setIsSubmitting(true);
    setApiError(null);
    try {
      for (const link of apiLinks) {
        if (link.url.trim()) {
          await linkDataserviceToReuse(reuse.id, link.url.trim());
        }
      }
      const updated = await fetchReuse(reuseId);
      setReuse(updated);
      setApiLinks([{ url: "" }]);
      setApiSuccess("APIs associadas com sucesso.");
      setTimeout(() => setApiSuccess(null), 10000);
    } catch {
      setApiError("Erro ao associar APIs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveMetadata = async () => {
    if (!reuse) return;
    const errors: Record<string, boolean> = {};
    if (!title.trim()) errors.title = true;
    if (!url.trim()) errors.url = true;
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
    setApiError(null);
    setApiSuccess(null);
    setIsSubmitting(true);

    try {
      const tagsValue = selectedKeywordsRef.current
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const updated = await updateReuse(reuse.id, {
        title: title.trim(),
        url: url.trim(),
        description: description.trim(),
        type: selectedTypeRef.current || undefined,
        topic: selectedTopicRef.current || undefined,
        tags: tagsValue,
      });
      setReuse(updated);
      setApiSuccess("Reutilização atualizada com sucesso.");
      setTimeout(() => setApiSuccess(null), 10000);
    } catch (error: unknown) {
      const err = error as { status?: number; data?: Record<string, unknown> };
      if (err.data && typeof err.data === "object") {
        const messages = Object.entries(err.data)
          .map(([key, val]) => `${key}: ${val}`)
          .join(", ");
        setApiError(messages);
      } else {
        setApiError("Erro ao atualizar a reutilização.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReuse = async () => {
    if (!reuse) return;
    hide();
    setIsSubmitting(true);
    try {
      await deleteReuse(reuse.id);
      router.push("/pages/admin/me/reuses");
    } catch (error) {
      console.error("Error deleting reuse:", error);
      setApiError("Erro ao eliminar a reutilização.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveReuse = async () => {
    if (!reuse) return;
    setApiError(null);
    setApiSuccess(null);
    setIsSubmitting(true);
    try {
      const updated = await updateReuse(reuse.id, {
        archived: new Date().toISOString(),
      });
      setReuse(updated);
      setApiSuccess("Reutilização arquivada com sucesso.");
      setTimeout(() => setApiSuccess(null), 10000);
    } catch (error) {
      console.error("Error archiving reuse:", error);
      setApiError("Erro ao arquivar a reutilização.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
    setApiSuccess(
      `Pedido de transferência enviado para ${recipient.label}. O destinatário tem de aceitar o pedido para a transferência ficar concluída.`
    );
    setTimeout(() => setApiSuccess(null), 15000);
  };

  const handleUnarchiveReuse = async () => {
    if (!reuse) return;
    setApiError(null);
    setApiSuccess(null);
    setIsSubmitting(true);
    try {
      const updated = await updateReuse(reuse.id, { archived: null });
      setReuse(updated);
      setApiSuccess("Reutilização desarquivada com sucesso.");
      setTimeout(() => setApiSuccess(null), 10000);
    } catch (error) {
      console.error("Error unarchiving reuse:", error);
      setApiError("Erro ao desarquivar a reutilização.");
    } finally {
      setIsSubmitting(false);
    }
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
        <Button variant="primary" onClick={() => router.push("/pages/admin/me/reuses")}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: "Reutilizações", url: "/pages/admin/me/reuses" },
            { label: reuse.title, url: "#" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">{reuse.title}</h1>
        <Button
          variant="primary"
          appearance="outline"
          disabled={!!(reuse.archived || reuse.deleted)}
          onClick={() => window.open(`/pages/reuses/${reuse.slug}`, "_blank")}
        >
          <span className="admin-edit-info__btn-content">
            <Icon name="agora-line-eye" className="h-16 w-16" />
            Ver página pública
          </span>
        </Button>
      </div>

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
              <AppLink href={`/pages/users/${reuse.owner.slug}`}>
                {reuse.owner.first_name} {reuse.owner.last_name}
              </AppLink>
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
              onOpenDeletePopup={handleOpenDeletePopup}
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
    </div>
  );
}
