"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button, usePopupContext } from "@ama-pt/agora-design-system";
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
import { can } from "@/utils/permissions";
import { useOrganizationName } from "@/hooks/useOrganizationName";
import { useAuth } from "@/context/AuthContext";
import { useFormErrors } from "@/hooks/forms/useFormErrors";
import { useTemporaryMessage } from "@/hooks/forms/useTemporaryMessage";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import OrganizationProfileHeaderCard from "@/components/admin/profile/organization/OrganizationProfileHeaderCard";
import OrganizationProfileFormSection from "@/components/admin/profile/organization/OrganizationProfileFormSection";
import OrganizationDangerZone from "@/components/admin/profile/organization/OrganizationDangerZone";
import type { BoOrganizationsPage } from "@/service/types/admin/organizations";

function badgeKindsFromOrg(badges: Organization["badges"] | undefined): string[] {
  return (badges ?? [])
    .map((badge) => (typeof badge === "string" ? badge : badge.kind))
    .filter((kind): kind is string => Boolean(kind));
}

function DeleteOrgPopupContent({
  labels,
  onClose,
  onConfirm,
}: {
  labels: {
    description: string;
    cancel: string;
    delete: string;
  };
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col gap-16">
      <p>{labels.description}</p>
      <div className="flex justify-end gap-16 pt-16">
        <Button appearance="outline" variant="neutral" onClick={onClose}>
          {labels.cancel}
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          hasIcon
          leadingIcon="agora-line-trash"
          leadingIconHover="agora-solid-trash"
        >
          {labels.delete}
        </Button>
      </div>
    </div>
  );
}

export default function OrgProfileClient({ pageContent }: { pageContent: BoOrganizationsPage }) {
  const { t } = useTranslation(["admin-common", "admin-profile"]);
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
  const {
    message: saveStatus,
    setMessage: setSaveStatus,
    setTemporaryMessage: showSaveStatus,
  } = useTemporaryMessage<"success" | "error" | null>(null, 5000);
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

  // Authorization is decided by the backend (single source of truth):
  // editing/deleting an organization requires EditOrganizationPermission
  // (org admin or sysadmin) - editors cannot. `org` is fetched with the
  // session, so org.permissions reflects this user.
  const canEdit = can(org, "edit");
  const canDelete = can(org, "delete");

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
        ...(isAdmin ? { badges: selectedBadgeKinds.map((kind) => ({ kind })) } : {}),
      });
      setOrg(updated);
      setSelectedBadgeKinds(badgeKindsFromOrg(updated.badges));
      showSaveStatus("success");
    } catch (error) {
      console.error("Error updating org profile:", error);
      showSaveStatus("error");
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
      router.push("/admin/me/profile");
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
      setLogoError(t("admin-profile:organization.logoMaxSize"));
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
      setLogoError(serverMessage || t("admin-profile:organization.logoUploadError"));
    }
  };

  if (!isOrgLoading && !orgId) {
    return <AdminEmptyState noResults={pageContent.orgProfileNoResults} />;
  }

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        {
          label: org?.name || cachedOrgName || t("admin-profile:organization.organizationFallback"),
          url: "#",
        },
        { label: t("admin-profile:breadcrumbs.profile") },
      ]}
      title={pageContent.orgProfileHero?.title ?? ""}
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
            availableBadges={isAdmin ? availableBadges : {}}
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
            canDelete={canDelete}
            isDeleting={isDeleting}
            deleteError={deleteError}
            deleteCard={pageContent.orgProfileDeleteCard}
            onDeleteClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              show(
                <DeleteOrgPopupContent
                  labels={{
                    description: t("admin-profile:organization.deletePopupDescription"),
                    cancel: t("admin-common:actions.cancel"),
                    delete: t("admin-common:actions.delete"),
                  }}
                  onClose={hide}
                  onConfirm={handleDeleteOrg}
                />,
                {
                  title: t("admin-profile:organization.deletePopupTitle"),
                  closeAriaLabel: t("admin-common:deleteAccount.closeAriaLabel"),
                  dimensions: "m",
                }
              );
            }}
          />
        </div>

        <aside className="admin-page__auxiliar" />
      </div>
    </AdminLayout>
  );
}
