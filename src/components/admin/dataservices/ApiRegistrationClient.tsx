"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Button,
  InputText,
  InputTextArea,
  RadioButton,
  StatusCard,
  Accordion,
  AccordionGroup,
  InputSelect,
  DropdownSection,
  DropdownOption,
  CardLinks,
  Icon,
  Pill,
} from "@ama-pt/agora-design-system";
import { createDataservice, updateDataservice } from "@/service/api/dataservices";
import { fetchMyDatasets, fetchDataset } from "@/service/api/datasets";
import { fetchOrgDatasets } from "@/service/api/organizations";
import { searchDatasets } from "@/service/api/search";
import type { Dataservice } from "@/service/types/dataservice";
import type { Dataset } from "@/service/types/dataset";
import AuxiliarList from "@/components/admin/AuxiliarList";
import PublicationFeedbackButton from "@/components/admin/PublicationFeedbackButton";
import { useAuth } from "@/context/AuthContext";
import AppIcon from "@/components/Primitives/AppIcon";
import CardMetrics, { CardMetricsProps } from "@/components/Primitives/Cards/CardMetrics";
import { formatDateToTimeAgo } from "@/utils/formatDate";
import {
  AUDIENCE_CONDITIONS,
  AUDIENCE_ROLES,
  RESTRICTION_REASONS,
} from "@/utils/dataserviceLabels";

interface ApiRegistrationClientProps {
  currentStep: number;
  onNextStep: () => void;
  onPreviousStep: () => void;
}

