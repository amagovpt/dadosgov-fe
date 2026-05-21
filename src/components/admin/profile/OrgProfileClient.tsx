"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Avatar,
  Breadcrumb,
  Button,
  CardNoResults,
  Icon,
  InputText,
  InputTextArea,
  StatusCard,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import DragAndDropUploader from "@/components/Primitives/DragAndDropUploader/DragAndDropUploader";
import { fetchOrganization, updateOrganization, uploadOrgLogo, deleteOrganization } from "@/app/api/organizations";
import type { Organization } from '@/service/types/identity';
import { POISONED_FILE_WARNING } from "@/lib/security/translateUploadError";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useOrganizationName } from "@/hooks/useOrganizationName";
import { useAuth } from "@/context/AuthContext";

function DeleteOrgPopupContent({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col gap-16">
      <p>Esta ação é irreversível.</p>
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

export default function OrgProfileClient() {
  const params = useParams();
  const router = useRouter();
  const { show, hide } = usePopupContext();
  const routeOrgId = params?.orgId as string | undefined;
  const { activeOrg, isLoading: isOrgLoading } = useActiveOrganization();
  const { user, isAdmin } = useAuth();

  const orgId = routeOrgId || activeOrg?.id;
  const cachedOrgName = useOrganizationName(orgId, user?.organizations);

  const [org, setOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [acronym, setAcronym] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [descriptionError, setDescriptionError] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) {
      setIsLoading(false);
      return;
    }
    async function loadOrg() {
      setIsLoading(true);
      try {
        const data = await fetchOrganization(orgId!);
        if (data) {
          setOrg(data);
          setName(data.name);
          setAcronym(data.acronym || "");
          setDescription(data.description || "");
          setUrl(data.url || "");
        }
      } catch (error) {
        console.error("Error loading org profile:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrg();
  }, [orgId]);

  useEffect(() => {
    if (!saveStatus) return;
    const timer = setTimeout(() => setSaveStatus(null), 5000);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  const handleSave = async () => {
    if (!org) return;
    const hasNameError = !name.trim();
    const hasDescriptionError = !description.trim();
    if (hasNameError) setNameError(true);
    if (hasDescriptionError) setDescriptionError(true);
    if (hasNameError || hasDescriptionError) {
      requestAnimationFrame(() => {
        document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setNameError(false);
    setDescriptionError(false);
    setIsSaving(true);
    setSaveStatus(null);
    try {
      await updateOrganization(org.id, {
        name,
        acronym: acronym || null,
        description,
        url: url || null,
      });
      setSaveStatus("success");
    } catch (error) {
      console.error("Error updating org profile:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOrg = async () => {
    if (!org) return;
    setIsDeleting(true);
    setDeleteError(false);
    try {
      await deleteOrganization(org.id);
      hide();
      router.push("/pages/admin/me/profile");
    } catch (error) {
      console.error("Error deleting organization:", error);
      hide();
      setDeleteError(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!org || !files || files.length === 0) return;
    const file = files[0];
    if (file.size > 512000) {
      setLogoError("O ficheiro excede o tamanho máximo de 500 KB.");
      return;
    }
    setLogoError(null);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    const localPreview = URL.createObjectURL(file);
    setLogoPreview(localPreview);
    try {
      await uploadOrgLogo(org.id, file);
    } catch (error) {
      console.error("Error uploading org logo:", error);
      URL.revokeObjectURL(localPreview);
      setLogoPreview(null);
      const serverMsg = (error as { data?: { message?: string } })?.data?.message;
      setLogoError(serverMsg || "Erro ao carregar o logotipo. Por favor, tente novamente.");
    }
  };

  if (!isOrgLoading && !orgId) {
    return (
      <div className="admin-page">
        <CardNoResults
          className="datasets-page__empty"
          position="center"
          icon={
            <Icon name="agora-line-buildings" className="w-12 h-12 text-primary-500 icon-xl" />
          }
          title="Sem organizações"
          description="Não pertence a nenhuma organização."
          hasAnchor={false}
        />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: org?.name || cachedOrgName || "Organização", url: "#" },
            { label: "Perfil", url: "#" },
          ]}
        />
      </div>

      <h1 className="admin-page__title mt-64 mb-32">
        Perfil da organização
      </h1>

      {org && (
        <div className="profile-card">
          <div className="profile-card__avatar-container">
            {(logoPreview || org.logo_thumbnail) ? (
              <img
                src={logoPreview ?? org.logo_thumbnail!}
                alt={org.name}
                className="profile-card__avatar-img"
              />
            ) : (
              <Avatar
                avatarType="initials"
                srcPath={(org.name?.charAt(0).toUpperCase() || "O") as unknown as undefined}
                alt={org.name}
                className="profile-card__avatar"
              />
            )}
          </div>

          <div className="profile-card__body">
            <div className="profile-card__info">
              <p className="text-neutral-900 text-xl font-semibold leading-8">
                {org.name}
              </p>
              {org.acronym && (
                <p className="text-neutral-900 text-base font-light leading-7">
                  {org.acronym}
                </p>
              )}
              <div className="flex items-center gap-16 text-neutral-900 text-sm">
                <span className="flex items-center gap-4">
                  <Icon name="agora-line-user-group" className="w-16 h-16" />
                  {org.metrics.members} membros
                </span>
                <span className="flex items-center gap-4">
                  <Icon name="agora-line-layers-menu" className="w-16 h-16" />
                  {org.metrics.datasets} conjuntos de dados
                </span>
                <span className="flex items-center gap-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="text-primary-500">
                    <path d="M4 22.9091V15.2727C4 14.6702 4.47969 14.1818 5.07143 14.1818C5.66316 14.1818 6.14286 14.6702 6.14286 15.2727V22.9091C6.14286 23.5116 5.66316 24 5.07143 24C4.47969 24 4 23.5116 4 22.9091ZM10.4286 22.9091V1.09091C10.4286 0.488417 10.9083 0 11.5 0C12.0917 0 12.5714 0.488417 12.5714 1.09091V22.9091C12.5714 23.5116 12.0917 24 11.5 24C10.9083 24 10.4286 23.5116 10.4286 22.9091ZM16.8571 22.9091V9.81818C16.8571 9.21569 17.3368 8.72727 17.9286 8.72727C18.5203 8.72727 19 9.21569 19 9.81818V22.9091C19 23.5116 18.5203 24 17.9286 24C17.3368 24 16.8571 23.5116 16.8571 22.9091Z" fill="currentColor" />
                  </svg>
                  {org.metrics.reuses} reutilizações
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="admin-page__body mt-32">
        <div className="admin-page__form-area">
          <div className="admin-page__form">
            <h2 className="admin-page__section-title hidden">EDITAR ORGANIZAÇÃO</h2>

            <div className="admin-page__fields-group pt-32">
              {saveStatus && (
                <StatusCard
                  variant={saveStatus === "success" ? "success" : "danger"}
                  showIcon
                  description={
                    saveStatus === "success"
                      ? "Perfil da organização atualizado com sucesso."
                      : "Ocorreu um erro ao guardar. Por favor, tente novamente."
                  }
                />
              )}

              <InputText
                label="Nome *"
                placeholder="Insira o nome aqui"
                id="org-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (e.target.value.trim()) setNameError(false);
                }}
                hasError={nameError}
                hasFeedback={nameError}
                feedbackState="danger"
                errorFeedbackText="Campo obrigatório"
              />

              <InputText
                label="Sigla"
                placeholder="Insira a sigla aqui"
                id="org-acronym"
                value={acronym}
                onChange={(e) => setAcronym(e.target.value)}
              />

              <InputTextArea
                label="Descrição *"
                placeholder="Insira a descrição aqui"
                id="org-description"
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (e.target.value.trim()) setDescriptionError(false);
                }}
                hasError={descriptionError}
                hasFeedback={descriptionError}
                feedbackState="danger"
                errorFeedbackText="Campo obrigatório"
              />

              <InputText
                label="Website"
                placeholder="Insira o URL aqui"
                id="org-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />

              <div>
                <span className="text-primary-900 text-base font-medium leading-7">
                  Logotipo
                </span>
                <div className="mt-2 [&_.instructions]:items-center [&_.instructions]:text-center [&_.drag-and-drop-area_.agora-btn]:w-fit">
                  <DragAndDropUploader
                    label="Ficheiro"
                    dragAndDropLabel="Arraste e largue o ficheiro aqui"
                    inputLabel="Selecione ou arraste o ficheiro"
                    selectedFilesLabel="ficheiro selecionado"
                    removeFileButtonLabel="Remover ficheiro"
                    replaceFileButtonLabel="Substituir ficheiro"
                    extensionsInstructions="Tamanho máximo: 500 KB. Formatos aceites: JPG, JPEG, PNG."
                    accept=".jpg,.jpeg,.png"
                    maxSize={512000}
                    maxCount={1}
                    maxSizeExceededErrorLabel="O ficheiro excede o tamanho máximo de 500 KB."
                    forbiddenExtensionErrorLabel="Formato de ficheiro não permitido."
                    hasError={!!logoError}
                    hasFeedback={!!logoError}
                    feedbackState="danger"
                    feedbackText={logoError ?? undefined}
                    onChange={handleLogoUpload}
                    onSecurityError={() => setLogoError(POISONED_FILE_WARNING)}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-16">
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

              {(isAdmin || org?.members?.some((m) => m.user.id === user?.id && m.role === "admin")) && (
                <div className="dataset-edit-danger-actions">
                  {deleteError && (
                    <StatusCard
                      variant="danger"
                      showIcon
                      description="Ocorreu um erro ao eliminar a organização. Por favor, tente novamente."
                    />
                  )}
                  <StatusCard
                    variant="danger"
                    showIcon
                    description={
                      <>
                        <strong>Atenção Esta ação é irreversível.</strong>
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
                              <DeleteOrgPopupContent
                                onClose={hide}
                                onConfirm={handleDeleteOrg}
                              />,
                              {
                                title: "Tem a certeza que quer eliminar esta organização?",
                                closeAriaLabel: "Fechar",
                                dimensions: "m",
                              },
                            );
                          }}
                          disabled={isDeleting}
                        >
                          Eliminar a organização
                        </Button>
                      </>
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="admin-page__auxiliar" />
      </div>
    </div>
  );
}
