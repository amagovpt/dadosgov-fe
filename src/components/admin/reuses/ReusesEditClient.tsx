"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import {
  Avatar,
  Breadcrumb,
  Button,
  Icon,
  InputText,
  InputTextArea,
  InputSelect,
  DropdownSection,
  DropdownOption,
  StatusCard,
  Pill,
  CardNoResults,
  CardLinks,
  Tabs,
  Tab,
  TabHeader,
  TabBody,
  Tag,
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
  linkDataserviceToReuse,
  fetchActivity,
  fetchDiscussions,
  suggestTags,
  requestTransfer,
} from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { Reuse, ReuseType, ReuseTopic, Dataset, Activity, Discussion, TagSuggestion } from "@/types/api";
import { formatDistanceToNow } from "date-fns";
import RecipientSelect, {
  type RecipientSelection,
} from "@/components/admin/RecipientSelect";
import ReusesEditMetadataTab from "@/components/admin/reuses/ReusesEditMetadataTab";

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

function TransferReusePopupContent({
  reuseTitle,
  onConfirm,
}: {
  reuseTitle: string;
  onConfirm: (recipient: RecipientSelection, comment: string) => Promise<void>;
}) {
  const [recipient, setRecipient] = useState<RecipientSelection | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRecipientError, setShowRecipientError] = useState(false);

  const handleConfirm = async () => {
    if (!recipient) {
      setShowRecipientError(true);
      return;
    }
    setShowRecipientError(false);
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onConfirm(recipient, comment.trim());
      // Parent is responsible for hide() on success.
    } catch (error) {
      const msg = error instanceof Error ? error.message : null;
      setErrorMessage(msg || "Erro ao pedir a transferência da reutilização.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-16">
      <p>
        <Icon name="agora-line-document" className="inline w-4 h-4 mr-4" />
        <span className="text-primary-600">{reuseTitle}</span>
      </p>
      <p>
        <strong>Esta ação é irreversível.</strong>&nbsp;
        Poderá deixar de conseguir gerir esta reutilização.
      </p>

      <div className="flex flex-col gap-8">
        <label className="text-primary-900 text-base font-medium leading-7">
          Organização ou utilizador <span className="text-danger-600">*</span>
        </label>
        <RecipientSelect
          id="transfer-reuse-recipient"
          placeholder="Selecione a identidade para a qual pretende transferir a reutilização..."
          onChange={(selection) => {
            setRecipient(selection);
            if (selection) setShowRecipientError(false);
          }}
          hasError={showRecipientError}
          errorFeedbackText="Selecione um utilizador ou organização"
        />
        {recipient && (
          <p className="text-sm text-neutral-700">
            Destinatário selecionado:{" "}
            <strong className="text-primary-900">{recipient.label}</strong>{" "}
            <span className="text-neutral-500">
              ({recipient.class === "User" ? "utilizador" : "organização"})
            </span>
          </p>
        )}
      </div>

      <div className="admin-page__org-card flex flex-col items-center gap-16 bg-neutral-50 rounded-lg p-8 text-center">
        <h3 className="text-primary-900 text-lg font-bold leading-7">
          Não pertence a uma organização.
        </h3>
        <p className="text-neutral-700 text-base leading-7">
          Quando a reutilização for produzida no contexto de atividade profissional, é
          recomendável que seja publicada em nome da organização responsável.
        </p>
        <Link
          href="/pages/admin/organizations"
          className="inline-flex items-center text-primary-500 text-base hover:underline"
        >
          <span className="mr-[5px]">Crie ou integre uma organização em dados.gov.pt</span>
          <Icon name="agora-line-arrow-right-circle" className="w-5 h-5" />
        </Link>
      </div>

      <div className="flex flex-col gap-8">
        <label className="text-primary-900 text-base font-medium leading-7">
          Comentário
        </label>
        <InputTextArea
          placeholder="Mensagem opcional para o destinatário..."
          id="transfer-reuse-comment"
          label=""
          rows={3}
          value={comment}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setComment(e.target.value)
          }
        />
      </div>

      {errorMessage && (
        <p className="text-danger-600 text-sm">{errorMessage}</p>
      )}

      <div className="flex justify-end gap-16 pt-16">
        <Button
          appearance="solid"
          variant="primary"
          hasIcon
          leadingIcon="agora-line-plane"
          leadingIconHover="agora-solid-plane"
          onClick={handleConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? "A transferir..." : "Transferir a reutilização"}
        </Button>
      </div>
    </div>
  );
}

