"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import {
  Avatar,
  Button,
  Icon,
  InputText,
  InputTextArea,
  InputDate,
  StatusCard,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Pill,
  Switch,
  CardNoResults,
  Tabs,
  Tab,
  TabHeader,
  TabBody,
  Tag,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import Breadcrumb from "@/components/Primitives/Breadcrumb/Breadcrumb";
import DragAndDropUploader from "@/components/Primitives/DragAndDropUploader/DragAndDropUploader";
import { Dropdown } from "@/components/Primitives/Dropdown";

import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  fetchDataset,
  updateDataset,
  deleteDataset,
  uploadResource,
  createResource,
  updateResource,
  replaceResourceFile,
  fetchLicenses,
  fetchFrequencies,
  fetchResourceTypes,
  fetchGranularities,
  fetchSpatialZonesByIds,
  suggestSpatialZones,
  suggestTags,
  fetchActivity,
  fetchDiscussions,
  requestTransfer,
} from "@/services/api";
import RecipientSelect, {
  type RecipientSelection,
} from "@/components/admin/RecipientSelect";
import {
  Dataset,
  License,
  Frequency,
  Granularity,
  SpatialZone,
  TagSuggestion,
  Activity,
  Resource,
  ResourceType,
  Discussion,
} from "@/types/api";
import dynamic from "next/dynamic";
import StatusDot from "@/components/admin/StatusDot";
import DeleteResourcePopup from "@/components/admin/datasets/DeleteResourcePopup";

const RichTextEditor = dynamic(() => import("@/components/admin/posts/RichTextEditor"), {
  ssr: false,
  loading: () => <p>A carregar editor...</p>,
});
import AuxiliarList from "@/components/admin/AuxiliarList";
import { getDatasetAuxiliarItems } from "@/components/admin/datasets/datasetsAuxiliarItems";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import IsolatedInput from "@/components/admin/IsolatedInput";
import { getFrequencyLabel } from "@/utils/frequencyLabels";
import { getGranularityLabel } from "@/utils/granularityLabels";
import {
  POISONED_FILE_WARNING,
  translateUploadError,
} from "@/lib/security/translateUploadError";

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

function translateActivityLabel(label: string): string {
  return activityLabels[label] || label;
}

