"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button, CardAction, StatusCard } from "@ama-pt/agora-design-system";
import DatasetsAdminClient from "@/components/admin/datasets/publication-wizard/DatasetsAdminClient";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import { AdminStepper } from "@/components/admin/AdminStepper";
import AdminLayout from "@/components/Layout/AdminLayout";
import type { BoDatasetsPage } from "@/service/types/admin/datasets";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";

interface OrgDatasetsNewClientProps {
  pageContent: BoDatasetsPage;
}

export default function OrgDatasetsNewClient({ pageContent }: OrgDatasetsNewClientProps) {
  const { t } = useTranslation(["admin-common", "admin-datasets"]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const routeParams = useParams();
  const routeOrgId = routeParams?.orgId as string | undefined;
  const { activeOrg } = useActiveOrganization();
  const resolvedOrgId = routeOrgId || activeOrg?.id;
  const { user } = useAuth();
  const orgName = useViewedOrganizationName(resolvedOrgId, user?.organizations);
  const totalSteps = 4;
  const currentStep = Number(searchParams.get("step")) || 1;
  const [createdDatasetId, setCreatedDatasetId] = useState<string | null>(null);
  const pageTitle = pageContent.hero?.title ?? "";

  const orgBase = activeOrg ? `/admin/org/${activeOrg.id}` : "/admin/org";

  const buildStepUrl = (step: number) => {
    return `/admin/org/datasets/new?step=${step}`;
  };

  const stepTitles: Record<number, string> = {
    1: t("admin-datasets:form.steps.start"),
    2: t("admin-datasets:form.steps.describe"),
    3: t("admin-datasets:form.steps.files"),
    4: t("admin-datasets:form.steps.publish"),
  };
  const [startEntry, adminAutomationEntry, catalogEntry] = pageContent.publicationEntry ?? [];

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: orgName || t("admin-common:breadcrumbs.organization"), url: "#" },
        {
          label: t("admin-datasets:form.breadcrumbs.datasets"),
          url: resolvedOrgId ? `/admin/org/${resolvedOrgId}/datasets` : "#",
        },
      ]}
      title={pageTitle}
    >
      <>
        {/* Stepper */}
        <AdminStepper
          currentStep={currentStep}
          totalSteps={totalSteps}
          labelWord={t("admin-common:stepper.step")}
          labelFormat="slash"
          stepTitle={stepTitles[currentStep] || ""}
        />

        {currentStep === 1 && (
          <>
            <h2 className="admin-page__section-title mb-16">
              {t("admin-datasets:form.publicationTypeTitle")}
            </h2>

            <StatusCard
              variant="informative"
              showIcon
              description={t("admin-datasets:form.demoInfo")}
            />

            {startEntry ? (
              <div className="admin-new-page__cards mb-32" style={{ maxWidth: "50%" }}>
                <CardAction
                  variant="neutral-100"
                  titleText={startEntry.title}
                  descriptionText={stripHtmlTags(startEntry.description)}
                  icon={{ name: "agora-line-edit" }}
                  button={{
                    children: startEntry.anchor?.children || "",
                    variant: "primary",
                    appearance: "outline",
                    onClick: () => router.push(buildStepUrl(2)),
                  }}
                />
              </div>
            ) : null}

            {/* Admin sections */}
            <div className="admin-new-page__admin-sections">
              {adminAutomationEntry ? (
              <div className="admin-new-page__admin-section">
                <p className="text-primary-900 text-base font-bold leading-7">
                  {adminAutomationEntry.title}
                </p>
                <div className="text-neutral-700 text-sm leading-relaxed">
                  {formatHtmlParagraphs(adminAutomationEntry.description)}
                </div>
                <div className="flex gap-4 flex-wrap">
                  <Button
                    appearance="link"
                    variant="primary"
                    hasIcon
                    trailingIcon="agora-line-external-link"
                    trailingIconHover="agora-solid-external-link"
                    onClick={() => router.push("/recursos/desenvolvimento/referencia-api")}
                  >
                    {t("admin-datasets:form.apiDocsAction")}
                  </Button>
                  <Button
                    appearance="link"
                    variant="primary"
                    hasIcon
                    trailingIcon="agora-line-external-link"
                    trailingIconHover="agora-solid-external-link"
                    onClick={() => router.push("/recursos/como-usar-o-portal/como-reutilizar-dados")}
                  >
                    {t("admin-datasets:form.harvesterAction")}
                  </Button>
                  <Button
                    appearance="link"
                    variant="primary"
                    hasIcon
                    trailingIcon="agora-line-external-link"
                    trailingIconHover="agora-solid-external-link"
                    onClick={() => router.push("/ajuda-e-contactos")}
                  >
                    {t("admin-datasets:form.contactAction")}
                  </Button>
                </div>
              </div>
              ) : null}

              {catalogEntry ? (
              <div className="admin-new-page__admin-section">
                <p className="text-primary-900 text-base font-bold leading-7">
                  {catalogEntry.title}
                </p>
                <div className="text-neutral-700 text-sm leading-relaxed">
                  {formatHtmlParagraphs(catalogEntry.description)}
                </div>
                <div className="flex gap-4 flex-wrap">
                  <Button
                    appearance="link"
                    variant="primary"
                    hasIcon
                    trailingIcon="agora-line-external-link"
                    trailingIconHover="agora-solid-external-link"
                  >
                    {t("admin-datasets:form.catalogAction")}
                  </Button>
                </div>
              </div>
              ) : null}
            </div>
          </>
        )}

        {currentStep >= 2 && (
          <DatasetsAdminClient
            pageContent={pageContent}
            currentStep={currentStep}
            datasetId={createdDatasetId}
            onNextStep={() => router.push(buildStepUrl(currentStep + 1))}
            onPreviousStep={() => router.push(buildStepUrl(currentStep - 1))}
            onDatasetCreated={(id) => {
              setCreatedDatasetId(id);
              router.push(buildStepUrl(currentStep + 1));
            }}
            onComplete={() => router.push(`${orgBase}/datasets`)}
          />
        )}
      </>
    </AdminLayout>
  );
}
