"use client";

import { useSearchParams, useRouter, useParams, usePathname } from "next/navigation";
import ReusesFormClient from "@/components/admin/reuses/ReusesFormClient";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import { AdminStepper } from "../AdminStepper";
import AdminLayout from "@/components/Layout/AdminLayout";

export default function OrgReusesNewClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const orgId = params?.orgId as string | undefined;
  const { user } = useAuth();
  const orgName = useViewedOrganizationName(orgId, user?.organizations);
  const totalSteps = 3;
  const currentStep = Number(searchParams.get("step")) || 1;

  const stepTitles: Record<number, string> = {
    1: "Descreva a sua reutilização",
    2: "Conectar conjuntos de dados e APIs",
    3: "Finalizar a publicação",
  };

  return (
    <AdminLayout breadcrumbItems={[
      { label: "Administração", url: "/admin" },
      { label: orgName || "Organização", url: "#" },
      { label: "Reutilizações", url: orgId ? `/admin/org/${orgId}/reuses` : "#" }
    ]}
      title="Formulário de reutilização"
    >

      {/* Stepper */}
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
