"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@ama-pt/agora-design-system";
import CommunityResourceFormClient from "@/components/admin/community-resources/views/CommunityResourceFormClient";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import AdminLayout from "@/components/Layout/AdminLayout";
import { AdminStepper } from "@/components/admin/AdminStepper";

export default function CommunityResourceNewClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { displayName } = useCurrentUser();
  const datasetId = searchParams.get("dataset_id") || "";
  const totalSteps = 2;
  const currentStep = Number(searchParams.get("step")) || 1;
  const [publicPageUrl, setPublicPageUrl] = useState<string | null>(null);

  const stepTitles: Record<number, string> = {
    1: "Descreva o recurso da sua comunidade.",
    2: "Finalizar a publicação",
  };

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: "Administração", url: "/admin" },
        { label: displayName || "...", url: "#" },
        { label: "Recursos comunitários", url: "/admin/me/community-resources" },
      ]}
      title="Formulário de inscrição"
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
            Veja a página pública
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
      />
    </AdminLayout>
  );
}
