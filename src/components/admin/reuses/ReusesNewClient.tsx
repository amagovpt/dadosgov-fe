"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import ReusesFormClient from "@/components/admin/reuses/ReusesFormClient";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { AdminStepper } from "../AdminStepper";
import AdminLayout from "@/components/Layout/AdminLayout";

export default function ReusesNewClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { displayName } = useCurrentUser();
  const totalSteps = 3;
  const currentStep = Number(searchParams.get("step")) || 1;

  const stepTitles: Record<number, string> = {
    1: "Descreva a sua reutilização",
    2: "Associe os conjuntos de dados",
    3: "Finalize a publicação da sua reutilização",
  };

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: "Administração", url: "/admin" },
        { label: displayName || "...", url: "#" },
        { label: "Reutilizações", url: "/admin/me/reuses" },
      ]}
      title="Formulário de publicação de uma reutilização"
    >
      <AdminStepper
        currentStep={currentStep}
        totalSteps={totalSteps}
        labelWord="Passo"
        labelFormat="slash"
        stepTitle={stepTitles[currentStep] || ""}
      />

      <ReusesFormClient
        currentStep={currentStep}
        onNextStep={() => router.push(`${pathname}?step=${currentStep + 1}`)}
        onPreviousStep={() => router.push(`${pathname}?step=${currentStep - 1}`)}
      />
    </AdminLayout>
  );
}
