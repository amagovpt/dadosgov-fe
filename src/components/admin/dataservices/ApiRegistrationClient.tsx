"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  InputText,
  InputTextArea,
  RadioButton,
  Icon,
  StatusCard,
  Accordion,
  AccordionGroup,
  InputSelect,
  DropdownSection,
  DropdownOption,
  CardGeneral,
  Tag,
} from "@ama-pt/agora-design-system";
import { createDataservice, updateDataservice } from "@/service/api/dataservices";
import { fetchMyDatasets } from "@/service/api/datasets";
import { fetchOrgDatasets } from "@/service/api/organizations";
import { searchDatasets } from "@/service/api/search";
import type { Dataservice } from "@/service/types/dataservice";
import type { Dataset } from "@/service/types/dataset";
import AuxiliarList from "@/components/admin/AuxiliarList";
import PublicationFeedbackButton from "@/components/admin/PublicationFeedbackButton";
import { useAuth } from "@/context/AuthContext";
import AppIcon from "@/components/Primitives/AppIcon";

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
  const [availability, setAvailability] = useState("");
  const [authRequestUrl, setAuthRequestUrl] = useState("");
  const [businessDocUrl, setBusinessDocUrl] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdDataservice, setCreatedDataservice] = useState<Dataservice | null>(null);
  const [datasetLinks, setDatasetLinks] = useState([{ url: "" }]);
  const [datasetLinkErrors, setDatasetLinkErrors] = useState<Record<number, string>>({});
  // Producer identity: "user" (publish in my own name) or an organization id.
  // The Agora InputSelect reports the selected value into this ref's `.current`.
  const producerRef = useRef("user");
  // Step 2: link internal datasets to the created API.
  const [myDatasets, setMyDatasets] = useState<Dataset[]>([]);
  const [selectedDatasets, setSelectedDatasets] = useState<Dataset[]>([]);
  const [datasetSearch, setDatasetSearch] = useState("");
  const [datasetSearchResults, setDatasetSearchResults] = useState<Dataset[]>([]);
  const [isLinkingDatasets, setIsLinkingDatasets] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    setDatasetLinkErrors({});
  }, [currentStep]);

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

  const availableDatasets = (() => {
    const combined: Dataset[] = [...selectedDatasets, ...datasetSearchResults, ...myDatasets];
    const seen = new Set<string>();
    return combined.filter((d) => {
      if (seen.has(d.id) || d.archived || d.deleted) return false;
      seen.add(d.id);
      return true;
    });
  })();

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
        availability: availability.trim() ? parseFloat(availability) : undefined,
        access_type: accessType,
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
  // flips it public; saving keeps it as a draft. Both then return to the list.
  const handlePublish = async () => {
    if (!createdDataservice) return;
    setIsPublishing(true);
    setApiError(null);
    try {
      await updateDataservice(createdDataservice.id, { private: false });
      window.location.href = "/pages/admin/me/dataservices";
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

  const handleDatasetUrlChange = (index: number, value: string) => {
    const updated = [...datasetLinks];
    updated[index] = { url: value };
    setDatasetLinks(updated);

    if (value.trim() && datasetLinkErrors[index]) {
      setDatasetLinkErrors((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const addDatasetLink = () => {
    const lastIndex = datasetLinks.length - 1;
    if (!datasetLinks[lastIndex].url.trim()) {
      setDatasetLinkErrors((prev) => ({
        ...prev,
        [lastIndex]: "Campo obrigatório",
      }));
      return;
    }
    setDatasetLinks((prev) => [...prev, { url: "" }]);
  };

  const removeDatasetLink = (index: number) => {
    setDatasetLinks((prev) => prev.filter((_, i) => i !== index));
    setDatasetLinkErrors((prev) => {
      const next: Record<number, string> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const k = Number(key);
        if (k < index) next[k] = value;
        else if (k > index) next[k - 1] = value;
      });
      return next;
    });
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
                    label="Limite de chamadas"
                    placeholder="Insira aqui"
                    id="api-rate-limit"
                    value={rateLimiting}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRateLimiting(e.target.value)
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
                        checked={accessType === "account"}
                        onChange={() => setAccessType("account")}
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
                    setSelectedDatasets(
                      availableDatasets.filter((d) => selectedIds.includes(d.id))
                    );
                  }}
                >
                  <DropdownSection name="datasets">
                    {availableDatasets.map((dataset) => (
                      <DropdownOption
                        key={dataset.id}
                        value={dataset.id}
                        selected={selectedDatasets.some((s) => s.id === dataset.id)}
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
                        onClick={() =>
                          setSelectedDatasets((prev) =>
                            prev.filter((d) => d.id !== dataset.id)
                          )
                        }
                      >
                        {dataset.title}
                      </Tag>
                    ))}
                  </div>
                )}

                <div className="admin-page__divider-or">
                  <span className="admin-page__divider-or-text">ou</span>
                </div>

                {datasetLinks.map((link, index) => (
                  <div key={index} className="mt-16">
                    <div>
                      <InputText
                        label="Link para o conjunto de dados"
                        placeholder="Insira o URL aqui"
                        id={`dataset-url-${index}`}
                        value={link.url}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleDatasetUrlChange(index, e.target.value)
                        }
                        hasError={!!datasetLinkErrors[index]}
                        hasFeedback={!!datasetLinkErrors[index]}
                        feedbackState="danger"
                        errorFeedbackText={datasetLinkErrors[index]}
                      />
                      {link.url.trim() && (
                        <div className="flex justify-end mt-8">
                          <Button
                            appearance="link"
                            variant="danger"
                            hasIcon
                            leadingIcon="agora-line-trash"
                            leadingIconHover="agora-solid-trash"
                            onClick={() => removeDatasetLink(index)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="flex justify-end">
                  <Button
                    appearance="outline"
                    variant="primary"
                    hasIcon
                    leadingIcon="agora-line-plus-circle"
                    leadingIconHover="agora-solid-plus-circle"
                    onClick={addDatasetLink}
                  >
                    Adicionar
                  </Button>
                </div>

                <div className="admin-page__actions">
                  <Button
                    appearance="outline"
                    variant="neutral"
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

              <CardGeneral
                variant="white-outline"
                isCardHorizontal
                isBlockedLink
                iconDefault="agora-line-layers-menu"
                iconHover="agora-solid-layers-menu"
                titleText={createdDataservice?.title || apiName || "Sem título"}
                descriptionText={
                  createdDataservice?.description || apiDescription || "Sem descrição"
                }
                anchor={{
                  href: createdDataservice
                    ? `/pages/dataservices/${createdDataservice.id}`
                    : "#",
                  children: "",
                }}
              />

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
