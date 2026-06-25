"use client";

import React from "react";
import { Button, CardGeneral, StatusCard } from "@ama-pt/agora-design-system";
import PublicationFeedbackButton from "@/components/admin/PublicationFeedbackButton";
import type { Dataservice } from "@/service/types/dataservice";

interface ApiRegistrationPublishStepProps {
  createdDataservice: Dataservice | null;
  apiName: string;
  apiDescription: string;
}

export default function ApiRegistrationPublishStep({
  createdDataservice,
  apiName,
  apiDescription,
}: ApiRegistrationPublishStepProps) {
  return (
    <>
      <StatusCard
        variant="success"
        showIcon
        description={
          <>
            <strong>A sua API foi criada!</strong>
            <br />
            Agora pode publicar ou guardar como rascunho.
          </>
        }
      />

      <CardGeneral
        variant="white-outline"
        isCardHorizontal
        isBlockedLink
        iconDefault="agora-line-layers-menu"
        iconHover="agora-solid-layers-menu"
        titleText={createdDataservice?.title || apiName || "Sem título"}
        descriptionText={createdDataservice?.description || apiDescription || "Sem descrição"}
        anchor={{
          href: createdDataservice ? `/pages/dataservices/${createdDataservice.id}` : "#",
          children: "",
        }}
      />

      <PublicationFeedbackButton />

      <div className="admin-page__actions flex justify-end gap-[18px]">
        <Button appearance="outline" variant="neutral">
          Salvar rascunho
        </Button>
        <Button variant="primary">Publicar API</Button>
      </div>
    </>
  );
}
