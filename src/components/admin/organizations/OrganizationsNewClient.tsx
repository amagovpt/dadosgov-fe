"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { suggestOrganizations, createOrganization, uploadOrgLogo } from "@/service/api/organizations";
import type { OrganizationSuggestion } from "@/service/types/identity";
import { POISONED_FILE_WARNING } from "@/lib/security/translateUploadError";
import AdminLayout from "@/components/Layout/AdminLayout";
import { AdminStepper } from "@/components/admin/AdminStepper";
import AdminAuxiliarySidebar from "@/components/admin/AdminAuxiliarySidebar";
import OrganizationSelectionStep from "@/components/admin/organizations/OrganizationSelectionStep";
import OrganizationDetailsStep from "@/components/admin/organizations/OrganizationDetailsStep";
import OrganizationSuccessStep from "@/components/admin/organizations/OrganizationSuccessStep";
import { getOrganizationAuxiliaryItems } from "@/components/admin/organizations/organizationAuxiliaryContent";

export default function OrganizationsNewClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const totalSteps = 3;
  const currentStep = Number(searchParams.get("step")) || 1;

  const [orgName, setOrgName] = useState("");
  const [orgAcronym, setOrgAcronym] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");
  const [orgLogo, setOrgLogo] = useState<File | null>(null);
  const [orgLogoPreview, setOrgLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [orgLogoError, setOrgLogoError] = useState<string | null>(null);
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

  function clearError(field: string) {
    if (formErrors[field]) {
      setFormErrors((previousErrors) => {
        const nextErrors = { ...previousErrors };
        delete nextErrors[field];
        return nextErrors;
      });
    }
  }

  async function handleCreateOrg() {
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
      const organization = await createOrganization({
        name: orgName.trim(),
        acronym: orgAcronym.trim() || undefined,
        description: orgDescription.trim(),
        url: orgWebsite.trim() || undefined,
      });

      if (orgLogo) {
        await uploadOrgLogo(organization.id, orgLogo);
      }

      router.push(`/pages/organizations/${organization.slug}`);
    } catch (error) {
      const normalizedError = error as { status?: number; data?: unknown };
      console.error(
        "Erro ao criar organização:",
        normalizedError.status,
        JSON.stringify(normalizedError.data),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOrganizationLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    if (file && file.size > 4194304) {
      setOrgLogoError("O ficheiro excede o tamanho máximo de 4 MB.");
      setOrgLogo(null);
      setOrgLogoPreview(null);
      return;
    }

    setOrgLogoError(null);
    setOrgLogo(file);
    setOrgLogoPreview(file ? URL.createObjectURL(file) : null);
  }

  function handleSelectSuggestedOrganization(organizationId: string) {
    const organization = orgSuggestions.find((item) => item.id === organizationId);
    if (organization) {
      router.push(`/pages/organizations/${organization.slug}`);
    }
  }

  const stepTitles: Record<number, string> = {
    1: "Crie ou integre uma organização em dados.gov.pt",
    2: "Descreva a sua organização",
    3: "Finalize sua organização",
  };

  const auxiliaryItems = getOrganizationAuxiliaryItems({
    hasNameError: !!formErrors.orgName,
    hasDescriptionError: !!formErrors.orgDescription,
  });

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: "Organizações", url: "/pages/admin/system/organizations" },
        {
          label: "Formulário de registo de uma organização",
          url: "/pages/admin/organizations/new",
        },
      ]}
      title="Formulário de registo de uma organização"
    >
      <AdminStepper
        currentStep={currentStep}
        totalSteps={totalSteps}
        labelWord="Passo"
        labelFormat="slash"
        stepTitle={stepTitles[currentStep] || ""}
      />

      <div className="admin-page__body">
        <div className="admin-page__form-area">
          {currentStep === 1 && (
            <OrganizationSelectionStep
              orgSuggestions={orgSuggestions}
              onSearchChange={setOrgSearchQuery}
              onSelectOrganization={handleSelectSuggestedOrganization}
              onCreateOrganization={() => router.push("/pages/admin/organizations/new?step=2")}
            />
          )}

          {currentStep === 2 && (
            <OrganizationDetailsStep
              orgName={orgName}
              orgAcronym={orgAcronym}
              orgDescription={orgDescription}
              orgWebsite={orgWebsite}
              orgLogoError={orgLogoError}
              orgLogoPreview={orgLogoPreview}
              isSubmitting={isSubmitting}
              hasNameError={!!formErrors.orgName}
              hasDescriptionError={!!formErrors.orgDescription}
              onNameChange={(event) => {
                setOrgName(event.target.value);
                if (event.target.value.trim()) {
                  clearError("orgName");
                }
              }}
              onAcronymChange={(event) => setOrgAcronym(event.target.value)}
              onDescriptionChange={(event) => {
                setOrgDescription(event.target.value);
                if (event.target.value.trim()) {
                  clearError("orgDescription");
                }
              }}
              onWebsiteChange={(event) => setOrgWebsite(event.target.value)}
              onLogoChange={handleOrganizationLogoChange}
              onLogoSecurityError={() => setOrgLogoError(POISONED_FILE_WARNING)}
              onPrevious={() => router.push("/pages/admin/organizations/new?step=1")}
              onSubmit={() => {
                void handleCreateOrg();
              }}
            />
          )}

          {currentStep === 3 && (
            <OrganizationSuccessStep
              onPrevious={() => router.push("/pages/admin/organizations/new?step=2")}
              onFinish={() => router.push("/pages/admin/system/organizations")}
            />
          )}
        </div>

        {currentStep === 2 && <AdminAuxiliarySidebar items={auxiliaryItems} />}
      </div>
    </AdminLayout>
  );
}
