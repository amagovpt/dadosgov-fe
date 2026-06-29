"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ApiRegistrationClient from "@/components/admin/dataservices/views/ApiRegistrationClient";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import AdminLayout from "@/components/Layout/AdminLayout";
import { AdminStepper } from "@/components/admin/AdminStepper";

export default function ApiNewClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { displayName } = useCurrentUser();
  const totalSteps = 3;
  const currentStep = Number(searchParams.get("step")) || 1;
  const stepTitles: Record<number, string> = {
    1: "Descreva a sua API",
    2: "Vincular conjuntos de dados",
    3: "Finalizar a publicação",
  };

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: "Administração", url: "/admin" },
        { label: displayName || "...", url: "#" },
        { label: "API", url: "/admin/dataservices" },
      ]}
      title="Formulário de inscrição"
    >
      <AdminStepper
        currentStep={currentStep}
        totalSteps={totalSteps}
        stepTitle={stepTitles[currentStep]}
      />

      <ApiRegistrationClient
        currentStep={currentStep}
        onNextStep={() =>
          router.push(`/admin/dataservices/new?step=${currentStep + 1}`)
        }
        onPreviousStep={() =>
          router.push(`/admin/dataservices/new?step=${currentStep - 1}`)
        }
      />
    </AdminLayout>
  );
}
