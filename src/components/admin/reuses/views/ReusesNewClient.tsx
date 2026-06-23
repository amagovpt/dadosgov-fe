"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import ReusesFormClient from "@/components/admin/reuses/views/ReusesFormClient";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { AdminStepper } from "@/components/admin/AdminStepper";
import AdminLayout from "@/components/Layout/AdminLayout";

export default function ReusesNewClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { displayName } = useCurrentUser();
  const totalSteps = 3;
  const currentStep = Number(searchParams.get("step")) || 1;

  const stepTitles: Record<number, string> = {
    1: "Descreva a sua reutilizaÃƒÂ§ÃƒÂ£o",
    2: "Associe os conjuntos de dados",
    3: "Finalize a publicaÃƒÂ§ÃƒÂ£o da sua reutilizaÃƒÂ§ÃƒÂ£o",
  };

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: "AdministraÃƒÂ§ÃƒÂ£o", url: "/pages/admin" },
        { label: displayName || "...", url: "#" },
        { label: "ReutilizaÃƒÂ§ÃƒÂµes", url: "/pages/admin/me/reuses" },
      ]}
      title="FormulÃƒÂ¡rio de publicaÃƒÂ§ÃƒÂ£o de uma reutilizaÃƒÂ§ÃƒÂ£o"
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
