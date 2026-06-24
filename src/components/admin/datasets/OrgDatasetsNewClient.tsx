"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import {
  Button,
  CardAction,
  StatusCard,
} from "@ama-pt/agora-design-system";
import DatasetsAdminClient from "@/components/admin/datasetsadmin/DatasetsAdminClient";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import { AdminStepper } from "../AdminStepper";
import AdminLayout from "@/components/Layout/AdminLayout";

export default function OrgDatasetsNewClient() {
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

  const orgBase = activeOrg ? `/admin/org/${activeOrg.id}` : "/admin/org";

  const buildStepUrl = (step: number) => {
    return `/admin/org/datasets/new?step=${step}`;
  };


  const stepTitles: Record<number, string> = {
    1: "Inicie a publicação do seu conjunto de dados",
    2: "Descreva o seu conjunto de dados",
    3: "Adicione os ficheiros",
    4: "Finalize a publicação do seu conjunto de dados",
  };

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: "Administração", url: "/admin" },
        { label: orgName || "Organização", url: "#" },
        { label: "Conjuntos de dados", url: resolvedOrgId ? `/admin/org/${resolvedOrgId}/datasets` : "#" },
      ]}

      title="Formulário de publicação de um conjunto de dados"
    >
      <>
        {/* Stepper */}
        <AdminStepper
          currentStep={currentStep}
          totalSteps={totalSteps}
          labelWord="Passo"
          labelFormat="slash"
          stepTitle={stepTitles[currentStep] || ""}
        />

        {currentStep === 1 && (
          <>
            <h2 className="admin-page__section-title mb-16">Tipo de publicação</h2>

            <StatusCard
              variant="informative"
              showIcon
              description="Se desejar realizar testes, utilize demo.dados.gov.pt"
            />

          <div className="admin-new-page__cards mb-32" style={{ maxWidth: "50%" }}>
            <CardAction
              variant="neutral-100"
              titleText="Publique um conjunto de dados"
              descriptionText="Seja uma entidade da administração pública ou uma empresa pública, todos podem publicar em dados.gov.pt!"
              icon={{ name: "agora-line-edit" }}
              button={{
                children: "Comece a publicação",
                variant: "primary",
                appearance: "outline",
                onClick: () => router.push(buildStepUrl(2)),
              }}
            />
          </div>

          {/* Admin sections */}
          <div className="admin-new-page__admin-sections">
            <div className="admin-new-page__admin-section">
              <p className="text-primary-900 text-base font-bold leading-7">
                É administrador e deseja automatizar a publicação dos seus dados?
              </p>
              <p className="text-neutral-700 text-sm leading-relaxed">
                Pode automatizar a publicação através da API ou ligando o seu portal ao dados.gov.pt
                através de um harvester de dados.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Button
                  appearance="link"
                  variant="primary"
                  hasIcon
                  trailingIcon="agora-line-external-link"
                  trailingIconHover="agora-solid-external-link"
                  onClick={() => router.push("/recursos/desenvolvimento/referencia-api")}
                >
                  Consulte a documentação da API
                </Button>
                <Button
                  appearance="link"
                  variant="primary"
                  hasIcon
                  trailingIcon="agora-line-external-link"
                  trailingIconHover="agora-solid-external-link"
                  onClick={() => router.push("/recursos/como-usar-o-portal/como-reutilizar-dados")}
                >
                  Saiba mais sobre o harvester.
                </Button>
                <Button
                  appearance="link"
                  variant="primary"
                  hasIcon
                  trailingIcon="agora-line-external-link"
                  trailingIconHover="agora-solid-external-link"
                  onClick={() => router.push("/ajuda-e-contactos")}
                >
                  Contacte-nos
                </Button>
              </div>
            </div>

            <div className="admin-new-page__admin-section">
              <p className="text-primary-900 text-base font-bold leading-7">
                É administrador e deseja catalogar os seus dados?
              </p>
              <p className="text-neutral-700 text-sm leading-relaxed">
                Pode utilizar o serviço de catalogação e publicação do dados.gov.pt, que permite aos
                organismos da Administração Pública Central organizarem e disponibilizarem o seu
                catálogo de dados abertos.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Button
                  appearance="link"
                  variant="primary"
                  hasIcon
                  trailingIcon="agora-line-external-link"
                  trailingIconHover="agora-solid-external-link"
                >
                  Aceda à área de catálogo.
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

        {currentStep >= 2 && (
          <DatasetsAdminClient
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