function DeleteReusePopupContent({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col gap-16">
      <p>Esta ação é irreversível. Tem a certeza que quer eliminar esta reutilização?</p>
      <div className="flex justify-end gap-16 pt-16">
        <Button appearance="outline" variant="neutral" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} hasIcon leadingIcon="agora-line-trash" leadingIconHover="agora-solid-trash">
          Eliminar
        </Button>
      </div>
    </div>
  );
}

export default function ReusesEditClient() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const { show, hide } = usePopupContext();
  const reuseId = (params?.reuseId as string) || searchParams.get("id") || searchParams.get("slug") || "";

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
  const [datasetLinks, setDatasetLinks] = useState([{ url: "" }]);
  const [datasetLinkErrors, setDatasetLinkErrors] = useState<Record<number, string>>({});
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
    const dedupe = (items: Dataset[]) =>
      Array.from(new Map(items.map((d) => [d.id, d])).values());
    const personal = fetchMyDatasets(1, 100);
    const orgs = (user?.organizations || []).map((org) =>
      fetchOrgDatasets(org.id, 1, 100),
    );
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
    if (q.length < 2) {
      setDatasetSearchResults([]);
      return;
    }
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
    suggestTags("", 50).then(setTagSuggestions).catch(() => setTagSuggestions([]));
  }, []);

  // Debounced tag search while user types in the keywords dropdown.
  useEffect(() => {
    const q = keywordSearch.trim();
    if (q.length < 2) {
      setTagSearch([]);
      return;
    }
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
    () => selectedKeywordsValue.split(",").map((v) => v.trim()).filter(Boolean),
    [selectedKeywordsValue],
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
      (keyword) => !seen.has(keyword.toLowerCase()),
    );
    const showCreate =
      trimmed.length > 0 &&
      ![...tagSuggestions, ...tagSearch].some((t) => t.text.toLowerCase() === trimmedLower) &&
      !selectedLowerSet.has(trimmedLower);
    const options = [
      ...(showCreate
        ? [
            <DropdownOption
              key={`__create__${trimmedLower}`}
              value={trimmed}
              selected={false}
            >
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
        const slugs = reuse!.datasets.map((d) =>
          d.uri.split("/").filter(Boolean).pop() || d.id
        );
        const results = await Promise.all(
          slugs.map((s) => fetchDataset(s).catch(() => null))
        );
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

  const clearError = (field: string) => {
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
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
      const existsInSuggestions = tagSuggestions.some(
        (tag) => tag.text.toLowerCase() === lower,
      );
      const existsInSearch = tagSearch.some(
        (tag) => tag.text.toLowerCase() === lower,
      );
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
    show(
      <DeleteReusePopupContent onClose={hide} onConfirm={handleDeleteReuse} />,
      {
        title: "Elimine a reutilização",
        closeAriaLabel: "Fechar",
        dimensions: "m",
      },
    );
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
        document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleTransferReuse = async (
    recipient: RecipientSelection,
    comment: string,
  ) => {
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
      `Pedido de transferência enviado para ${recipient.label}. O destinatário tem de aceitar o pedido para a transferência ficar concluída.`,
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
        <Button
          variant="primary"
          onClick={() => router.push("/pages/admin/me/reuses")}
        >
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
          onClick={() => window.open(`/pages/reuses/${reuse.slug}`, "_blank")}
        >
          <span className="admin-edit-info__btn-content">
            <Icon name="agora-line-eye" className="w-16 h-16" />
            Ver página pública
          </span>
        </Button>
      </div>

      {apiError && <div className="mb-16"><StatusCard variant="danger" showIcon description={apiError} /></div>}
      {apiSuccess && <div className="mb-16"><StatusCard variant="success" showIcon description={apiSuccess} /></div>}

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
              <Link
                href={`/pages/users/${reuse.owner.slug}`}
                className="text-primary-600 underline"
              >
                {reuse.owner.first_name} {reuse.owner.last_name}
              </Link>
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
              onKeywordSearchChange={setKeywordSearch}
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
            <div className="admin-page__body mt-24">
              <div className="admin-page__form-area">
                {associatedDatasets.length > 0 && (
                  <div className="agora-card-links-datasets-px0 mb-24">
                    {associatedDatasets.map((dataset) => (
                      <CardLinks
                        key={dataset.id}
                        onClick={() => { }}
                        className="cursor-pointer text-neutral-900"
                        variant="transparent"
                        image={{
                          src: dataset.organization?.logo || "/images/placeholders/organization.png",
                          alt: dataset.organization?.name || "Organização sem logo",
                        }}
                        category={dataset.organization?.name}
                        title={dataset.title}
                        description={
                          <div className="flex flex-col gap-12">
                            <p className="text-sm line-clamp-3 leading-relaxed text-neutral-900 mt-8 max-w-[592px]">
                              {dataset.description}
                            </p>
                            <div className="flex flex-wrap gap-8 items-center mt-8">
                              <span className="text-sm font-medium text-neutral-900">
                                Metadados: {dataset.quality?.score != null ? Math.round(dataset.quality.score * 100) : 0}%
                              </span>
                            </div>
                            <div className="flex items-center flex-wrap gap-32 text-xs mt-32 text-[#034AD8] mb-32">
                              <div className="flex items-center gap-8" title="Visualizações">
                                <Icon name="agora-line-eye" className="" aria-hidden="true" />
                                <span>
                                  {dataset.metrics?.views
                                    ? dataset.metrics.views >= 1000
                                      ? (dataset.metrics.views / 1000).toFixed(0) + " mil"
                                      : dataset.metrics.views
                                    : "0"}
                                </span>
                              </div>
                              <div className="flex items-center gap-8" title="Downloads">
                                <Icon name="agora-line-download" className="" aria-hidden="true" />
                                <span>
                                  {dataset.metrics?.resources_downloads
                                    ? dataset.metrics.resources_downloads >= 1000
                                      ? (dataset.metrics.resources_downloads / 1000).toFixed(0) + " mil"
                                      : dataset.metrics.resources_downloads
                                    : "0"}
                                </span>
                              </div>
                              <div className="flex items-center gap-8" title="Reutilizações">
                                <img src="/Icons/bar_chart_primary.svg" className="" alt="" aria-hidden="true" />
                                <span>{dataset.metrics?.reuses || 0}</span>
                              </div>
                              <div className="flex items-center gap-8" title="Favoritos">
                                <img src="/Icons/favorite.svg" className="" alt="" aria-hidden="true" />
                                <span>{dataset.metrics?.followers || 0}</span>
                              </div>
                            </div>
                          </div>
                        }
                        date={
                          <span className="font-[300]">
                            {`Atualizado há ${formatDistanceToNow(new Date(dataset.last_modified), { locale: pt }).replace("aproximadamente ", "").replace("quase ", "").replace("menos de ", "").replace("cerca de ", "")}`}
                          </span>
                        }
                        mainLink={
                          <Link href={`/pages/datasets/${dataset.slug}`}>
                            <span className="underline">{dataset.title}</span>
                          </Link>
                        }
                        blockedLink={true}
                      />
                    ))}
                  </div>
                )}

                <form
                  className="admin-page__form"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <div className="mb-24">
                    <StatusCard
                      variant="warning"
                      showIcon
                      description="Pode associar conjuntos de dados deste portal ou indicar links para conjuntos de dados externos, mas não as duas opções na mesma reutilização."
                    />
                  </div>

                  <InputSelect
                    label="Pesquisar um conjunto de dados"
                    placeholder="Selecione conjuntos de dados..."
                    id="edit-dataset-search"
                    type="checkbox"
                    searchable
                    searchInputPlaceholder="Escreva para pesquisar em todos os conjuntos de dados..."
                    searchNoResultsText="Nenhum resultado encontrado"
                    onSearchInputChange={setDatasetSearch}
                    onChange={(options) => {
                      const selectedIds = new Set(options.map((o) => o.value as string));
                      const pool: Dataset[] = [
                        ...selectedDatasets,
                        ...datasetSearchResults,
                        ...myDatasets,
                      ];
                      const seen = new Set<string>();
                      const next: Dataset[] = [];
                      for (const d of pool) {
                        if (selectedIds.has(d.id) && !seen.has(d.id)) {
                          seen.add(d.id);
                          next.push(d);
                        }
                      }
                      setSelectedDatasets(next);
                    }}
                  >
                    <DropdownSection name="datasets">
                      {(() => {
                        const combined: Dataset[] = [
                          ...selectedDatasets,
                          ...datasetSearchResults,
                          ...myDatasets,
                        ];
                        const associatedIds = new Set(
                          associatedDatasets.map((d) => d.id),
                        );
                        const seen = new Set<string>();
                        return combined
                          .filter((d) => {
                            if (seen.has(d.id)) return false;
                            if (associatedIds.has(d.id)) return false;
                            seen.add(d.id);
                            return true;
                          })
                          .map((d) => (
                            <DropdownOption
                              key={d.id}
                              value={d.id}
                              selected={selectedDatasets.some((s) => s.id === d.id)}
                            >
                              {d.title}
                            </DropdownOption>
                          ));
                      })()}
                    </DropdownSection>
                  </InputSelect>

                  {selectedDatasets.length > 0 && (
                    <div className="flex flex-wrap gap-8 mt-16">
                      {selectedDatasets.map((d) => (
                        <Tag
                          key={d.id}
                          aria-label={`Remover ${d.title}`}
                          onClick={() => {
                            setSelectedDatasets((prev) =>
                              prev.filter((x) => x.id !== d.id),
                            );
                          }}
                        >
                          {d.title}
                        </Tag>
                      ))}
                    </div>
                  )}

                  <div className="admin-page__divider-or">
                    <span className="admin-page__divider-or-text">ou</span>
                  </div>

                  {datasetLinks.map((link, index) => (
                    <div key={`dataset-${index}`}>
                      <InputText
                        label="Link para o conjunto de dados"
                        placeholder="Insira o URL aqui"
                        id={`edit-dataset-url-${index}`}
                        value={link.url}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const newLinks = [...datasetLinks];
                          newLinks[index] = { url: e.target.value };
                          setDatasetLinks(newLinks);
                          if (e.target.value.trim()) {
                            setDatasetLinkErrors((prev) => {
                              const next = { ...prev };
                              delete next[index];
                              return next;
                            });
                          }
                        }}
                        hasError={!!datasetLinkErrors[index]}
                        hasFeedback={!!datasetLinkErrors[index]}
                        feedbackState="danger"
                        errorFeedbackText={datasetLinkErrors[index]}
                      />
                      {link.url.trim() && (
                        <div className="flex justify-end mt-24">
                          <Button
                            appearance="solid"
                            variant="danger"
                            hasIcon
                            leadingIcon="agora-line-trash"
                            leadingIconHover="agora-solid-trash"
                            onClick={() => {
                              const newLinks = datasetLinks.filter((_, i) => i !== index);
                              setDatasetLinks(newLinks.length > 0 ? newLinks : [{ url: "" }]);
                            }}
                          >
                            Eliminar
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="flex justify-end">
                    <Button
                      appearance="outline"
                      variant="primary"
                      hasIcon
                      leadingIcon="agora-line-plus-circle"
                      leadingIconHover="agora-solid-plus-circle"
                      onClick={() => {
                        const lastIndex = datasetLinks.length - 1;
                        if (!datasetLinks[lastIndex].url.trim()) {
                          setDatasetLinkErrors((prev) => ({
                            ...prev,
                            [lastIndex]: "Campo obrigatório",
                          }));
                          return;
                        }
                        setDatasetLinks([...datasetLinks, { url: "" }]);
                      }}
                    >
                      Adicionar
                    </Button>
                  </div>

                  <div className="admin-page__actions flex justify-end gap-[18px]">
                    <Button
                      variant="primary"
                      hasIcon
                      trailingIcon="agora-line-check-circle"
                      trailingIconHover="agora-solid-check-circle"
                      onClick={async () => {
                        if (!reuse) return;
                        const remoteUrls = datasetLinks
                          .map((l) => l.url.trim())
                          .filter(Boolean);
                        const hasLocal = selectedDatasets.length > 0;
                        const hasRemote = remoteUrls.length > 0;

                        // Mutual exclusion: portal datasets OR remote URLs.
                        if (hasLocal && hasRemote) {
                          setApiError(
                            "Pode associar conjuntos de dados deste portal ou indicar links para conjuntos de dados externos, mas não as duas opções na mesma reutilização.",
                          );
                          return;
                        }
                        if (!hasLocal && !hasRemote) return;

                        setDatasetLinkErrors({});
                        setIsSubmitting(true);
                        setApiError(null);
                        try {
                          for (const dataset of selectedDatasets) {
                            await linkDatasetToReuse(reuse.id, dataset.id);
                          }
                          if (hasRemote) {
                            const existing =
                              (reuse.extras?.remote_datasets as string[]) || [];
                            const mergedRemote = Array.from(
                              new Set([...existing, ...remoteUrls]),
                            );
                            await updateReuse(reuse.id, {
                              extras: {
                                ...(reuse.extras || {}),
                                remote_datasets: mergedRemote,
                              },
                            });
                          }
                          const updated = await fetchReuse(reuseId);
                          setReuse(updated);
                          setDatasetLinks([{ url: "" }]);
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
                      }}
                      disabled={
                        isSubmitting ||
                        (selectedDatasets.length === 0 &&
                          !datasetLinks.some((l) => l.url.trim()))
                      }
                    >
                      {isSubmitting ? "A guardar..." : "Guardar"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </TabBody>
        </Tab>

        {/* API Tab */}
        <Tab>
          <TabHeader>API ({reuse.dataservices?.length || 0})</TabHeader>
          <TabBody>
            <div className="admin-page__body mt-24">
              <div className="admin-page__form-area">
                {reuse.dataservices && reuse.dataservices.length > 0 && (
                  <div className="space-y-16 mb-24">
                    {reuse.dataservices.map((api) => (
                      <div key={api.id} className="border border-neutral-200 rounded-4 p-16 flex items-center justify-between">
                        <div className="flex items-center gap-12">
                          <Icon name="agora-line-code" className="w-24 h-24" />
                          <span className="text-neutral-900 font-medium">{api.title}</span>
                        </div>
                        <button
                          type="button"
                          className="border border-neutral-300 rounded-4 p-8 hover:bg-neutral-100"
                          title="Eliminar API"
                        >
                          <Icon name="agora-line-trash" className="w-[20px] h-[20px]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form
                  className="admin-page__form"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <InputSelect
                    label="Pesquisar uma API"
                    placeholder="Pesquise uma API..."
                    id="edit-api-search"
                    searchable
                    searchInputPlaceholder="Escreva para pesquisar..."
                    searchNoResultsText="Nenhum resultado encontrado"
                  >
                    <DropdownSection name="apis">
                      <DropdownOption value="">—</DropdownOption>
                    </DropdownSection>
                  </InputSelect>

                  <div className="admin-page__divider-or">
                    <span className="admin-page__divider-or-text">ou</span>
                  </div>

                  {apiLinks.map((link, index) => (
                    <div key={`api-${index}`}>
                      <InputText
                        label="Link para a API"
                        placeholder="https://..."
                        id={`edit-api-url-${index}`}
                        value={link.url}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const newLinks = [...apiLinks];
                          newLinks[index] = { url: e.target.value };
                          setApiLinks(newLinks);
                          if (e.target.value.trim()) {
                            setApiLinkErrors((prev) => {
                              const next = { ...prev };
                              delete next[index];
                              return next;
                            });
                          }
                        }}
                        hasError={!!apiLinkErrors[index]}
                        hasFeedback={!!apiLinkErrors[index]}
                        feedbackState="danger"
                        errorFeedbackText={apiLinkErrors[index]}
                      />
                      {link.url.trim() && (
                        <div className="flex justify-end mt-24">
                          <Button
                            appearance="solid"
                            variant="danger"
                            hasIcon
                            leadingIcon="agora-line-trash"
                            leadingIconHover="agora-solid-trash"
                            onClick={() => {
                              const newLinks = apiLinks.filter((_, i) => i !== index);
                              setApiLinks(newLinks.length > 0 ? newLinks : [{ url: "" }]);
                            }}
                          >
                            Eliminar
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="flex justify-end">
                    <Button
                      appearance="outline"
                      variant="primary"
                      hasIcon
                      leadingIcon="agora-line-plus-circle"
                      leadingIconHover="agora-solid-plus-circle"
                      onClick={() => {
                        const lastIndex = apiLinks.length - 1;
                        if (!apiLinks[lastIndex].url.trim()) {
                          setApiLinkErrors((prev) => ({
                            ...prev,
                            [lastIndex]: "Campo obrigatório",
                          }));
                          return;
                        }
                        setApiLinks([...apiLinks, { url: "" }]);
                      }}
                    >
                      Adicionar
                    </Button>
                  </div>

                  <div className="admin-page__actions flex justify-end gap-[18px]">
                    <Button
                      variant="primary"
                      hasIcon
                      trailingIcon="agora-line-check-circle"
                      trailingIconHover="agora-solid-check-circle"
                      onClick={async () => {
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
                      }}
                      disabled={isSubmitting || !apiLinks.some((l) => l.url.trim())}
                    >
                      {isSubmitting ? "A guardar..." : "Guardar"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </TabBody>
        </Tab>

        {/* Discussions Tab */}
        <Tab>
          <TabHeader>Discussões ({discussions.length})</TabHeader>
          <TabBody>
            <div className="mt-24">
              {discussionsLoading && (
                <p className="text-neutral-700 text-sm">A carregar...</p>
              )}
              {discussionsLoaded && discussions.length === 0 && (
                <CardNoResults
                  position="center"
                  icon={
                    <Icon name="agora-line-chat" className="w-12 h-12 text-primary-500 icon-xl" />
                  }
                  title="Sem discussões"
                  description="Ainda não existem discussões nesta reutilização."
                  hasAnchor={false}
                />
              )}
              {discussionsLoaded && discussions.length > 0 && (
                <div>
                  <h2 className="font-medium text-neutral-900 text-base mb-16">
                    {discussions.length} {discussions.length === 1 ? "DISCUSSÃO" : "DISCUSSÕES"}
                  </h2>
                  <div className="space-y-16">
                    {discussions.map((disc) => (
                      <div key={disc.id} className="bg-white rounded-8 p-32">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-bold text-neutral-900 text-base">{disc.title}</h4>
                            <p className="text-sm text-neutral-900 mt-4">
                              <span className="text-primary-600 font-medium">
                                {disc.user.first_name} {disc.user.last_name}
                              </span>
                              {" — Publicado em "}
                              {format(new Date(disc.created), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                            </p>
                          </div>
                          <Pill
                            variant={disc.closed ? "neutral" : "informative"}
                          >
                            {disc.closed ? "Fechada" : "Aberta"}
                          </Pill>
                        </div>
                        {disc.discussion.length > 0 && (
                          <p className="text-neutral-900 text-sm mt-16">
                            {disc.discussion[0].content}
                          </p>
                        )}
                        {disc.discussion.length > 1 && (
                          <div className="mt-16 space-y-16 border-t border-neutral-200 pt-16">
                            {disc.discussion.slice(1).map((msg, idx) => (
                              <div key={idx} className="border-l-2 border-primary-600 pl-24">
                                <p className="text-sm text-neutral-900">
                                  <span className="text-primary-600 font-medium">
                                    {msg.posted_by.first_name} {msg.posted_by.last_name}
                                  </span>
                                  {" — "}
                                  {format(new Date(msg.posted_on), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                                </p>
                                <p className="text-neutral-900 text-sm mt-4">
                                  {msg.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabBody>
        </Tab>

        {/* Activities Tab */}
        <Tab>
          <TabHeader>Atividades</TabHeader>
          <TabBody>
            <div className="mt-24">
              {activitiesLoading && <p className="text-neutral-700 text-sm">A carregar...</p>}
              {activitiesLoaded && activities.length === 0 && (
                <CardNoResults
                  position="center"
                  icon={
                    <Icon name="agora-line-time" className="w-12 h-12 text-primary-500 icon-xl" />
                  }
                  title="Sem atividades"
                  description="Ainda não existem atividades registadas nesta reutilização."
                  hasAnchor={false}
                />
              )}
              {activitiesLoaded && activities.length > 0 && (
                <>
                  <h2 className="font-medium text-neutral-900 text-base mb-16">
                    {activities.length} ATIVIDADES
                  </h2>
                  <div className="flex flex-col gap-12">
                    {activities.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-12 p-12 bg-neutral-50 rounded-lg"
                      >
                        <Avatar
                          avatarType={activity.actor?.avatar_thumbnail ? "image" : "initials"}
                          srcPath={
                            (activity.actor?.avatar_thumbnail ||
                              `${(activity.actor?.first_name || "")[0] || ""}${(activity.actor?.last_name || "")[0] || ""}`.toUpperCase()) as unknown as undefined
                          }
                          alt={`${activity.actor?.first_name || ""} ${activity.actor?.last_name || ""}`}
                        />
                        <div>
                          <p className="text-sm text-neutral-900">
                            <a
                              href={`/pages/admin/users/${activity.actor?.id}`}
                              className="text-primary-600 underline"
                            >
                              {activity.actor?.first_name} {activity.actor?.last_name}
                            </a>{" "}
                            {translateActivityLabel(activity.label)}
                          </p>
                          <p className="text-xs text-neutral-600 mt-4">
                            {new Date(activity.created_at).toLocaleDateString("pt-PT", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </TabBody>
        </Tab>
      </Tabs>
    </div>
  );
}

