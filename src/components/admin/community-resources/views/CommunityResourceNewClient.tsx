"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@ama-pt/agora-design-system";
import CommunityResourceFormClient from "@/components/admin/community-resources/views/CommunityResourceFormClient";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import AdminLayout from "@/components/Layout/AdminLayout";
import { AdminStepper } from "@/components/admin/AdminStepper";
import type { BoCommunityResourcesPage } from "@/service/types/admin/community-resources";

interface CommunityResourceNewClientProps {
  pageContent: BoCommunityResourcesPage;
}

export default function CommunityResourceNewClient({
  pageContent,
}: CommunityResourceNewClientProps) {
  const { t } = useTranslation(["admin-common", "admin-community-resources"]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { displayName } = useCurrentUser();
  const datasetId = searchParams.get("dataset_id") || "";
  const totalSteps = 2;
  const currentStep = Number(searchParams.get("step")) || 1;
  const [publicPageUrl, setPublicPageUrl] = useState<string | null>(null);
  const pageTitle = pageContent.hero?.title ?? "";

  const stepTitles: Record<number, string> = {
    1: t("admin-community-resources:form.steps.describe"),
    2: t("admin-community-resources:form.steps.publish"),
  };

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        { label: displayName || "...", url: "#" },
        {
          label: t("admin-community-resources:title"),
          url: "/admin/me/community-resources",
        },
      ]}
      title={pageTitle}
    >
      {currentStep === 2 && publicPageUrl && (
        <div className="flex justify-end mb-16">
          <Button
            appearance="outline"
            variant="primary"
            hasIcon
            leadingIcon="agora-line-eye"
            leadingIconHover="agora-solid-eye"
            onClick={() => router.push(publicPageUrl)}
          >
            {t("admin-community-resources:form.viewPublicPage")}
          </Button>
        </div>
      )}

      <AdminStepper
        currentStep={currentStep}
        totalSteps={totalSteps}
        stepTitle={stepTitles[currentStep]}
        labelWord="Etapa"
        labelFormat="de"
      />

      <CommunityResourceFormClient
        datasetId={datasetId}
        currentStep={currentStep}
        onPublicPageReady={(url) => setPublicPageUrl(url)}
        onNextStep={() =>
          router.push(
            `/admin/community-resources/new?dataset_id=${datasetId}&step=${currentStep + 1}`
          )
        }
        onPreviousStep={() =>
          router.push(
            `/admin/community-resources/new?dataset_id=${datasetId}&step=${currentStep - 1}`
          )
        }
        pageContent={pageContent}
      />
    </AdminLayout>
  );
}
