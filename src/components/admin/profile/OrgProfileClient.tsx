"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, StatusCard, usePopupContext } from "@ama-pt/agora-design-system";
import AdminLayout from "@/components/Layout/AdminLayout";
import {
  deleteOrganization,
  fetchOrgBadges,
  fetchOrganization,
  updateOrganization,
  uploadOrgLogo,
} from "@/service/api/organizations";
import { type OrgBadges, type Organization } from "@/service/types/identity";
import { POISONED_FILE_WARNING } from "@/lib/security/translateUploadError";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useOrganizationName } from "@/hooks/useOrganizationName";
import { useAuth } from "@/context/AuthContext";
import { useFormErrors } from "@/hooks/forms/useFormErrors";
import AdminEmptyState from "../AdminEmptyState";
import OrganizationProfileHeaderCard from "@/components/admin/profile/OrganizationProfileHeaderCard";
import OrganizationProfileFormSection from "@/components/admin/profile/OrganizationProfileFormSection";
import OrganizationDangerZone from "@/components/admin/profile/OrganizationDangerZone";

function badgeKindsFromOrg(badges: Organization["badges"] | undefined): string[] {
  return (badges ?? [])
    .map((badge) => (typeof badge === "string" ? badge : badge.kind))
    .filter((kind): kind is string => Boolean(kind));
}

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
  const [name, setName] = useState("");
  const [acronym, setAcronym] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [availableBadges, setAvailableBadges] = useState<OrgBadges>({});
  const [selectedBadgeKinds, setSelectedBadgeKinds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { hasError, setError, clearError, resetErrors, focusFirstError } = useFormErrors();

  useEffect(() => {
    if (!orgId) {
      return;
    }

    const currentOrgId = orgId;

    async function loadOrganization() {
      try {
        const data = await fetchOrganization(currentOrgId);
        if (data) {
          setOrg(data);
          setName(data.name);
          setAcronym(data.acronym || "");
          setDescription(data.description || "");
          setUrl(data.url || "");
          setSelectedBadgeKinds(badgeKindsFromOrg(data.badges));
        }
      } catch (error) {
        console.error("Error loading org profile:", error);
      }
    }

    void loadOrganization();
  }, [orgId]);

  useEffect(() => {
    fetchOrgBadges().then(setAvailableBadges);
  }, []);

  useEffect(() => {
    if (!saveStatus) return;
    const timer = setTimeout(() => setSaveStatus(null), 5000);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  const canEdit = useMemo(
    () =>
      isAdmin ||
      (org?.members?.some((member) => member.user.id === user?.id && member.role === "admin") ??
        false),
    [isAdmin, org, user],
  );

  function handleBadgeToggle(kind: string, checked: boolean) {
    setSelectedBadgeKinds((previousKinds) =>
      checked
        ? previousKinds.includes(kind)
          ? previousKinds
          : [...previousKinds, kind]
        : previousKinds.filter((currentKind) => currentKind !== kind),
    );
  }

  const handleSave = async () => {
    if (!org) return;

    const hasNameError = !name.trim();
    const hasDescriptionError = !description.trim();
    if (hasNameError) setError("name");
    if (hasDescriptionError) setError("description");

    if (hasNameError || hasDescriptionError) {
      focusFirstError();
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    resetErrors();
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const updated = await updateOrganization(org.id, {
        name,
        acronym: acronym || null,
        description,
        url: url || null,
        badges: selectedBadgeKinds.map((kind) => ({ kind })),
      });
      setOrg(updated);
      setSelectedBadgeKinds(badgeKindsFromOrg(updated.badges));
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

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
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
      const serverMessage = (error as { data?: { message?: string } })?.data?.message;
      setLogoError(serverMessage || "Erro ao carregar o logotipo. Por favor, tente novamente.");
    }
  };

  if (!isOrgLoading && !orgId) {
    return (
      <AdminEmptyState
        icon="agora-line-user-buildings"
        title="Sem organizações"
        description="Não pertence a nenhuma organização."
      />
    );
  }

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: org?.name || cachedOrgName || "Organização", url: "#" },
        { label: "Perfil" },
      ]}
      title="Perfil da organização"
      headerAction={null}
    >
      {org && <OrganizationProfileHeaderCard organization={org} logoPreview={logoPreview} />}

      <div className="admin-page__body mt-32">
        <div className="admin-page__form-area">
          <OrganizationProfileFormSection
            name={name}
            acronym={acronym}
            description={description}
            url={url}
            availableBadges={availableBadges}
            selectedBadgeKinds={selectedBadgeKinds}
            canEdit={canEdit}
            isSaving={isSaving}
            nameError={hasError("name")}
            descriptionError={hasError("description")}
            logoError={logoError}
            saveStatus={saveStatus}
            onNameChange={(event) => {
              setName(event.target.value);
              if (event.target.value.trim()) clearError("name");
            }}
            onAcronymChange={(event) => setAcronym(event.target.value)}
            onDescriptionChange={(event) => {
              setDescription(event.target.value);
              if (event.target.value.trim()) clearError("description");
            }}
            onUrlChange={(event) => setUrl(event.target.value)}
            onBadgeToggle={handleBadgeToggle}
            onLogoUpload={handleLogoUpload}
            onLogoSecurityError={() => setLogoError(POISONED_FILE_WARNING)}
            onSave={() => {
              void handleSave();
            }}
          />

          <OrganizationDangerZone
            canDelete={
              isAdmin ||
              (org?.members?.some((member) => member.user.id === user?.id && member.role === "admin") ??
                false)
            }
            isDeleting={isDeleting}
            deleteError={deleteError}
            onDeleteClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              show(<DeleteOrgPopupContent onClose={hide} onConfirm={handleDeleteOrg} />, {
                title: "Tem a certeza que quer eliminar esta organização?",
                closeAriaLabel: "Fechar",
                dimensions: "m",
              });
            }}
          />
        </div>

        <aside className="admin-page__auxiliar" />
      </div>
    </AdminLayout>
  );
}
