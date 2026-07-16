"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  InputText,
  InputTextArea,
  RadioButton,
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
import AuxiliarList from "@/components/admin/AuxiliarList";
import { getDataserviceAuxiliarItems } from "@/components/admin/dataservices/dataservicesAuxiliarItems";
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

export default function DataservicesEditClient() {
  const router = useRouter();
  const { user } = useAuth();
  const { show, hide } = usePopupContext();
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
      setDatasetLinkError("URL inválido. Cole o link de um conjunto de dados deste portal.");
      return;
    }

    setIsResolvingLink(true);
    try {
      const dataset = await fetchDataset(slug);
      if (selectedDatasets.some((d) => d.id === dataset.id)) {
        setDatasetLinkError("Este conjunto de dados já foi adicionado.");
        return;
      }
      setLinkDatasets((prev) => [...prev, dataset]);
      setDatasetLinkUrl("");
    } catch {
      setDatasetLinkError("Conjunto de dados não encontrado neste portal.");
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
      setApiSuccess("API atualizada com sucesso.");
      setTimeout(() => setApiSuccess(null), 10000);
    } catch (error: unknown) {
      const err = error as { data?: Record<string, unknown> };
      setApiError(
        err?.data
          ? Object.entries(err.data)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")
          : "Erro ao guardar. Tente novamente."
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
      setApiSuccess("Conjuntos de dados associados com sucesso.");
      setTimeout(() => setApiSuccess(null), 10000);
    } catch (error: unknown) {
      const err = error as { data?: Record<string, unknown> };
      setApiError(
        err?.data
          ? Object.entries(err.data)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")
          : "Erro ao associar conjuntos de dados."
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
      setApiSuccess("API publicada com sucesso.");
      setTimeout(() => setApiSuccess(null), 10000);
    } catch {
      setApiError("Erro ao publicar a API. Tente novamente.");
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
      setApiSuccess(isArchiving ? "API arquivada com sucesso." : "API desarquivada com sucesso.");
      setTimeout(() => setApiSuccess(null), 10000);
    } catch (error) {
      console.error("Error archiving dataservice:", error);
      setApiError(
        isArchiving
          ? "Erro ao arquivar a API. Tente novamente."
          : "Erro ao desarquivar a API. Tente novamente."
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
      title: "Elimine a API",
      closeAriaLabel: "Fechar",
      dimensions: "m",
    });
  };

  const auxiliarItems = getDataserviceAuxiliarItems({
    name: !!formErrors.title,
    description: !!formErrors.description,
  });

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
      title={dataservice?.title || "Editar API"}
      breadcrumbItems={[
        { label: "Administração", url: "/admin" },
        { label: "API", url: "/admin/dataservices" },
        { label: dataservice?.title || "Editar", url: "#" },
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
            Ver página pública
          </span>
        </Button>
      }
    >
      {isLoading ? null : !dataservice ? (
        <p className="text-neutral-500">API não encontrada.</p>
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
                {dataservice.private ? "RASCUNHO" : "PÚBLICO"}
              </Pill>
              {dataservice.archived_at && <Pill variant="neutral">ARQUIVADO</Pill>}
              <span className="admin-edit-info__stat">
                <Icon name="agora-line-eye" className="admin-edit-info__stat-icon" />
                {`${dataservice.metrics?.views || 0} visualizações`}
              </span>
              <span className="admin-edit-info__stat">
                <Icon name="agora-line-star" className="admin-edit-info__stat-icon" />
                {`${dataservice.metrics?.followers || 0} favoritos`}
              </span>
            </div>

            <p className="admin-edit-info__activity">
              <Icon name="agora-line-clock" className="admin-edit-info__clock-icon" />
              {" Atividade mais recente: "}
              {dataservice.owner && (
                <TextLink href={`/users/${dataservice.owner.slug}`}>
                  {dataservice.owner.first_name} {dataservice.owner.last_name}
                </TextLink>
              )}
              {" — atualizou a API — "}
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
              <TabHeader>Metadados</TabHeader>
              <TabBody>
                <div className="admin-page__body">
                  <div className="admin-page__form-area">
                    {dataservice.private && (
                      <div className="dataset-edit-visibility-banner">
                        <StatusCard
                          variant="informative"
                          showIcon
                          description={
                            <>
                              <strong>Modifique a visibilidade da API.</strong>
                              <br />
                              Esta API encontra-se atualmente em{" "}
                              <strong>modo rascunho</strong>. Apenas o produtor e os membros
                              da organização a podem visualizar e editar.
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
                            Publicar API
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
                        Os campos marcados com um asterisco ( * ) são obrigatórios.
                      </p>

                      <h2 className="admin-page__section-title">Descrição</h2>
                      <div className="admin-page__fields-group">
                        <InputText
                          label="Nome da API *"
                          placeholder="Insira o nome aqui"
                          id="edit-api-name"
                          value={title}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setTitle(e.target.value);
                            if (e.target.value.trim()) clearError("title");
                          }}
                          hasError={!!formErrors.title}
                          hasFeedback={!!formErrors.title}
                          feedbackState="danger"
                          errorFeedbackText="Campo obrigatório"
                        />
                        <InputText
                          label="Sigla"
                          placeholder="Insira a sigla aqui"
                          id="edit-api-acronym"
                          value={acronym}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setAcronym(e.target.value)
                          }
                        />
                        <InputTextArea
                          label="Descrição *"
                          placeholder="Insira a descrição aqui"
                          id="edit-api-description"
                          rows={4}
                          maxLength={246}
                          value={description}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                            setDescription(e.target.value);
                            if (e.target.value.trim()) clearError("description");
                          }}
                          hasError={!!formErrors.description}
                          hasFeedback={!!formErrors.description}
                          feedbackState="danger"
                          errorFeedbackText="Campo obrigatório"
                        />
                        <InputText
                          label="Link raiz da API"
                          placeholder="Insira o URL aqui"
                          id="edit-api-root-link"
                          value={baseApiUrl}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setBaseApiUrl(e.target.value)
                          }
                        />
                        <InputText
                          label="Link para a documentação da API (ficheiro OpenAPI ou Swagger)"
                          placeholder="Insira o URL aqui"
                          id="edit-api-doc-openapi"
                          value={machineDocUrl}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setMachineDocUrl(e.target.value)
                          }
                        />
                        <InputText
                          label="Link para a documentação técnica da API"
                          placeholder="Insira o URL aqui"
                          id="edit-api-doc-technical"
                          value={technicalDocUrl}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setTechnicalDocUrl(e.target.value)
                          }
                        />
                        <InputText
                          label="Disponibilidade"
                          placeholder="99,9"
                          id="edit-api-availability"
                          value={availability}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setAvailability(e.target.value)
                          }
                        />
                      </div>

                      <h2 className="admin-page__section-title">Acesso</h2>
                      <div className="admin-page__fields-group">
                        <div className="flex flex-col gap-8">
                          <span className="text-primary-900 text-base font-medium leading-7">
                            Tipo de acesso
                          </span>
                          <div className="flex flex-row gap-4">
                            <RadioButton
                              label="Aberto"
                              id="edit-access-open"
                              name="edit-access-type"
                              checked={accessType === "open"}
                              onChange={() => setAccessType("open")}
                            />
                            <RadioButton
                              label="Aberto com conta"
                              id="edit-access-account"
                              name="edit-access-type"
                              checked={accessType === "open_with_account"}
                              onChange={() => setAccessType("open_with_account")}
                            />
                            <RadioButton
                              label="Restrito"
                              id="edit-access-restricted"
                              name="edit-access-type"
                              checked={accessType === "restricted"}
                              onChange={() => setAccessType("restricted")}
                            />
                          </div>
                        </div>

                        {accessType === "restricted" && (
                          <>
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                              {AUDIENCE_ROLES.map((role) => (
                                <InputSelect
                                  key={role.role}
                                  label={role.label}
                                  placeholder="Selecione uma opção"
                                  id={`edit-access-audience-${role.role}`}
                                  onChange={(options) =>
                                    setAccessAudiences((prev) => ({
                                      ...prev,
                                      [role.role]: (options[0]?.value as string) || "",
                                    }))
                                  }
                                >
                                  <DropdownSection name={`audience-${role.role}`}>
                                    {AUDIENCE_CONDITIONS.map((condition) => (
                                      <DropdownOption
                                        key={condition.value}
                                        value={condition.value}
                                        selected={accessAudiences[role.role] === condition.value}
                                      >
                                        {condition.label}
                                      </DropdownOption>
                                    ))}
                                  </DropdownSection>
                                </InputSelect>
                              ))}
                            </div>

                            <InputSelect
                              label="Motivo da restrição"
                              placeholder="Selecione uma opção"
                              id="edit-access-reason-category"
                              onChange={(options) =>
                                setReasonCategory((options[0]?.value as string) || "")
                              }
                            >
                              <DropdownSection name="reason-category">
                                {RESTRICTION_REASONS.map((reason) => (
                                  <DropdownOption
                                    key={reason.value}
                                    value={reason.value}
                                    selected={reasonCategory === reason.value}
                                  >
                                    {reason.label}
                                  </DropdownOption>
                                ))}
                              </DropdownSection>
                            </InputSelect>

                            {reasonCategory === "other" && (
                              <InputText
                                label="Especifique o motivo da restrição"
                                placeholder="Descreva o motivo"
                                id="edit-access-reason-text"
                                value={reasonText}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setReasonText(e.target.value)
                                }
                              />
                            )}
                          </>
                        )}

                        <InputText
                          label="Link para a ferramenta de autorização de acesso"
                          placeholder="Insira o URL aqui"
                          id="edit-api-auth-tool"
                          value={authRequestUrl}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setAuthRequestUrl(e.target.value)
                          }
                        />
                        <InputText
                          label="Link para a documentação funcional"
                          placeholder="Insira o URL aqui"
                          id="edit-api-doc-commercial"
                          value={businessDocUrl}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setBusinessDocUrl(e.target.value)
                          }
                        />
                      </div>

                      <h2 className="admin-page__section-title">Termos de uso</h2>
                      <div className="admin-page__fields-group">
                        <InputText
                          label="Limite de chamadas"
                          placeholder="Insira aqui"
                          id="edit-api-rate-limit"
                          value={rateLimiting}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setRateLimiting(e.target.value)
                          }
                        />
                        <InputText
                          label="Link para a documentação sobre limites de chamadas"
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
                          {isSaving ? "A guardar..." : "Guardar"}
                        </Button>
                      </div>

                      <div className="dataset-edit-danger-actions">
                        <StatusCard
                          variant="warning"
                          showIcon
                          description={
                            <>
                              <strong>
                                {dataservice.archived_at
                                  ? "Esta API está arquivada. Pode desarquivar para voltar a indexá-la no portal."
                                  : "Uma API arquivada deixa de estar indexada no portal, mas permanece acessível através de um link direto."}
                              </strong>
                              <br />
                              <Button
                                appearance="link"
                                variant="primary"
                                hasIcon
                                trailingIcon="agora-line-arrow-right-circle"
                                trailingIconHover="agora-solid-arrow-right-circle"
                                onClick={handleArchive}
                                disabled={isSaving}
                              >
                                {dataservice.archived_at ? "Desarquivar a API" : "Arquivar a API"}
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
                                onClick={handleOpenDeletePopup}
                                disabled={isSaving}
                              >
                                Eliminar a API
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
                        <AppIcon name="agora-line-question-mark" className="w-24 h-24" />
                        <h2 className="admin-page__auxiliar-title">Auxiliar</h2>
                      </div>
                      <AuxiliarList items={auxiliarItems} />
                    </div>
                  </aside>
                </div>
              </TabBody>
            </Tab>

            {/* Datasets Tab */}
            <Tab>
              <TabHeader>Conjuntos de dados associados ({selectedDatasets.length})</TabHeader>
              <TabBody>
                <div className="mt-24 admin-page__form-area">
                  <StatusCard
                    variant="informative"
                    showIcon
                    description="É importante vincular todos os conjuntos de dados utilizados, pois isso ajuda a compreender as referências cruzadas necessárias e a melhorar a visibilidade da sua reutilização."
                  />

                  <form
                    className="admin-page__form"
                    noValidate
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <InputSelect
                      label="Pesquisar um conjunto de dados"
                      placeholder="Selecione conjuntos de dados..."
                      id="edit-dataservice-datasets"
                      type="checkbox"
                      searchable
                      searchInputPlaceholder="Escreva para pesquisar em todos os conjuntos de dados..."
                      searchNoResultsText="Nenhum resultado encontrado"
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
                            aria-label={`Remover ${dataset.title}`}
                            onClick={() => removeDataset(dataset.id)}
                          >
                            {dataset.title}
                          </Tag>
                        ))}
                      </div>
                    )}

                    <div className="admin-page__divider-or">
                      <span className="admin-page__divider-or-text">ou</span>
                    </div>

                    <div className="flex flex-col gap-8">
                      <InputText
                        label="Link para o conjunto de dados"
                        placeholder="https://..."
                        id="edit-dataset-link-url"
                        required={false}
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
                          type="button"
                          appearance="outline"
                          variant="primary"
                          hasIcon
                          leadingIcon="agora-line-plus-circle"
                          leadingIconHover="agora-solid-plus-circle"
                          onClick={handleAddDatasetLink}
                          disabled={isResolvingLink || !datasetLinkUrl.trim()}
                        >
                          Adicionar
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
                        {isSaving ? "A guardar..." : "Guardar"}
                      </Button>
                    </div>
                  </form>
                </div>
              </TabBody>
            </Tab>

            {/* Discussions Tab */}
            <Tab>
              <TabHeader>Discussões ({discussionsCount})</TabHeader>
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
              <TabHeader>Atividades</TabHeader>
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
