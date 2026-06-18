"use client";

import React from "react";
import { Button, StatusCard } from "@ama-pt/agora-design-system";

interface PostsEditDangerZoneProps {
  isPublished: boolean;
  isSaving: boolean;
  onUnpublish: () => void;
  onRepublish: () => void;
  onOpenDeletePopup: () => void;
}

export default function PostsEditDangerZone({
  isPublished,
  isSaving,
  onUnpublish,
  onRepublish,
  onOpenDeletePopup,
}: PostsEditDangerZoneProps) {
  return (
    <div className="dataset-edit-danger-actions">
      {isPublished ? (
        <StatusCard
          variant="warning"
          showIcon
          description={
            <>
              <strong>Retirar o artigo</strong>
              <br />
              Por favor, note que o item não será mais visível.
              <br />
              <Button
                appearance="link"
                variant="primary"
                hasIcon
                trailingIcon="agora-line-arrow-right-circle"
                trailingIconHover="agora-solid-arrow-right-circle"
                onClick={onUnpublish}
                disabled={isSaving}
              >
                {isSaving ? "A retirar..." : "Retirar"}
              </Button>
            </>
          }
        />
      ) : (
        <StatusCard
          variant="informative"
          showIcon
          description={
            <>
              <strong>Artigo despublicado</strong>
              <br />
              Este artigo não está visível para o público.
              <br />
              <Button
                appearance="link"
                variant="primary"
                hasIcon
                trailingIcon="agora-line-arrow-right-circle"
                trailingIconHover="agora-solid-arrow-right-circle"
                onClick={onRepublish}
                disabled={isSaving}
              >
                {isSaving ? "A publicar..." : "Publicar novamente"}
              </Button>
            </>
          }
        />
      )}
      <StatusCard
        variant="danger"
        showIcon
        description={
          <>
            <strong>Atenção, esta ação não pode ser corrigida.</strong>
            <br />
            <Button
              appearance="link"
              variant="primary"
              hasIcon
              trailingIcon="agora-line-arrow-right-circle"
              trailingIconHover="agora-solid-arrow-right-circle"
              onClick={onOpenDeletePopup}
              disabled={isSaving}
            >
              Eliminar o artigo
            </Button>
          </>
        }
      />
    </div>
  );
}