function TransferDatasetPopupContent({
  datasetTitle,
  onConfirm,
}: {
  datasetTitle: string;
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
      setErrorMessage(msg || "Erro ao pedir a transferência do conjunto de dados.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-[16px]">
      <p>
        <Icon name="agora-line-document" className="inline w-4 h-4 mr-4" />
        <span className="text-primary-600">{datasetTitle}</span>
      </p>
      <p>
        <strong>Esta ação é irreversível.</strong>&nbsp; Vai deixar de gerir este conjunto de dados
      </p>

      <div className="flex flex-col gap-[8px]">
        <label className="text-primary-900 text-base font-medium leading-7">
          Organização ou utilizador <span className="text-danger-600">*</span>
        </label>
        <RecipientSelect
          id="transfer-dataset-recipient"
          placeholder="Selecione a identidade para a qual pretende transferir o conjunto de dados..."
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

      <div className="admin-page__org-card flex flex-col items-center gap-[16px] bg-neutral-50 rounded-lg p-8 text-center">
        <h3 className="text-primary-900 text-lg font-bold leading-7">
          Não pertence a uma organização.
        </h3>
        <p className="text-neutral-700 text-base leading-7">
          Quando o conjunto de dados for produzido no contexto de atividade profissional, é
          recomendável que seja publicado em nome da organização responsável.
        </p>
        <Link
          href="/pages/admin/organizations"
          className="inline-flex items-center text-primary-500 text-base hover:underline"
        >
          <span className="mr-[5px]">Crie ou integre uma organização em dados.gov.pt</span>
          <Icon name="agora-line-arrow-right-circle" className="w-5 h-5" />
        </Link>
      </div>

      <div className="flex flex-col gap-[8px]">
        <label className="text-primary-900 text-base font-medium leading-7">Comentário</label>
        <InputTextArea
          placeholder="Mensagem opcional para o destinatário..."
          id="transfer-dataset-comment"
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
          {isSubmitting ? "A transferir..." : "Transferir o conjunto de dados"}
        </Button>
      </div>
    </div>
  );
}

function DeleteDatasetPopupContent({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col gap-[16px]">
      <p>Essa ação é irreversível. Tem a certeza que quer eliminar este conjunto de dados?</p>
      <div className="flex justify-end gap-16 pt-16">
        <Button appearance="outline" variant="neutral" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          hasIcon
          leadingIcon="agora-line-trash"
          leadingIconHover="agora-solid-trash"
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
}

function ResourceDetailPopupContent({
  resource,
  onEdit,
  onDelete,
  onClose,
}: {
  resource: Resource;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const formatSize = (bytes?: number) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const typeLabel = resource.type === "main" ? "Main file" : resource.type || "-";

  const location =
    resource.filetype === "remote"
      ? "Este recurso é um link externo"
      : "Este recurso encontra-se nos nossos servidores";

  return (
    <div className="flex flex-col gap-[16px]" style={{ minHeight: "60vh" }}>
      {resource.description && <p className="text-neutral-700 text-sm">{resource.description}</p>}
      <div className="flex-1 overflow-y-auto">
        <table className="text-sm w-full">
          <tbody>
            <tr>
              <td className="font-semibold pr-[16px] py-[4px] align-top whitespace-nowrap">Tipo</td>
              <td className="py-[4px]">{typeLabel}</td>
            </tr>
            <tr>
              <td className="font-semibold pr-[16px] py-[4px] align-top whitespace-nowrap">
                Localização
              </td>
              <td className="py-[4px]">{location}</td>
            </tr>
            <tr>
              <td className="font-semibold pr-[16px] py-[4px] align-top whitespace-nowrap">URL</td>
              <td className="py-[4px] break-all">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 underline"
                >
                  {resource.url}
                </a>
              </td>
            </tr>
            <tr>
              <td className="font-semibold pr-[16px] py-[4px] align-top whitespace-nowrap">
                Formato
              </td>
              <td className="py-[4px]">{resource.format || "-"}</td>
            </tr>
            <tr>
              <td className="font-semibold pr-[16px] py-[4px] align-top whitespace-nowrap">
                Mime Type
              </td>
              <td className="py-[4px]">{resource.mime || "-"}</td>
            </tr>
            <tr>
              <td className="font-semibold pr-[16px] py-[4px] align-top whitespace-nowrap">
                Tamanho
              </td>
              <td className="py-[4px]">{formatSize(resource.filesize)}</td>
            </tr>
            {resource.checksum && (
              <tr>
                <td className="font-semibold pr-[16px] py-[4px] align-top whitespace-nowrap">
                  {resource.checksum.type}
                </td>
                <td className="py-[4px] break-all font-mono text-xs">{resource.checksum.value}</td>
              </tr>
            )}
            <tr>
              <td className="font-semibold pr-[16px] py-[4px] align-top whitespace-nowrap">
                Criado em
              </td>
              <td className="py-[4px]">
                {format(new Date(resource.created_at), "d 'de' MMMM 'de' yyyy HH:mm", {
                  locale: pt,
                })}
              </td>
            </tr>
            <tr>
              <td className="font-semibold pr-[16px] py-[4px] align-top whitespace-nowrap">
                Modificado em
              </td>
              <td className="py-[4px]">
                {format(
                  new Date(resource.last_modified || resource.created_at),
                  "d 'de' MMMM 'de' yyyy HH:mm",
                  { locale: pt }
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex justify-between pt-[8px]">
        <Button appearance="outline" variant="primary" onClick={onClose}>
          Cancelar
        </Button>
        <div className="flex gap-[8px]">
          <Button
            variant="danger"
            hasIcon
            leadingIcon="agora-line-trash"
            leadingIconHover="agora-solid-trash"
            onClick={onDelete}
          >
            Eliminar
          </Button>
          <Button
            variant="primary"
            hasIcon
            leadingIcon="agora-line-edit"
            leadingIconHover="agora-solid-edit"
            onClick={onEdit}
          >
            Editar
          </Button>
        </div>
      </div>
    </div>
  );
}

function ResourceEditPopupContent({
  resource,
  datasetId,
  resourceTypes,
  onSaved,
  onCancel,
}: {
  resource: Resource;
  datasetId: string;
  resourceTypes: ResourceType[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(resource.title);
  const [description, setDescription] = useState(resource.description || "");
  const [resourceUrl, setResourceUrl] = useState(resource.url || "");
  const [resourceFormat, setResourceFormat] = useState(resource.format || "");
  const [mime, setMime] = useState(resource.mime || "");
  const [filesize, setFilesize] = useState(resource.filesize ? String(resource.filesize) : "");
  const resourceTypeRef = useRef(resource.type || "main");
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!title.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      await updateResource(datasetId, resource.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        url: resourceUrl.trim() || undefined,
        format: resourceFormat.trim() || undefined,
        mime: mime.trim() || undefined,
        filesize: filesize ? Number(filesize) : undefined,
        type: resourceTypeRef.current,
      });
      onSaved();
    } catch (err) {
      console.error("Error updating resource:", err);
      setError("Erro ao guardar as alterações.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = (e.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;
    setIsReplacing(true);
    setError(null);
    try {
      await replaceResourceFile(datasetId, resource.id, files[0]);
      onSaved();
    } catch (err: unknown) {
      const apiErr = err as { status?: number; data?: Record<string, unknown> };
      console.error("Error replacing file:", apiErr.status, apiErr.data);
      const msg = apiErr.data?.message
        ? translateUploadError(String(apiErr.data.message))
        : `Erro ao substituir o ficheiro (${apiErr.status || "desconhecido"}).`;
      setError(msg);
    } finally {
      setIsReplacing(false);
    }
  };

  return (
    <div className="flex flex-col gap-[16px]" style={{ minHeight: "60vh" }}>
      {error && <StatusCard variant="danger" description={error} />}

      <div className="flex-1 overflow-y-auto flex flex-col gap-[16px]">
        <InputText
          label="Título *"
          placeholder="Título do recurso"
          id="res-edit-title"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
        />

        <IsolatedSelect
          label="Tipo *"
          placeholder="Selecione um tipo..."
          id="res-edit-type"
          defaultValue={resource.type || "main"}
          onChangeRef={resourceTypeRef}
        >
          <Dropdown.Section name="resource-types">
            {resourceTypes.map((rt) => (
              <Dropdown.Option key={rt.id} value={rt.id} selected={rt.id === (resource.type || "main")}>
                {rt.label}
              </Dropdown.Option>
            ))}
          </Dropdown.Section>
        </IsolatedSelect>

        <InputTextArea
          label="Descrição"
          placeholder="Descrição do recurso"
          id="res-edit-description"
          rows={4}
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
        />

        <InputText
          label="URL *"
          placeholder="URL do recurso"
          id="res-edit-url"
          value={resourceUrl}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResourceUrl(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-[16px]">
          <InputText
            label="Tamanho"
            placeholder="Tamanho em bytes"
            id="res-edit-filesize"
            value={filesize}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilesize(e.target.value)}
          />
          <InputText
            label="Formato *"
            placeholder="csv, json, xlsx..."
            id="res-edit-format"
            value={resourceFormat}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResourceFormat(e.target.value)}
          />
        </div>

        <InputText
          label="Mime Type"
          placeholder="application/json, text/csv..."
          id="res-edit-mime"
          value={mime}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMime(e.target.value)}
        />

        {resource.checksum && (
          <div className="flex items-center gap-[8px]">
            <span className="text-sm font-semibold">Soma de verificação</span>
            <span className="bg-neutral-100 rounded px-[8px] py-[2px] text-xs font-mono">
              {resource.checksum.type}
            </span>
            <span className="text-xs font-mono break-all">{resource.checksum.value}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-[8px]">
        <Button appearance="outline" variant="primary" onClick={onCancel}>
          Cancelar
        </Button>
        <div className="flex gap-[8px]">
          <input
            ref={replaceFileInputRef}
            type="file"
            className="hidden"
            onChange={handleReplaceFile}
            disabled={isReplacing}
          />
          <Button
            appearance="outline"
            variant="primary"
            onClick={() => replaceFileInputRef.current?.click()}
            disabled={isReplacing}
          >
            {isReplacing ? "A substituir..." : "Substituir o ficheiro"}
          </Button>
          <Button
            variant="primary"
            hasIcon
            trailingIcon="agora-line-check-circle"
            trailingIconHover="agora-solid-check-circle"
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
          >
            {isSaving ? "A guardar..." : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DatasetsEditClient() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const { show, hide } = usePopupContext();
  const datasetId = (params?.datasetId as string) || searchParams.get("id") || "";
  const slug = searchParams.get("slug") || datasetId;

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [acronym, setAcronym] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const selectedLicenseRef = useRef("");
  const selectedFrequencyRef = useRef("");
  const [temporalStart, setTemporalStart] = useState("");
  const [temporalEnd, setTemporalEnd] = useState("");
  const [featured, setFeatured] = useState(false);

  // Refs for IsolatedSelect (avoid setState during render cycle)
  const keywordsRef = useRef("");
  const spatialCoverageRef = useRef("");
  const spatialGranularityRef = useRef("");

  // API state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isUploadingRef = useRef(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [uploaderKey, setUploaderKey] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

  // Dropdown data
  const [licenses, setLicenses] = useState<License[]>([]);
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [granularities, setGranularities] = useState<Granularity[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<TagSuggestion[]>([]);
  const [tagSearch, setTagSearch] = useState<TagSuggestion[]>([]);
  const [keywordSearch, setKeywordSearch] = useState("");
  const [spatialZones, setSpatialZones] = useState<SpatialZone[]>([]);
  const [spatialZoneSearch, setSpatialZoneSearch] = useState<SpatialZone[]>([]);
  const spatialZoneSearchRef = useRef<SpatialZone[]>([]);
  const [selectedSpatialZonesValue, setSelectedSpatialZonesValue] = useState("");

  // Loaded default values for IsolatedSelect (needed because data arrives async after mount)
  const [loadedTitle, setLoadedTitle] = useState("");
  const [loadedAcronym, setLoadedAcronym] = useState("");
  const [loadedLicense, setLoadedLicense] = useState("");
  const [loadedFrequency, setLoadedFrequency] = useState("");
  const [loadedKeywords, setLoadedKeywords] = useState("");
  const [loadedSpatialGranularity, setLoadedSpatialGranularity] = useState("");
  const [loadedSpatialZones, setLoadedSpatialZones] = useState<string[]>([]);
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);

  // Activity data
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

        suggestTags("", 50).then(setTagSuggestions);

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
        setApiError("Erro ao carregar o conjunto de dados.");
      } finally {
        setIsLoading(false);
      }
    }
    if (slug) loadData();
  }, [slug]);

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

  // Memoized children for IsolatedSelect to prevent re-render cascades
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
    [loadedKeywords]
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
            <Dropdown.Option
              key={`__create__${trimmedLower}`}
              value={trimmed}
              selected={false}
            >
              Criar &quot;{trimmed}&quot;
            </Dropdown.Option>,
          ]
        : []),
      ...selectedNotInSuggestions.map((keyword) => (
        <Dropdown.Option key={`selected-${keyword.toLowerCase()}`} value={keyword} selected>
          {keyword}
        </Dropdown.Option>
      )),
      ...uniqueTags.map((tag) => (
        <Dropdown.Option
          key={tag.text.toLowerCase()}
          value={tag.text}
          selected={selectedLowerSet.has(tag.text.toLowerCase())}
        >
          {tag.text}
        </Dropdown.Option>
      )),
    ];
    return <Dropdown.Section name="keywords">{options}</Dropdown.Section>;
  }, [tagSuggestions, tagSearch, selectedKeywords, keywordSearch]);

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
    setSelectedSpatialZonesValue(value);
    const ids = new Set(value.split(",").filter(Boolean));
    setSpatialZones((prev) => {
      // Pin newly selected zones; unpin deselected ones
      const seen = new Set(prev.map((z) => z.id));
      const additions = spatialZoneSearchRef.current.filter(
        (z) => ids.has(z.id) && !seen.has(z.id),
      );
      const kept = prev.filter((z) => ids.has(z.id));
      if (additions.length === 0 && kept.length === prev.length) return prev;
      return [...kept, ...additions];
    });
  }, []);
  const [selectedZoneObjects, setSelectedZoneObjects] = useState<SpatialZone[]>([]);
  useEffect(() => {
    const effective = selectedSpatialZonesValue || loadedSpatialZones.join(",");
    const ids = effective.split(",").filter(Boolean);
    if (ids.length === 0) {
      setSelectedZoneObjects([]);
      return;
    }
    setSelectedZoneObjects((prev) => {
      const map = new Map(prev.map((z) => [z.id, z]));
      allSpatialZones.forEach((z) => {
        if (!map.has(z.id)) map.set(z.id, z);
      });
      return ids.map((id) => map.get(id)).filter(Boolean) as SpatialZone[];
    });
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
        <Dropdown.Option
          key={g.id}
          value={g.id}
          selected={g.id === loadedSpatialGranularity}
        >
          {getGranularityLabel(g.id, g.name)}
        </Dropdown.Option>
      )),
    ];
    return <Dropdown.Section name="spatial-granularity">{options}</Dropdown.Section>;
  }, [granularities, loadedSpatialGranularity]);

  const clearError = useCallback((field: string) => {
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      if (value.trim()) clearError("title");
    },
    [clearError]
  );

  const handleSaveMetadata = async () => {
    if (!dataset) return;
    const errors: Record<string, boolean> = {};
    if (!title.trim()) errors.title = true;
    if (!description.trim()) errors.description = true;
    if (temporalStart && temporalEnd) {
      const [startDd, startMm, startYyyy] = temporalStart.split("/");
      const [endDd, endMm, endYyyy] = temporalEnd.split("/");
      const startDate = new Date(`${startYyyy}-${startMm}-${startDd}`);
      const endDate = new Date(`${endYyyy}-${endMm}-${endDd}`);
      if (endDate <= startDate) errors.temporalEnd = true;
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      requestAnimationFrame(() => {
        document
          .querySelector('[aria-invalid="true"]')
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    setFormErrors({});
    setApiError(null);
    setApiSuccess(null);
    setIsSubmitting(true);

    try {
      const tagsValue = keywordsRef.current;
      const tags = tagsValue ? tagsValue.split(",").filter(Boolean) : [];
      const granularity = spatialGranularityRef.current || undefined;
      const zonesValue = spatialCoverageRef.current;
      const zones = zonesValue ? zonesValue.split(",").filter(Boolean) : undefined;

      const updated = await updateDataset(dataset.id, {
        title: title.trim(),
        description: description.trim(),
        description_short: shortDescription.trim() || undefined,
        acronym: acronym.trim() || undefined,
        featured,
        tags,
        license: selectedLicenseRef.current || undefined,
        frequency: selectedFrequencyRef.current || undefined,
        temporal_coverage: temporalStart
          ? {
              start: (() => {
                const [dd, mm, yyyy] = temporalStart.split("/");
                return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`).toISOString();
              })(),
              ...(temporalEnd
                ? {
                    end: (() => {
                      const [dd, mm, yyyy] = temporalEnd.split("/");
                      return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`).toISOString();
                    })(),
                  }
                : {}),
            }
          : undefined,
        ...(granularity || zones
          ? {
              spatial: {
                geom: dataset.spatial?.geom ?? null,
                zones: zones ?? dataset.spatial?.zones ?? [],
                granularity: granularity ?? null,
              },
            }
          : {}),
      });
      setDataset(updated);
      setApiSuccess("Conjunto de dados atualizado com sucesso.");
      setTimeout(() => setApiSuccess(null), 10000);
      requestAnimationFrame(() => {
        tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        tabsRef.current?.focus({ preventScroll: true });
      });
    } catch (error: unknown) {
      const err = error as { status?: number; data?: Record<string, unknown> };
      if (err.data && typeof err.data === "object") {
        const flattenValue = (val: unknown): string => {
          if (Array.isArray(val)) return val.map(flattenValue).join("; ");
          if (val && typeof val === "object")
            return Object.values(val as Record<string, unknown>)
              .map(flattenValue)
              .join("; ");
          return String(val);
        };
        const messages = Object.entries(err.data)
          .map(([key, val]) => `${key}: ${flattenValue(val)}`)
          .join(", ");
        setApiError(messages);
      } else {
        setApiError("Erro ao atualizar o conjunto de dados.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveDataset = async () => {
    if (!dataset) return;
    setIsSubmitting(true);
    try {
      await updateDataset(dataset.id, { archived: new Date().toISOString() });
      router.push("/pages/admin/me/datasets?status=archived");
    } catch (error) {
      console.error("Error archiving dataset:", error);
      setApiError("Erro ao arquivar o conjunto de dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransferDataset = async (
    recipient: RecipientSelection,
    comment: string,
  ) => {
    if (!dataset) throw new Error("Conjunto de dados não carregado.");
    setApiError(null);
    setApiSuccess(null);
    await requestTransfer({
      subject: { class: "Dataset", id: dataset.id },
      recipient: { class: recipient.class, id: recipient.id },
      comment: comment || undefined,
    });
    hide();
    setApiSuccess(
      `Pedido de transferência enviado para ${recipient.label}. O destinatário tem de aceitar o pedido para a transferência ficar concluída.`,
    );
    setTimeout(() => setApiSuccess(null), 15000);
  };

  const handleUnarchiveDataset = async () => {
    if (!dataset) return;
    setIsSubmitting(true);
    try {
      const updated = await updateDataset(dataset.id, { archived: null });
      setDataset(updated);
    } catch (error) {
      console.error("Error unarchiving dataset:", error);
      setApiError("Erro ao desarquivar o conjunto de dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDataset = async () => {
    if (!dataset) return;
    setIsSubmitting(true);
    try {
      await deleteDataset(dataset.id);
      hide();
      router.push("/pages/admin/me/datasets");
    } catch (error) {
      console.error("Error deleting dataset:", error);
      setApiError("Erro ao eliminar o conjunto de dados.");
      hide();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = (e.target as HTMLInputElement).files;
    if (!files || files.length === 0 || !dataset) return;
    if (isUploadingRef.current) return;
    isUploadingRef.current = true;
    setIsSubmitting(true);
    setApiError(null);
    setFileUploadError(null);
    try {
      for (const file of Array.from(files)) {
        await uploadResource(dataset.id, file);
      }
      const updated = await fetchDataset(slug);
      setDataset(updated);
      setUploaderKey((k) => k + 1);
      setApiSuccess("Ficheiro(s) carregado(s) com sucesso.");
      setTimeout(() => setApiSuccess(null), 10000);
    } catch (error) {
      const err = error as { status?: number; data?: Record<string, unknown>; message?: string };
      console.error("Error uploading resource:", err.status, err.data ?? err.message ?? error);
      if (err.data && typeof err.data === "object" && Object.keys(err.data).length > 0) {
        const flattenValue = (val: unknown): string => {
          if (Array.isArray(val)) return val.map(flattenValue).join("; ");
          if (val && typeof val === "object")
            return Object.values(val as Record<string, unknown>)
              .map(flattenValue)
              .join("; ");
          return String(val);
        };
        const msg =
          (err.data.message as string) ||
          Object.entries(err.data)
            .map(([k, v]) => `${k}: ${flattenValue(v)}`)
            .join(", ");
        setFileUploadError(`Erro ao carregar ficheiro(s): ${translateUploadError(msg)}`);
      } else if (err.message) {
        setFileUploadError(`Erro ao carregar ficheiro(s): ${translateUploadError(err.message)}`);
      } else {
        const statusHint = err.status ? ` (HTTP ${err.status})` : "";
        setFileUploadError(`Erro ao carregar ficheiro(s)${statusHint}. Tente novamente.`);
      }
    } finally {
      isUploadingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleDeleteResource = (resource: Resource) => {
    if (!dataset) return;
    show(
      <DeleteResourcePopup
        datasetId={dataset.id}
        resource={resource}
        onDeleted={() => {
          setDataset((prev) =>
            prev ? { ...prev, resources: prev.resources.filter((r) => r.id !== resource.id) } : prev
          );
          setApiSuccess("Ficheiro eliminado com sucesso.");
          setTimeout(() => setApiSuccess(null), 10000);
        }}
      />,
      {
        title: "Eliminar ficheiro",
        closeAriaLabel: "Fechar",
        dimensions: "m",
      }
    );
  };

  const refreshDataset = async () => {
    const updated = await fetchDataset(slug);
    setDataset(updated);
  };

  const handleResourceEdit = (resource: Resource) => {
    if (!dataset) return;
    show(
      <ResourceEditPopupContent
        resource={resource}
        datasetId={dataset.id}
        resourceTypes={resourceTypes}
        onSaved={async () => {
          hide();
          await refreshDataset();
          setApiSuccess("Recurso atualizado com sucesso.");
          setTimeout(() => setApiSuccess(null), 10000);
        }}
        onCancel={hide}
      />,
      {
        title: resource.title,
        closeAriaLabel: "Fechar",
        dimensions: "l",
      }
    );
  };

  const handleResourceClick = (resource: Resource) => {
    if (!dataset) return;
    const openEdit = () => {
      hide();
      setTimeout(() => {
        show(
          <ResourceEditPopupContent
            resource={resource}
            datasetId={dataset.id}
            resourceTypes={resourceTypes}
            onSaved={async () => {
              hide();
              await refreshDataset();
              setApiSuccess("Recurso atualizado com sucesso.");
              setTimeout(() => setApiSuccess(null), 10000);
            }}
            onCancel={hide}
          />,
          {
            title: resource.title,
            closeAriaLabel: "Fechar",
            dimensions: "l",
          }
        );
      }, 100);
    };

    const openDelete = () => {
      hide();
      setTimeout(() => {
        handleDeleteResource(resource);
      }, 100);
    };

    show(
      <ResourceDetailPopupContent
        resource={resource}
        onEdit={openEdit}
        onDelete={openDelete}
        onClose={hide}
      />,
      {
        title: resource.title,
        closeAriaLabel: "Fechar",
        dimensions: "l",
      }
    );
  };

  if (isLoading) {
    return (
      <div className="admin-page">
        <p className="text-neutral-600">A carregar...</p>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="admin-page">
        <StatusCard variant="danger" showIcon description="Conjunto de dados não encontrado." />
        <Button variant="primary" onClick={() => router.push("/pages/admin/me/datasets")}>
          Voltar
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

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: "Conjuntos de dados", url: "/pages/admin/me/datasets" },
            { label: dataset.title, url: "#" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">{dataset.title}</h1>
        <Button
          variant="primary"
          appearance="outline"
          onClick={() => window.open(`/pages/datasets/${dataset.slug}`, "_blank")}
        >
          <span className="admin-edit-info__btn-content">
            <Icon name="agora-line-eye" className="w-[16px] h-[16px]" />
            Ver página pública
          </span>
        </Button>
      </div>

      {apiError && (
        <div className="my-[24px]">
          <StatusCard variant="danger" showIcon description={apiError} />
        </div>
      )}
      {apiSuccess && (
        <div className="my-[24px]">
          <StatusCard variant="success" showIcon description={apiSuccess} />
        </div>
      )}

      <div className="admin-edit-info">
        <div className="admin-edit-info__badges">
          <Pill variant={dataset.private ? "warning" : "success"}>
            {dataset.private ? "RASCUNHO" : "PÚBLICO"}
          </Pill>
          {dataset.featured && <Pill variant="informative">DESTAQUE</Pill>}
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
            {`${(dataset.metrics?.views ?? 0) + (dataset.metrics?.resources_downloads ?? 0) + (dataset.metrics?.reuses ?? 0) + (dataset.metrics?.followers ?? 0)} estatísticas`}
          </span>
          <span className="admin-edit-info__stat">
            <Icon name="agora-line-document" className="admin-edit-info__stat-icon" />
            {`${metadataCount} metadados`}
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
              {" Atividade mais recente: "}
              <Link
                href={`/pages/users/${latestActivity.actor.slug}`}
                className="text-primary-600 underline"
              >
                {latestActivity.actor.first_name} {latestActivity.actor.last_name}
              </Link>
              {" — "}
              {translateActivityLabel(latestActivity.label)}
              {" — "}
              <span>
                {format(new Date(latestActivity.created_at), "d 'de' MMMM 'de' yyyy", {
                  locale: pt,
                })}
              </span>
            </>
          ) : (
            <>
              {" Atividade mais recente: "}
              {dataset.owner && (
                <>
                  <Link
                    href={`/pages/users/${dataset.owner.slug}`}
                    className="text-primary-600 underline"
                  >
                    {dataset.owner.first_name} {dataset.owner.last_name}
                  </Link>
                </>
              )}
              {" — editou o conjunto de dados — "}
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
        {/* Metadata Tab */}
        <Tab>
          <TabHeader>Metadados</TabHeader>
          <TabBody>
            <div className="admin-page__body">
              <div className="admin-page__form-area">
                {dataset.private && (
                  <div className="dataset-edit-visibility-banner">
                    <StatusCard
                      variant="informative"
                      showIcon
                      description={
                        <>
                          <strong>Modifique a visibilidade do conjunto de dados.</strong>
                          <br />
                          Este conjunto de dados encontra‑se atualmente em{" "}
                          <strong>modo privado</strong>. Apenas os membros da organização o podem
                          visualizar e editar.
                        </>
                      }
                    />
                    <div>
                      <Button
                        variant="primary"
                        appearance="outline"
                        onClick={async () => {
                          try {
                            const updated = await updateDataset(dataset.id, { private: false });
                            setDataset(updated);
                            setApiSuccess("Conjunto de dados publicado com sucesso.");
                            setTimeout(() => setApiSuccess(null), 10000);
                          } catch {
                            setApiError("Erro ao publicar o conjunto de dados.");
                          }
                        }}
                        disabled={isSubmitting}
                      >
                        Publicar o conjunto de dados
                      </Button>
                    </div>
                  </div>
                )}

                <form className="admin-page__form" onSubmit={(e) => e.preventDefault()}>
                  <p className="text-neutral-900 text-base leading-7">
                    Os campos marcados com um asterisco ( * ) são obrigatórios.
                  </p>

                  <div>
                    <h2 className="admin-page__section-title admin-page__section-title--no-top">
                      Destaque
                    </h2>
                    <Switch
                      id="edit-featured"
                      label="Destaque"
                      checked={featured}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFeatured(e.target.checked)
                      }
                    />
                  </div>

                  <h2 className="admin-page__section-title admin-page__section-title--no-top">
                    Descrição
                  </h2>
                  <div className="admin-page__fields-group">
                    <IsolatedInput
                      label="Título*"
                      placeholder="Insira o título aqui"
                      id="edit-title"
                      defaultValue={loadedTitle}
                      onChange={handleTitleChange}
                      hasError={!!formErrors.title}
                      hasFeedback={!!formErrors.title}
                      feedbackState="danger"
                      errorFeedbackText="Campo obrigatório"
                    />
                    <IsolatedInput
                      label="Sigla"
                      placeholder="Insira a sigla aqui"
                      id="edit-acronym"
                      defaultValue={loadedAcronym}
                      onChange={setAcronym}
                    />
                    <div className="flex flex-col gap-[8px]">
                      <span className="text-primary-900 text-base font-medium leading-7">
                        Descrição *
                      </span>
                      <RichTextEditor
                        content={description}
                        onChange={(html) => {
                          setDescription(html);
                          if (html.trim()) clearError("description");
                        }}
                      />
                      {formErrors.description && (
                        <span className="text-danger-600 text-sm">Campo obrigatório</span>
                      )}
                    </div>
                    {/*<InputTextArea
                      label="Descrição resumida"
                      placeholder="Insira a descrição aqui"
                      id="edit-short-description"
                      rows={3}
                      maxLength={200}
                      showCharCounter={true}
                      value={shortDescription}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setShortDescription(e.target.value)
                      }
                      hasFeedback
                      feedbackState="info"
                      feedbackText="Se este campo for deixado em branco, serão utilizados os primeiros 197 caracteres da sua descrição, seguidos de '...' (máximo de 200 caracteres)."
                    />*/}
                    <IsolatedSelect
                      label="Palavras-chave"
                      placeholder="Pesquise ou insira palavras-chave..."
                      id="edit-keywords"
                      type="checkbox"
                      searchable
                      searchInputPlaceholder="Escreva para pesquisar ou criar..."
                      searchNoResultsText="Nenhum resultado encontrado"
                      defaultValue={loadedKeywords}
                      onChangeRef={keywordsRef}
                      onSearchCallback={(q) => {
                        setKeywordSearch(q);
                        if (!q) return;
                        suggestTags(q, 20).then(setTagSearch);
                      }}
                      onChangeCallback={(value) => {
                        setLoadedKeywords(value);
                        const selected = value.split(",").filter(Boolean);
                        let addedNew = false;
                        selected.forEach((v) => {
                          const lower = v.toLowerCase();
                          const existsInSuggestions = tagSuggestions.some(
                            (t) => t.text.toLowerCase() === lower,
                          );
                          const existsInSearch = tagSearch.some(
                            (t) => t.text.toLowerCase() === lower,
                          );
                          if (!existsInSuggestions && !existsInSearch) {
                            addedNew = true;
                            setTagSuggestions((prev) => {
                              if (prev.some((t) => t.text.toLowerCase() === lower)) {
                                return prev;
                              }
                              return [...prev, { text: v }];
                            });
                          }
                        });
                        if (addedNew) {
                          setKeywordSearch("");
                        }
                      }}
                    >
                      {keywordOptions}
                    </IsolatedSelect>

                    {selectedKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-8 -mt-8">
                        {selectedKeywords.map((keyword) => (
                          <Tag
                            key={keyword}
                            aria-label={`Remover ${keyword}`}
                            onClick={() => {
                              const next = selectedKeywords
                                .filter((v) => v.toLowerCase() !== keyword.toLowerCase())
                                .join(",");
                              setLoadedKeywords(next);
                              keywordsRef.current = next;
                            }}
                          >
                            {keyword}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </div>

                  <h2 className="admin-page__section-title">Acesso</h2>
                  <div className="admin-page__fields-group">
                    <IsolatedSelect
                      label="Licença"
                      placeholder="Selecione uma licença..."
                      id="edit-license"
                      defaultValue={loadedLicense}
                      onChangeRef={selectedLicenseRef}
                    >
                      {licenseOptions}
                    </IsolatedSelect>
                  </div>

                  <h2 className="admin-page__section-title">Tempo</h2>
                  <div className="admin-page__fields-group">
                    <IsolatedSelect
                      label="Frequência de atualização *"
                      placeholder="Selecione uma frequência..."
                      id="edit-frequency"
                      defaultValue={frequencyDefaultValue}
                      onChangeRef={selectedFrequencyRef}
                    >
                      {frequencyOptions}
                    </IsolatedSelect>

                    <div className="flex gap-[18px] [&>*]:flex-1">
                      <InputDate
                        key={`date-start-${temporalStart}`}
                        label="Cobertura temporal (Data de início)"
                        id="edit-date-start"
                        defaultValue={temporalStart}
                        dayInputPlaceholder="dd"
                        monthInputPlaceholder="mm"
                        yearInputPlaceholder="aaaa"
                        calendarIconAriaLabel="Abrir calendário"
                        previousYearAriaLabel="Ano anterior"
                        previousMonthAriaLabel="Mês anterior"
                        nextMonthAriaLabel="Próximo mês"
                        nextYearAriaLabel="Próximo ano"
                        selectedDayAriaLabel="Dia selecionado"
                        todayDayAriaLabel="Hoje"
                        todayLabel="Hoje"
                        cancelLabel="Cancelar"
                        okLabel="OK"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setTemporalStart(e.target.value)
                        }
                      />
                      <InputDate
                        key={`date-end-${temporalEnd}`}
                        label="Data de fim"
                        id="edit-date-end"
                        defaultValue={temporalEnd}
                        hasError={!!formErrors.temporalEnd}
                        errorFeedbackText="A data de fim tem de ser posterior à data de início"
                        dayInputPlaceholder="dd"
                        monthInputPlaceholder="mm"
                        yearInputPlaceholder="aaaa"
                        calendarIconAriaLabel="Abrir calendário"
                        previousYearAriaLabel="Ano anterior"
                        previousMonthAriaLabel="Mês anterior"
                        nextMonthAriaLabel="Próximo mês"
                        nextYearAriaLabel="Próximo ano"
                        selectedDayAriaLabel="Dia selecionado"
                        todayDayAriaLabel="Hoje"
                        todayLabel="Hoje"
                        cancelLabel="Cancelar"
                        okLabel="OK"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setTemporalEnd(e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <h2 className="admin-page__section-title">Espaço</h2>
                  <div className="admin-page__fields-group">
                    <IsolatedSelect
                      label="Cobertura espacial"
                      placeholder="Selecione uma cobertura espacial..."
                      id="edit-spatial-coverage"
                      type="checkbox"
                      searchable
                      searchInputPlaceholder="Escreva para pesquisar..."
                      searchNoResultsText="Nenhum resultado encontrado"
                      defaultValue={loadedSpatialZones.join(",")}
                      onChangeRef={spatialCoverageRef}
                      onChangeCallback={handleSpatialCoverageChange}
                      onSearchCallback={(q) => {
                        if (q.length < 2) return;
                        suggestSpatialZones(q, 50).then((results) => {
                          spatialZoneSearchRef.current = results;
                          setSpatialZoneSearch(results);
                        });
                      }}
                    >
                      {spatialCoverageOptions}
                    </IsolatedSelect>

                    {selectedZoneObjects.length > 0 && (
                      <div className="flex flex-wrap gap-8 -mt-8">
                        {selectedZoneObjects.map((zone) => (
                          <Tag
                            key={zone.id}
                            aria-label={`Remover ${zone.name}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              const savedScroll = window.scrollY;
                              const next = effectiveSpatialIds
                                .filter((id) => id !== zone.id)
                                .join(",");
                              setSelectedSpatialZonesValue(next);
                              spatialCoverageRef.current = next;
                              setSpatialZones((prev) => prev.filter((z) => z.id !== zone.id));
                              setTimeout(() => {
                                document
                                  .getElementById(
                                    "agora-input-select-edit-spatial-coverage-control",
                                  )
                                  ?.focus({ preventScroll: true });
                                window.scrollTo({ top: savedScroll, behavior: "instant" });
                              }, 50);
                            }}
                          >
                            {zone.code ? `${zone.name} (${zone.code})` : zone.name}
                          </Tag>
                        ))}
                      </div>
                    )}

                    <IsolatedSelect
                      label="Granularidade espacial"
                      placeholder="Selecione uma granularidade..."
                      id="edit-spatial-granularity"
                      defaultValue={loadedSpatialGranularity}
                      onChangeRef={spatialGranularityRef}
                    >
                      {spatialGranularityOptions}
                    </IsolatedSelect>
                  </div>

                  <div className="admin-page__actions flex justify-end mt-[24px]">
                    <Button
                      variant="primary"
                      hasIcon
                      trailingIcon="agora-line-check-circle"
                      trailingIconHover="agora-solid-check-circle"
                      onClick={handleSaveMetadata}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "A guardar..." : "Guardar"}
                    </Button>
                  </div>

                  <div className="dataset-edit-danger-actions">
                    {/* Transfer dataset section hidden — keep for future use
                    <StatusCard
                      variant="informative"
                      showIcon
                      description={
                        <>
                          <strong>Atenção esta ação é irreversível.</strong>
                          <br />
                          <Button
                            appearance="link"
                            variant="primary"
                            hasIcon
                            trailingIcon="agora-line-arrow-right-circle"
                            trailingIconHover="agora-solid-arrow-right-circle"
                            onClick={() => {
                              show(
                                <TransferDatasetPopupContent
                                  datasetTitle={dataset.title}
                                  onConfirm={handleTransferDataset}
                                />,
                                {
                                  title: "Transfira o conjunto de dados",
                                  closeAriaLabel: "Fechar",
                                  dimensions: "m",
                                }
                              );
                            }}
                          >
                            Tranferir o conjunto de dados
                          </Button>
                        </>
                      }
                    />
                    */}
                    <StatusCard
                      variant="warning"
                      showIcon
                      description={
                        <>
                          <strong>
                            Um conjunto de dados arquivado deixa de estar indexado no portal, mas
                            permanece acessível através de um link direto.
                          </strong>
                          <br />
                          <Button
                            appearance="link"
                            variant="primary"
                            hasIcon
                            trailingIcon="agora-line-arrow-right-circle"
                            trailingIconHover="agora-solid-arrow-right-circle"
                            onClick={(e: React.MouseEvent) => {
                              e.preventDefault();
                              e.stopPropagation();
                              dataset?.archived ? handleUnarchiveDataset() : handleArchiveDataset();
                            }}
                          >
                            {dataset?.archived
                              ? "Desarquivar o conjunto de dados"
                              : "Arquivar o conjunto de dados"}
                          </Button>
                        </>
                      }
                    />
                    <StatusCard
                      variant="danger"
                      showIcon
                      description={
                        <>
                          <strong>Atenção esta ação é irreversível.</strong>
                          <br />
                          <Button
                            appearance="link"
                            variant="primary"
                            hasIcon
                            trailingIcon="agora-line-arrow-right-circle"
                            trailingIconHover="agora-solid-arrow-right-circle"
                            onClick={(e: React.MouseEvent) => {
                              e.preventDefault();
                              e.stopPropagation();
                              show(
                                <DeleteDatasetPopupContent
                                  onClose={hide}
                                  onConfirm={handleDeleteDataset}
                                />,
                                {
                                  title: "Elimine o conjunto de dados",
                                  closeAriaLabel: "Fechar",
                                  dimensions: "m",
                                }
                              );
                            }}
                            disabled={isSubmitting}
                          >
                            Eliminar o conjunto de dados
                          </Button>
                        </>
                      }
                    />
                  </div>
                </form>
              </div>

              <aside className="admin-page__auxiliar">
                <div className="admin-page__auxiliar-inner">
                  <div className="admin-page__auxiliar-header">
                    <Icon name="agora-line-question-mark" className="w-[24px] h-[24px]" />
                    <h2 className="admin-page__auxiliar-title">Auxiliar</h2>
                  </div>
                  <AuxiliarList
                    items={getDatasetAuxiliarItems({
                      title: !!formErrors.title,
                      description: !!formErrors.description,
                    })}
                  />
                </div>
              </aside>
            </div>
          </TabBody>
        </Tab>

        {/* Resources Tab */}
        <Tab>
          <TabHeader>Ficheiros ({dataset.resources.length})</TabHeader>
          <TabBody>
            <div className="mt-[24px]">
              <div className="flex items-end gap-[16px] mb-16 [&_.instructions]:items-center [&_.instructions]:text-center [&_.drag-and-drop-area_.agora-btn]:w-fit">
                <DragAndDropUploader
                  key={uploaderKey}
                  label="Ficheiros"
                  dragAndDropLabel="Arraste e largue os ficheiros aqui"
                  inputLabel="Selecione ou arraste os ficheiros"
                  selectedFilesLabel="ficheiros selecionados"
                  removeFileButtonLabel="Remover ficheiro"
                  replaceFileButtonLabel="Substituir ficheiro"
                  maxSizeExceededErrorLabel="O ficheiro excede o tamanho máximo permitido."
                  forbiddenExtensionErrorLabel="Formato de ficheiro não permitido."
                  hasError={!!fileUploadError}
                  hasFeedback={!!fileUploadError}
                  feedbackState="danger"
                  feedbackText={fileUploadError ?? undefined}
                  multiple
                  onChange={handleFileUpload}
                  onSecurityError={() => setFileUploadError(POISONED_FILE_WARNING)}
                />
                <Button appearance="outline" variant="primary" className="mb-[32px]">
                  Reordene os ficheiros
                </Button>
              </div>

              <h2 className="font-medium text-neutral-900 text-base mb-16">
                {dataset.resources.length}{" "}
                {dataset.resources.length === 1 ? "FICHEIRO" : "FICHEIROS"}
              </h2>

              {dataset.resources.length === 0 && (
                <CardNoResults
                  position="center"
                  icon={
                    <Icon
                      name="agora-line-document"
                      className="w-12 h-12 text-primary-500 icon-xl"
                    />
                  }
                  title="Sem ficheiros"
                  description="Este conjunto de dados ainda não tem ficheiros. Adicione ficheiros ou links para começar."
                  hasAnchor={false}
                />
              )}

              {dataset.resources.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>Nome do ficheiro</TableHeaderCell>
                      <TableHeaderCell>Estado</TableHeaderCell>
                      <TableHeaderCell>Tipo</TableHeaderCell>
                      <TableHeaderCell>Formato</TableHeaderCell>
                      <TableHeaderCell>Criado em</TableHeaderCell>
                      <TableHeaderCell>Atualizado em</TableHeaderCell>
                      <TableHeaderCell>Ação</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataset.resources.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell headerLabel="Nome do ficheiro">
                          <button
                            className="text-primary-600 underline text-left cursor-pointer"
                            onClick={() => handleResourceClick(resource)}
                          >
                            {resource.title}
                          </button>
                        </TableCell>
                        <TableCell headerLabel="Estado">
                          <StatusDot variant="success">DISPONÍVEL</StatusDot>
                        </TableCell>
                        <TableCell headerLabel="Tipo">
                          {resource.type === "main" ? "Ficheiros principais" : resource.type || "-"}
                        </TableCell>
                        <TableCell headerLabel="Formato">
                          {resource.format ? resource.format.toUpperCase() : "-"}
                        </TableCell>
                        <TableCell headerLabel="Criado em">
                          {format(new Date(resource.created_at), "d 'de' MMMM 'de' yyyy", {
                            locale: pt,
                          })}
                        </TableCell>
                        <TableCell headerLabel="Atualizado em">
                          {format(
                            new Date(resource.last_modified || resource.created_at),
                            "d 'de' MMMM 'de' yyyy",
                            { locale: pt }
                          )}
                        </TableCell>
                        <TableCell headerLabel="Ação">
                          <div className="flex items-center gap-[8px]">
                            <button
                              className="text-primary-500 hover:text-primary-700"
                              title="Ver detalhes"
                              onClick={() => handleResourceClick(resource)}
                            >
                              <Icon name="agora-line-eye" className="w-[20px] h-[20px]" />
                            </button>
                            <button
                              className="text-primary-500 hover:text-primary-700"
                              title="Editar recurso"
                              onClick={() => handleResourceEdit(resource)}
                            >
                              <Icon name="agora-line-edit" className="w-[20px] h-[20px]" />
                            </button>
                            <button
                              className="text-danger-500 hover:text-danger-700"
                              title="Eliminar ficheiro"
                              onClick={() => handleDeleteResource(resource)}
                              disabled={isSubmitting}
                            >
                              <Icon name="agora-line-trash" className="w-[20px] h-[20px]" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabBody>
        </Tab>

        {/* Discussions Tab */}
        <Tab>
          <TabHeader>Discussões ({discussionsTotal ?? 0})</TabHeader>
          <TabBody>
            <div className="mt-[24px]">
              {discussionsLoading && <p className="text-neutral-700 text-sm">A carregar...</p>}
              {discussionsLoaded && discussions.length === 0 && (
                <CardNoResults
                  position="center"
                  icon={
                    <Icon name="agora-line-chat" className="w-12 h-12 text-primary-500 icon-xl" />
                  }
                  title="Sem discussões"
                  description="Ainda não existem discussões neste conjunto de dados."
                  hasAnchor={false}
                />
              )}
              {discussionsLoaded && discussions.length > 0 && (
                <div>
                  <h2 className="font-medium text-neutral-900 text-base mb-16">
                    {discussions.length} {discussions.length === 1 ? "DISCUSSÃO" : "DISCUSSÕES"}
                  </h2>
                  <div className="space-y-[16px]">
                    {discussions.map((disc) => (
                      <div key={disc.id} className="bg-white rounded-[8px] p-[32px]">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-bold text-neutral-900 text-base">{disc.title}</h4>
                            <p className="text-sm text-neutral-900 mt-[4px]">
                              <span className="text-primary-600 font-medium">
                                {disc.user.first_name} {disc.user.last_name}
                              </span>
                              {" — Publicado em "}
                              {format(new Date(disc.created), "d 'de' MMMM 'de' yyyy", {
                                locale: pt,
                              })}
                            </p>
                          </div>
                          <Pill variant={disc.closed ? "neutral" : "informative"}>
                            {disc.closed ? "Fechada" : "Aberta"}
                          </Pill>
                        </div>
                        {disc.discussion.length > 0 && (
                          <p className="text-neutral-900 text-sm mt-16">
                            {disc.discussion[0].content}
                          </p>
                        )}
                        {disc.discussion.length > 1 && (
                          <div className="mt-16 space-y-[16px] border-t border-neutral-200 pt-[16px]">
                            {disc.discussion.slice(1).map((msg, idx) => (
                              <div key={idx} className="border-l-2 border-primary-600 pl-[24px]">
                                <p className="text-sm text-neutral-900">
                                  <span className="text-primary-600 font-medium">
                                    {msg.posted_by.first_name} {msg.posted_by.last_name}
                                  </span>
                                  {" — "}
                                  {format(new Date(msg.posted_on), "d 'de' MMMM 'de' yyyy", {
                                    locale: pt,
                                  })}
                                </p>
                                <p className="text-neutral-900 text-sm mt-[4px]">{msg.content}</p>
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
            <div className="mt-[24px]">
              {activitiesLoading && <p className="text-neutral-700 text-sm">A carregar...</p>}
              {activitiesLoaded && activities.length === 0 && (
                <CardNoResults
                  position="center"
                  icon={
                    <Icon name="agora-line-time" className="w-12 h-12 text-primary-500 icon-xl" />
                  }
                  title="Sem atividades"
                  description="Ainda não existem atividades registadas neste conjunto de dados."
                  hasAnchor={false}
                />
              )}
              {activitiesLoaded && activities.length > 0 && (
                <>
                  <h2 className="font-medium text-neutral-900 text-base mb-16">
                    {activities.length} ATIVIDADES
                  </h2>
                  <div className="flex flex-col gap-[12px]">
                    {activities.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-[12px] p-[12px] bg-neutral-50 rounded-lg"
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
                          <p className="text-xs text-neutral-600 mt-[4px]">
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
    </div>
  );
}