export default function ApiRegistrationClient({
  currentStep,
  onNextStep,
  onPreviousStep,
}: ApiRegistrationClientProps) {
  const { user } = useAuth();
  const [accessType, setAccessType] = useState("open");
  const [apiName, setApiName] = useState("");
  const [apiAcronym, setApiAcronym] = useState("");
  const [apiDescription, setApiDescription] = useState("");
  const [baseApiUrl, setBaseApiUrl] = useState("");
  const [machineDocUrl, setMachineDocUrl] = useState("");
  const [technicalDocUrl, setTechnicalDocUrl] = useState("");
  const [rateLimiting, setRateLimiting] = useState("");
  const [rateLimitingUrl, setRateLimitingUrl] = useState("");
  const [availability, setAvailability] = useState("");
  const [authRequestUrl, setAuthRequestUrl] = useState("");
  const [businessDocUrl, setBusinessDocUrl] = useState("");
  // Restricted-access details (only sent when accessType === "restricted").
  // Maps each audience role to its selected condition ("" = not set).
  const [accessAudiences, setAccessAudiences] = useState<Record<string, string>>({});
  const [reasonCategory, setReasonCategory] = useState("");
  const [reasonText, setReasonText] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdDataservice, setCreatedDataservice] = useState<Dataservice | null>(null);
  // Producer identity: "user" (publish in my own name) or an organization id.
  // The Agora InputSelect reports the selected value into this ref's `.current`.
  const producerRef = useRef("user");
  // Step 2: link internal datasets to the created API. The two input methods
  // write to independent buckets so neither clobbers the other:
  // `dropdownDatasets` is owned by the search multi-select (replace semantics),
  // `linkDatasets` by the "add by URL" field. The persisted/displayed selection
  // is their deduped union.
  const [myDatasets, setMyDatasets] = useState<Dataset[]>([]);
  const [dropdownDatasets, setDropdownDatasets] = useState<Dataset[]>([]);
  const [linkDatasets, setLinkDatasets] = useState<Dataset[]>([]);
  const [datasetSearch, setDatasetSearch] = useState("");
  const [datasetSearchResults, setDatasetSearchResults] = useState<Dataset[]>([]);
  const [isLinkingDatasets, setIsLinkingDatasets] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  // Step 2: add a portal dataset by pasting its public URL.
  const [datasetLinkUrl, setDatasetLinkUrl] = useState("");
  const [datasetLinkError, setDatasetLinkError] = useState<string | null>(null);
  const [isResolvingLink, setIsResolvingLink] = useState(false);

  // Preload the dataset pool with the user's own datasets and every dataset
  // from each organization they belong to. The search bar still queries the
  // whole portal via searchDatasets().
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

  const handleStep2Next = async () => {
    if (createdDataservice && selectedDatasets.length > 0) {
      setIsLinkingDatasets(true);
      try {
        await updateDataservice(createdDataservice.id, {
          datasets: selectedDatasets.map((d) => d.id),
        });
      } catch (error) {
        console.error("Error linking datasets to dataservice:", error);
      } finally {
        setIsLinkingDatasets(false);
      }
    }
    onNextStep();
  };

  const handleStep1Next = async () => {
    const errors: Record<string, boolean> = {};
    if (!apiName.trim()) errors.apiName = true;
    if (!apiDescription.trim()) errors.apiDescription = true;
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setApiError(null);
    setIsSubmitting(true);

    try {
      const producer = producerRef.current;
      const organization =
        producer && producer !== "user" ? producer : undefined;
      const isRestricted = accessType === "restricted";
      const audiences = isRestricted
        ? AUDIENCE_ROLES.filter((r) => accessAudiences[r.role]).map((r) => ({
            role: r.role,
            condition: accessAudiences[r.role],
          }))
        : undefined;
      const usesOtherReason = reasonCategory === "other";
      const dataservice = await createDataservice({
        title: apiName.trim(),
        organization,
        description: apiDescription.trim(),
        acronym: apiAcronym.trim() || undefined,
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
        private: true,
      });

      setCreatedDataservice(dataservice);
      onNextStep();
    } catch (error: unknown) {
      const err = error as { status?: number; data?: Record<string, unknown> };
      if (err.data && typeof err.data === "object") {
        const messages = Object.entries(err.data)
          .map(([key, val]) => `${key}: ${val}`)
          .join(", ");
        setApiError(messages);
      } else {
        setApiError("Erro ao criar a API. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: the API was created as a draft (private: true) in step 1. Publishing
  // flips it public and redirects to the API's public page; saving keeps it as a
  // draft and returns to the list.
  const handlePublish = async () => {
    if (!createdDataservice) return;
    setIsPublishing(true);
    setApiError(null);
    try {
      await updateDataservice(createdDataservice.id, { private: false });
      window.location.href = createdDataservice.slug
        ? `/pages/dataservices/${createdDataservice.slug}`
        : "/pages/admin/me/dataservices";
    } catch {
      setApiError("Erro ao publicar a API. Tente novamente.");
      setIsPublishing(false);
    }
  };

  const handleSaveDraft = () => {
    window.location.href = "/pages/admin/me/dataservices";
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

  const auxiliarItemsStep1 = [
    {
      title: "Como dar nome à sua API",
      content:
        'Dê à sua API um nome relevante e descritivo que reflita sua função ou área de aplicação. Um bom nome facilita a busca e a identificação por parte dos utilizadores. Sempre adicione o prefixo "API" para manter a consistência.',
      hasError: !!formErrors.apiName,
    },
    {
      title: "Adicione uma abreviação ou sigla à API.",
      content:
        "Tem a opção de adicionar uma sigla à sua API. As letras que compõem essa sigla não precisam ser separadas por pontos.",
    },
    {
      title: "Escreva uma boa descrição",
      content:
        "Escreva uma descrição clara e precisa da API. Os utilizadores precisam entender a finalidade da API, os dados fornecidos, o escopo abrangido (os dados são completos? Há alguma lacuna?), a frequência de atualização dos dados e os parâmetros que podem ser usados para fazer uma chamada.",
      hasError: !!formErrors.apiDescription,
    },
    {
      title: "Defina o link correto para a API.",
      content:
        "A URL base de uma API é o ponto de entrada comum para todas as requisições, geralmente consistindo em um domínio ou endereço de servidor. Ela serve como base para a qual caminhos específicos (endpoints) são adicionados para acessar os diversos recursos da API.",
    },
    {
      title: "Adicione um link para a documentação da máquina.",
      content:
        "Idealmente, forneça um link OpenAPI (Swagger) que permita aos desenvolvedores explorar os endpoints, visualizar os métodos disponíveis e testar consultas diretamente da documentação. Para serviços geográficos, pode fornecer um link para o serviço com uma consulta GetCapabilities para recuperar os metadados do serviço.",
    },
    {
      title: "Adicione um link para a documentação técnica.",
      content:
        "Adicione um link para a documentação técnica geral da API, descrevendo os passos de integração.",
    },
    {
      title: "Especifique o limite de chamadas",
      content:
        "Caso o número de chamadas à sua API seja limitado, defina aqui o número máximo de chamadas por minuto, ou mesmo por IP e/ou token.",
    },
    {
      title: "Indique a disponibilidade",
      content:
        "Especifique a disponibilidade média da sua API. O valor deve ser uma porcentagem.",
    },
    {
      title: "Selecione um tipo de acesso",
      content:
        'Escolha o tipo de acesso (aberto, aberto com conta ou restrito). Selecione "aberto" se os dados forem públicos. Selecione "aberto com conta" se o acesso aos dados exigir uma conta. Se selecionar "restrito", especifique os tipos de utilizadores que podem aceder a esta API.',
    },
    {
      title: "Adicione um link à solicitação de autorização.",
      content:
        "Se a sua API tiver acesso restrito, adicione o link ao formulário de solicitação de acesso. É administrador? A solução Datapass permite criar e gerenciar formulários de solicitação de acesso a dados com facilidade.",
    },
    {
      title: "Adicione um link para a documentação da empresa.",
      content:
        "A documentação comercial da sua API explica seu escopo e casos de uso. Ela complementa a documentação técnica.",
    },
  ];

  const auxiliarItems = auxiliarItemsStep1;

  return (
    <>
      {/* Main content area: form + auxiliar sidebar */}
      <div className="admin-page__body">
        {/* Left: Form */}
        <div className="admin-page__form-area">
          {/* Step 1: Descreva a sua API */}
          {currentStep === 1 && (
            <>
              <StatusCard
                variant="informative"
                showIcon
                description={
                  <>
                    <strong>O que é uma API?</strong>
                    <br />
                    Uma API é uma ferramenta informática que permite que um website
                    ou software se comunique com outro computador e troque dados.
                  </>
                }
              />

              {apiError && (
                <StatusCard variant="danger" showIcon description={apiError} />
              )}

              <form className="admin-page__form">
                <p className="text-neutral-900 text-base leading-7 pt-32">
                  Os campos marcados com um asterisco ( * ) são obrigatórios.
                </p>
                <h2 className="admin-page__section-title">Produtor</h2>

                <InputSelect
                  label="Verifique a identidade que deseja usar na publicação."
                  placeholder="Para pesquisar..."
                  id="producer-identity"
                  onChange={(options) => {
                    producerRef.current = (options[0]?.value as string) || "user";
                  }}
                >
                  <DropdownSection name="identity">
                    {[
                      <DropdownOption key="user" value="user">
                        {user
                          ? `${user.first_name} ${user.last_name}`
                          : "Eu próprio"}
                      </DropdownOption>,
                      ...(user?.organizations || []).map((org) => (
                        <DropdownOption key={org.id} value={org.id}>
                          {org.name}
                        </DropdownOption>
                      )),
                    ]}
                  </DropdownSection>
                </InputSelect>

                <div className="admin-page__org-card">
                  <p className="admin-page__org-card-title">
                    Não pertence a nenhuma organização.
                  </p>
                  <p className="admin-page__org-card-description">
                    Recomendamos que publique em nome de uma organização se se
                    tratar de uma atividade profissional.
                  </p>
                  <a
                    href="/pages/admin/organizations/new"
                    className="admin-page__org-card-link"
                  >
                    Crie ou integre uma organização em dados.gov.pt
                    <AppIcon
                      name="agora-line-arrow-right-circle"
                      className="w-24 h-24"
                    />
                  </a>
                </div>

                <h2 className="admin-page__section-title">Descrição</h2>

                <div className="admin-page__fields-group">
                  <InputText
                    label="Nome da API *"
                    placeholder="Insira o nome aqui"
                    id="api-name"
                    value={apiName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setApiName(e.target.value);
                      if (e.target.value.trim()) clearError("apiName");
                    }}
                    hasError={!!formErrors.apiName}
                    hasFeedback={!!formErrors.apiName}
                    feedbackState="danger"
                    errorFeedbackText="Campo obrigatório"
                  />
                  <InputText
                    label="Sigla"
                    placeholder="Insira a sigla aqui"
                    id="api-acronym"
                    value={apiAcronym}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setApiAcronym(e.target.value)
                    }
                  />
                  <InputTextArea
                    label="Descrição *"
                    placeholder="Insira a descrição aqui"
                    id="api-description"
                    rows={4}
                    maxLength={246}
                    value={apiDescription}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      setApiDescription(e.target.value);
                      if (e.target.value.trim()) clearError("apiDescription");
                    }}
                    hasError={!!formErrors.apiDescription}
                    hasFeedback={!!formErrors.apiDescription}
                    feedbackState="danger"
                    errorFeedbackText="Campo obrigatório"
                  />
                  <InputText
                    label="Link raiz da API"
                    placeholder="Insira o URL aqui"
                    id="api-root-link"
                    value={baseApiUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setBaseApiUrl(e.target.value)
                    }
                  />
                  <InputText
                    label="Link para a documentação da API (ficheiro OpenAPI ou Swagger)"
                    placeholder="Insira o URL aqui"
                    id="api-doc-openapi"
                    value={machineDocUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMachineDocUrl(e.target.value)
                    }
                  />
                  <InputText
                    label="Link para a documentação técnica da API"
                    placeholder="Insira o URL aqui"
                    id="api-doc-technical"
                    value={technicalDocUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setTechnicalDocUrl(e.target.value)
                    }
                  />
                  <InputText
                    label="Disponibilidade"
                    placeholder="99,9"
                    id="api-availability"
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
                        label="Abrir"
                        id="access-open"
                        name="access-type"
                        checked={accessType === "open"}
                        onChange={() => setAccessType("open")}
                      />
                      <RadioButton
                        label="Abrir com conta"
                        id="access-account"
                        name="access-type"
                        checked={accessType === "open_with_account"}
                        onChange={() => setAccessType("open_with_account")}
                      />
                      <RadioButton
                        label="Restrito"
                        id="access-restricted"
                        name="access-type"
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
                            id={`access-audience-${role.role}`}
                            onChange={(options) =>
                              setAccessAudiences((prev) => ({
                                ...prev,
                                [role.role]: (options[0]?.value as string) || "",
                              }))
                            }
                          >
                            <DropdownSection name={`audience-${role.role}`}>
                              {AUDIENCE_CONDITIONS.map((condition) => (
                                <DropdownOption key={condition.value} value={condition.value}>
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
                        id="access-reason-category"
                        onChange={(options) =>
                          setReasonCategory((options[0]?.value as string) || "")
                        }
                      >
                        <DropdownSection name="reason-category">
                          {RESTRICTION_REASONS.map((reason) => (
                            <DropdownOption key={reason.value} value={reason.value}>
                              {reason.label}
                            </DropdownOption>
                          ))}
                        </DropdownSection>
                      </InputSelect>

                      {reasonCategory === "other" && (
                        <InputText
                          label="Especifique o motivo da restrição"
                          placeholder="Descreva o motivo"
                          id="access-reason-text"
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
                    id="api-auth-tool"
                    value={authRequestUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAuthRequestUrl(e.target.value)
                    }
                  />
                  <InputText
                    label="Link para a documentação comercial da API"
                    placeholder="Insira o URL aqui"
                    id="api-doc-commercial"
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
                    id="api-rate-limit"
                    value={rateLimiting}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRateLimiting(e.target.value)
                    }
                  />
                  <InputText
                    label="Link para a documentação sobre limites de chamadas"
                    placeholder="https://..."
                    id="api-rate-limit-url"
                    value={rateLimitingUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRateLimitingUrl(e.target.value)
                    }
                  />
                </div>

                <div className="admin-page__actions">
                  <Button
                    variant="primary"
                    hasIcon
                    trailingIcon="agora-line-arrow-right-circle"
                    trailingIconHover="agora-solid-arrow-right-circle"
                    onClick={handleStep1Next}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "A criar..." : "Seguinte"}
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* Step 2: Vinculação de conjuntos de dados */}
          {currentStep === 2 && (
            <>
              <StatusCard
                variant="informative"
                showIcon
                description="É importante vincular todos os conjuntos de dados utilizados, pois isso ajuda a compreender as referências cruzadas necessárias e a melhorar a visibilidade da sua reutilização."
              />

              <form className="admin-page__form">
                <InputSelect
                  label="Pesquisar um conjunto de dados"
                  placeholder="Selecione conjuntos de dados..."
                  id="dataset-search"
                  type="checkbox"
                  searchable
                  searchInputPlaceholder="Escreva para pesquisar em todos os conjuntos de dados..."
                  searchNoResultsText="Nenhum resultado encontrado"
                  onSearchInputChange={setDatasetSearch}
                  onChange={(options) => {
                    const selectedIds = options.map((o) => String(o.value));
                    setDropdownDatasets(
                      availableDatasets.filter((d) => selectedIds.includes(d.id))
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
                  <div className="mt-16 grid grid-cols-1 gap-32 sm:grid-cols-2">
                    {selectedDatasets.map((dataset) => {
                      const cardProps = {
                        ...dataset,
                        last_modified: formatDateToTimeAgo(dataset.last_modified),
                        link: `/pages/datasets/${dataset.slug}`,
                      } as CardMetricsProps;
                      return (
                        <div key={dataset.id} className="relative h-full">
                          <CardMetrics {...cardProps} />
                          <button
                            type="button"
                            title="Remover"
                            aria-label={`Remover ${dataset.title}`}
                            className="rounded group absolute right-8 top-8 z-10 p-4"
                            onClick={(e: React.MouseEvent) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeDataset(dataset.id);
                            }}
                          >
                            <Icon
                              name="agora-line-trash"
                              className="block h-[18px] w-[18px] !fill-[var(--color-danger-600)] group-hover:hidden"
                            />
                            <Icon
                              name="agora-solid-trash"
                              className="hidden h-[18px] w-[18px] !fill-[var(--color-danger-600)] group-hover:block"
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="admin-page__divider-or">
                  <span className="admin-page__divider-or-text">ou</span>
                </div>

                <div className="flex flex-col gap-8">
                  <InputText
                    label="Link para o conjunto de dados"
                    placeholder="https://..."
                    id="dataset-link-url"
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
                      Adicionar
                    </Button>
                  </div>
                </div>

                <div className="admin-page__actions">
                  <Button
                    appearance="outline"
                    variant="neutral"
                    hasIcon
                    leadingIcon="agora-line-arrow-left-circle"
                    leadingIconHover="agora-solid-arrow-left-circle"
                    onClick={onPreviousStep}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="primary"
                    hasIcon
                    trailingIcon="agora-line-arrow-right-circle"
                    trailingIconHover="agora-solid-arrow-right-circle"
                    onClick={handleStep2Next}
                    disabled={isLinkingDatasets}
                  >
                    {isLinkingDatasets ? "A vincular..." : "Seguinte"}
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* Step 3: Finalizar a publicação */}
          {currentStep === 3 && (
            <>
              <StatusCard
                variant="success"
                showIcon
                description={
                  <>
                    <strong>A sua API foi criada!</strong>
                    <br />
                    Agora pode publicar ou guardar como rascunho.
                  </>
                }
              />

              <div className="agora-card-links-admin-px0">
                <div className="mb-8">
                  {createdDataservice?.archived_at ? (
                    <Pill variant="neutral">ARQUIVADO</Pill>
                  ) : (
                    (createdDataservice?.private ?? true) && (
                      <Pill variant="warning">RASCUNHO</Pill>
                    )
                  )}
                </div>
                <CardLinks
                  onClick={() => {}}
                  className="cursor-pointer text-neutral-900"
                  variant="transparent"
                  image={{
                    src:
                      createdDataservice?.organization?.logo ||
                      "/images/placeholders/organization.png",
                    alt: createdDataservice?.title || apiName || "Sem título",
                  }}
                  category={createdDataservice?.organization?.name || "API"}
                  title={
                    <div className="underline text-xl-bold">
                      {createdDataservice?.title || apiName || "Sem título"}
                    </div>
                  }
                  description={
                    <p className="text-sm line-clamp-3 leading-relaxed text-neutral-900 mt-8 max-w-[592px]">
                      {createdDataservice?.description || apiDescription || ""}
                    </p>
                  }
                  date={
                    <span className="font-[300]">
                      {`Atualizado há ${formatDateToTimeAgo(
                        createdDataservice?.last_modified ||
                          createdDataservice?.created_at ||
                          ""
                      )}`}
                    </span>
                  }
                  links={[
                    {
                      href: "#",
                      hasIcon: true,
                      leadingIcon: "agora-line-eye",
                      leadingIconHover: "agora-solid-eye",
                      trailingIcon: "",
                      trailingIconHover: "",
                      trailingIconActive: "",
                      children: createdDataservice?.metrics?.views?.toLocaleString("pt-PT") || "0",
                      title: "Visualizações",
                      onClick: (e: React.MouseEvent) => e.preventDefault(),
                      className: "text-[#034AD8]",
                    },
                    {
                      href: "#",
                      hasIcon: true,
                      leadingIcon: "agora-line-layers-menu",
                      leadingIconHover: "agora-solid-layers-menu",
                      trailingIcon: "",
                      trailingIconHover: "",
                      trailingIconActive: "",
                      children: `${createdDataservice?.datasets?.length || 0} datasets`,
                      title: "Datasets",
                      onClick: (e: React.MouseEvent) => e.preventDefault(),
                      className: "text-[#034AD8]",
                    },
                    {
                      href: "#",
                      hasIcon: true,
                      leadingIcon: "agora-line-star",
                      leadingIconHover: "agora-solid-star",
                      trailingIcon: "",
                      trailingIconHover: "",
                      trailingIconActive: "",
                      children: createdDataservice?.metrics?.followers || 0,
                      title: "Favoritos",
                      onClick: (e: React.MouseEvent) => e.preventDefault(),
                      className: "text-[#034AD8]",
                    },
                  ]}
                  mainLink={
                    createdDataservice ? (
                      <Link href={`/pages/dataservices/${createdDataservice.slug}`}>
                        <span className="underline">
                          {createdDataservice.title || apiName}
                        </span>
                      </Link>
                    ) : (
                      <span className="underline">{apiName || "Sem título"}</span>
                    )
                  }
                  blockedLink={true}
                />
              </div>

              <PublicationFeedbackButton />

              {apiError && (
                <div className="mt-16">
                  <StatusCard variant="danger" showIcon description={apiError} />
                </div>
              )}

              <div className="admin-page__actions flex justify-end gap-[18px]">
                <Button
                  appearance="outline"
                  variant="neutral"
                  onClick={handleSaveDraft}
                  disabled={isPublishing}
                >
                  Salvar rascunho
                </Button>
                <Button variant="primary" onClick={handlePublish} disabled={isPublishing}>
                  {isPublishing ? "A publicar..." : "Publicar API"}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Right: Auxiliar sidebar (only for step 1) */}
        {currentStep === 1 && (
          <aside className="admin-page__auxiliar">
            <div className="admin-page__auxiliar-inner">
              <div className="admin-page__auxiliar-header">
                <AppIcon
                  name="agora-line-question-mark"
                  className="w-24 h-24"
                />
                <h2 className="admin-page__auxiliar-title">Auxiliar</h2>
              </div>
              <AuxiliarList items={auxiliarItems} />
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
