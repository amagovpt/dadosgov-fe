"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { StatusCard } from "@ama-pt/agora-design-system";
import { suggestOrganizations, createOrganization, uploadOrgLogo } from "@/service/api/organizations";
import type { OrganizationSuggestion } from "@/service/types/identity";
import { POISONED_FILE_WARNING } from "@/lib/security/translateUploadError";
import AdminLayout from "@/components/Layout/AdminLayout";
import { AdminStepper } from "@/components/admin/AdminStepper";
import AdminAuxiliarySidebar from "@/components/admin/AdminAuxiliarySidebar";
import { useFormErrors } from "@/hooks/forms/useFormErrors";
import { normalizeApiError } from "@/service/utils/normalizeApiError";
import OrganizationSelectionStep from "@/components/admin/organizations/OrganizationSelectionStep";
import OrganizationDetailsStep from "@/components/admin/organizations/OrganizationDetailsStep";
import OrganizationSuccessStep from "@/components/admin/organizations/OrganizationSuccessStep";
import { getOrganizationAuxiliaryItems } from "@/components/admin/organizations/organizationAuxiliaryContent";
import type { BoOrganizationsPage } from "@/service/types/admin/organizations";

interface OrganizationsNewClientProps {
  pageContent: BoOrganizationsPage;
}

export default function OrganizationsNewClient({ pageContent }: OrganizationsNewClientProps) {
  const { t } = useTranslation(["admin-common", "admin-organizations"]);
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
  const [orgLogoError, setOrgLogoError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [orgSuggestions, setOrgSuggestions] = useState<OrganizationSuggestion[]>([]);
  const [orgSearchQuery, setOrgSearchQuery] = useState("");
  const {
    hasError,
    getErrorMessage,
    setErrors,
    clearError,
    resetErrors,
    focusFirstError,
  } = useFormErrors<"orgName" | "orgDescription">();

  useEffect(() => {
    suggestOrganizations("", 20).then(setOrgSuggestions);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      suggestOrganizations(orgSearchQuery, 20).then(setOrgSuggestions);
    }, 300);

    return () => clearTimeout(timer);
  }, [orgSearchQuery]);

  async function handleCreateOrg() {
    const errors: Partial<Record<"orgName" | "orgDescription", string>> = {};
    if (!orgName.trim()) {
      errors.orgName = t("admin-organizations:form.nameRequired");
    }
    if (!orgDescription.trim()) {
      errors.orgDescription = t("admin-organizations:form.descriptionRequired");
    }

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      focusFirstError();
      return;
    }

    resetErrors();
    setApiError(null);
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

      router.push(`/organizations/${organization.slug}`);
    } catch (error) {
      setApiError(
        normalizeApiError(error, t("admin-organizations:form.createError")).message
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOrganizationLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    if (file && file.size > 4194304) {
      setOrgLogoError(t("admin-organizations:form.fileTooLarge"));
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
      router.push(`/organizations/${organization.slug}`);
    }
  }

  const stepTitles: Record<number, string> = {
    1: t("admin-organizations:form.steps.select"),
    2: t("admin-organizations:form.steps.describe"),
    3: t("admin-organizations:form.steps.finish"),
  };

  const auxiliaryItems = getOrganizationAuxiliaryItems({
    hasNameError: hasError("orgName"),
    hasDescriptionError: hasError("orgDescription"),
    items: pageContent.createAuxiliaryItems,
  });

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: t("admin-organizations:title"), url: "/admin/system/organizations" },
        {
          label: t("admin-organizations:form.registrationTitle"),
          url: "/admin/organizations/new",
        },
      ]}
      title={t("admin-organizations:form.registrationTitle")}
    >
      <AdminStepper
        currentStep={currentStep}
        totalSteps={totalSteps}
        labelWord={t("admin-common:stepper.step")}
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
              onCreateOrganization={() => router.push("/admin/organizations/new?step=2")}
              introduction={pageContent.selectionIntroduction}
            />
          )}

          {currentStep === 2 && (
            <>
              {apiError && <StatusCard variant="danger" showIcon description={apiError} />}
              <OrganizationDetailsStep
                orgName={orgName}
                orgAcronym={orgAcronym}
                orgDescription={orgDescription}
                orgWebsite={orgWebsite}
                orgLogoError={orgLogoError}
                orgLogoPreview={orgLogoPreview}
                isSubmitting={isSubmitting}
                hasNameError={hasError("orgName")}
                hasDescriptionError={hasError("orgDescription")}
                nameErrorMessage={getErrorMessage("orgName")}
                descriptionErrorMessage={getErrorMessage("orgDescription")}
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
                onPrevious={() => router.push("/admin/organizations/new?step=1")}
                onSubmit={() => {
                  void handleCreateOrg();
                }}
                introduction={pageContent.detailsIntroduction}
              />
            </>
          )}

          {currentStep === 3 && (
            <OrganizationSuccessStep
              onPrevious={() => router.push("/admin/organizations/new?step=2")}
              onFinish={() => router.push("/admin/system/organizations")}
              createdCard={pageContent.createdCard}
            />
          )}
        </div>

        {currentStep === 2 && auxiliaryItems.length > 0 ? (
          <AdminAuxiliarySidebar items={auxiliaryItems} />
        ) : null}
      </div>
    </AdminLayout>
  );
}
