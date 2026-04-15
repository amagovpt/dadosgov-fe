"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Breadcrumb,
  Button,
  DropdownSection,
  DropdownOption,
  InputText,
  InputTextArea,
  InputSelect,
  ButtonUploader,
  Icon,
  StatusCard,
  Accordion,
  AccordionGroup,
} from "@ama-pt/agora-design-system";
import { suggestOrganizations, createOrganization, uploadOrgLogo } from "@/services/api";
import type { OrganizationSuggestion } from "@/types/api";
import PublishDropdown from "@/components/admin/PublishDropdown";
import AuxiliarList from "@/components/admin/AuxiliarList";

export default function OrganizationsNewClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const totalSteps = 3;
  const currentStep = Number(searchParams.get("step")) || 1;
  const totalSegments = 12;
  const filledSegments = Math.round((currentStep / totalSteps) * totalSegments);

  const [orgName, setOrgName] = useState("");
  const [orgAcronym, setOrgAcronym] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");
  const [orgLogo, setOrgLogo] = useState<File | null>(null);
  const [orgLogoPreview, setOrgLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [orgSuggestions, setOrgSuggestions] = useState<OrganizationSuggestion[]>([]);
  const [orgSearchQuery, setOrgSearchQuery] = useState("");

  useEffect(() => {
    suggestOrganizations("", 20).then(setOrgSuggestions);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      suggestOrganizations(orgSearchQuery, 20).then(setOrgSuggestions);
    }, 300);
    return () => clearTimeout(timer);
  }, [orgSearchQuery]);

  const clearError = (field: string) => {
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleCreateOrg = async () => {
    const errors: Record<string, boolean> = {};
    if (!orgName.trim()) errors.orgName = true;
    if (!orgDescription.trim()) errors.orgDescription = true;
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setIsSubmitting(true);
    try {
      const org = await createOrganization({
        name: orgName.trim(),
        acronym: orgAcronym.trim() || undefined,
        description: orgDescription.trim(),
        url: orgWebsite.trim() || undefined,
      });
      if (orgLogo) {
        await uploadOrgLogo(org.id, orgLogo);
      }
      router.push(`/pages/organizations/${org.slug}`);
    } catch (error) {
      const err = error as { status?: number; data?: unknown };
      console.error("Erro ao criar organização:", err.status, JSON.stringify(err.data));
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitles: Record<number, string> = {
    1: "Crie ou integre uma organização em dados.gov.pt",
    2: "Descreva a sua organização",
    3: "Finalize sua organização",
  };

  const auxiliarItems = [
    {
      title: "Dar um nome à sua organização",
      content: "Nome público da sua organização.",
      hasError: !!formErrors.orgName,
    },
    {
      title: "Adicionar uma sigla",
      content: "A sigla da sua organização, se houver.",
    },
    /* {
      title: "Por que fornecer um número SIRET?",
      content: (
        <>
          <p>
            Um número SIRET nos permitirá atribuir um tipo à sua organização
            (agências governamentais, autoridades locais, empresas, etc.) e
            facilitará sua certificação. O número deve ter 14 dígitos.
          </p>
          <p className="mt-2">
            Observe que todas as agências governamentais possuem um número SIRET.
          </p>
          <p className="mt-2">
            Pode encontrar o seu número SIRET no{" "}
            <a href="#" className="text-primary-600 underline">
              Diretório Comercial.
            </a>
          </p>
        </>
      ),
    }, */
    {
      title: "Descrever a organização",
      content:
        "Descreva de forma clara a atividade e missão da sua organização. Inclua também informações de contacto essenciais, como e‑mail, morada ou redes sociais. Estas informações ajudam os utilizadores a compreender o papel da sua organização e a contactá‑la facilmente, sempre que necessário.",
      hasError: !!formErrors.orgDescription,
    },
    {
      title: "Adicionar o site",
      content: "Se a sua organização possui um site, inclua o endereço URL.",
    },
    {
      title: "Escolher o logotipo",
      content:
        'Se a sua organização tiver um logótipo ou imagem de perfil, adicione-o. Para carregar o ficheiro, clique em "Selecione ou arraste o ficheiro" São aceites os seguintes formatos de imagem: JPG, JPEG e PNG.',
    },
  ];

  const orgOptions = orgSuggestions.map((org) => (
    <DropdownOption key={org.id} value={org.id}>
      {org.name}
    </DropdownOption>
  ));

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: "Organizações", url: "/pages/admin/system/organizations" },
            {
              label: "Formulário de registo de uma organização",
              url: "/pages/admin/organizations/new",
            },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">Formulário de registo de uma organização</h1>
        <PublishDropdown />
      </div>

      {/* Step indicator */}
      <div className="admin-page__step-header">
        <p className="admin-page__step-text">
          <span className="text-primary-600 font-bold">Passo {currentStep} - </span>
          <span className="text-primary-900 font-bold">{stepTitles[currentStep]}</span>
        </p>
      </div>

      {/* Progress bar */}
      <div className="admin-page__stepper">
        <div className="admin-page__stepper-bar">
          <div className="admin-page__stepper-mark admin-page__stepper-mark--start" />
          {Array.from({ length: totalSegments }).map((_, i) => (
            <div
              key={i}
              className={`admin-page__stepper-segment ${
                i < filledSegments ? "admin-page__stepper-segment--filled" : ""
              }`}
            />
          ))}
          <div className="admin-page__stepper-mark admin-page__stepper-mark--end" />
        </div>
        <span className="admin-page__stepper-label">
          Passo {currentStep}/{totalSteps}
        </span>
      </div>

      {/* Main content area */}
      <div className="admin-page__body">
        <div className="admin-page__form-area">
          {/* Step 1: Ingressar ou criar */}
          {currentStep === 1 && (
            <div className="admin-page__form">
              <StatusCard
                type="info"
                description={
                  <>
                    <strong>Inscreva-se numa organização</strong>
                    <br />
                    Uma organização é uma entidade na qual os utilizadores podem colaborar.
                    Conjuntos de dados publicados dentro de uma organização podem ser editados pelos
                    seus membros.
                  </>
                }
              />

              <div>
                <InputSelect
                  label="Organização"
                  placeholder="Pesquisar uma organização em dados.gov.pt..."
                  id="search-organization"
                  searchable
                  searchInputPlaceholder="Escreva para pesquisar..."
                  searchNoResultsText="Nenhum resultado encontrado"
                  onSearchInputChange={(value: string) => setOrgSearchQuery(value)}
                  onChange={(options: { value?: string }[]) => {
                    const selectedId = options?.[0]?.value;
                    if (selectedId) {
                      const org = orgSuggestions.find((o) => o.id === selectedId);
                      if (org) {
                        router.push(`/pages/organizations/${org.slug}`);
                      }
                    }
                  }}
                >
                  <DropdownSection name="organizations">{orgOptions}</DropdownSection>
                </InputSelect>

                <div className="admin-page__divider-or">
                  <span className="admin-page__divider-or-text">ou</span>
                </div>

                <div className="flex justify-center mt-[16px]">
                  <Button
                    variant="primary"
                    onClick={() => router.push("/pages/admin/organizations/new?step=2")}
                  >
                    Criar uma organização
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Descreva a sua organização */}
          {currentStep === 2 && (
            <>
              <StatusCard
                type="info"
                description={
                  <>
                    <strong>O que é uma organização?</strong>
                    <br />
                    Uma organização é uma entidade na qual muitos utilizadores podem colaborar.
                    Conjuntos de dados publicados sob a égide da organização podem ser editados
                    pelos seus membros.
                  </>
                }
              />

              <form className="admin-page__form">
                <p className="text-neutral-900 text-base leading-7 pt-32">
                  Os campos marcados com um asterisco ( * ) são obrigatórios.
                </p>

                <h2 className="admin-page__section-title">Descrição</h2>

                <div className="admin-page__fields-group">
                  <InputText
                    label="Nome *"
                    placeholder="Insira o nome aqui"
                    id="org-name"
                    value={orgName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setOrgName(e.target.value);
                      if (e.target.value.trim()) clearError("orgName");
                    }}
                    hasError={!!formErrors.orgName}
                    hasFeedback={!!formErrors.orgName}
                    feedbackState="danger"
                    errorFeedbackText="Campo obrigatório"
                  />

                  <InputText
                    label="Sigla"
                    placeholder="Insira a sigla aqui"
                    id="org-acronym"
                    value={orgAcronym}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setOrgAcronym(e.target.value)
                    }
                  />

                  <InputTextArea
                    label="Descrição *"
                    placeholder="Insira a descrição aqui"
                    id="org-description"
                    rows={6}
                    value={orgDescription}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      setOrgDescription(e.target.value);
                      if (e.target.value.trim()) clearError("orgDescription");
                    }}
                    hasError={!!formErrors.orgDescription}
                    hasFeedback={!!formErrors.orgDescription}
                    feedbackState="danger"
                    errorFeedbackText="Campo obrigatório"
                  />

                  <InputText
                    label="Website"
                    placeholder="Insira o URL aqui"
                    id="org-website"
                    value={orgWebsite}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setOrgWebsite(e.target.value)
                    }
                  />
                </div>

                <h2 className="admin-page__section-title">Logotipo</h2>

                <div className="admin-page__fields-group">
                  <ButtonUploader
                    label="Ficheiro"
                    inputLabel="Selecione ou arraste o ficheiro"
                    removeFileButtonLabel="Remover ficheiro"
                    replaceFileButtonLabel="Substituir ficheiro"
                    extensionsInstructions="Tamanho máximo: 4 MB. Formatos aceites: JPG, JPEG, PNG."
                    accept=".jpg,.jpeg,.png"
                    maxSize={4194304}
                    maxCount={1}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files?.[0] || null;
                      setOrgLogo(file);
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setOrgLogoPreview(url);
                      } else {
                        setOrgLogoPreview(null);
                      }
                    }}
                  />
                  {orgLogoPreview && (
                    <div className="mt-[12px]">
                      <p className="text-sm text-neutral-600 mb-[8px]">Pré-visualização:</p>
                      <img
                        src={orgLogoPreview}
                        alt="Pré-visualização do logotipo"
                        className="max-h-[120px] max-w-[240px] object-contain border border-neutral-200 rounded-[8px] p-[8px]"
                      />
                    </div>
                  )}
                </div>

                <div className="admin-page__actions">
                  <Button
                    appearance="outline"
                    variant="neutral"
                    onClick={() => router.push("/pages/admin/organizations/new?step=1")}
                  >
                    Anterior
                  </Button>
                  <Button variant="primary" onClick={handleCreateOrg} disabled={isSubmitting}>
                    Criar a organização
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* Step 3: Finalizar */}
          {currentStep === 3 && (
            <div className="admin-page__form">
              <StatusCard
                type="success"
                description={
                  <>
                    <strong>A sua organização foi criada!</strong>
                    <br />
                    Agora pode gerir a sua organização.
                  </>
                }
              />

              <div className="admin-page__actions">
                <Button
                  appearance="outline"
                  variant="neutral"
                  onClick={() => router.push("/pages/admin/organizations/new?step=2")}
                >
                  Anterior
                </Button>
                <Button
                  variant="primary"
                  hasIcon
                  trailingIcon="agora-line-check-circle"
                  trailingIconHover="agora-solid-check-circle"
                  onClick={() =>
                    router.push("/pages/admin/system/organizations")
                  }
                >
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Auxiliar sidebar (only for step 2) */}
        {currentStep === 2 && (
          <aside className="admin-page__auxiliar">
            <div className="admin-page__auxiliar-inner">
              <div className="admin-page__auxiliar-header">
                <Icon name="agora-line-question-mark" className="w-[24px] h-[24px]" />
                <h2 className="admin-page__auxiliar-title">Auxiliar</h2>
              </div>
              <AuxiliarList items={auxiliarItems} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
