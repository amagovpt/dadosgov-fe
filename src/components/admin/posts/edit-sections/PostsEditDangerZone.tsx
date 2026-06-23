"use client";

import React from "react";
import AdminDangerActions from "@/components/admin/forms/AdminDangerActions";

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
  const primaryActionLabel = isSaving
    ? isPublished
      ? "A retirar..."
      : "A publicar..."
    : isPublished
      ? "Retirar"
      : "Publicar novamente";

  return (
    <AdminDangerActions
      primaryVariant={isPublished ? "warning" : "informative"}
      primaryHeading={isPublished ? "Retirar o artigo" : "Artigo despublicado"}
      primaryDescription={
        isPublished
          ? "Por favor, note que o item não será mais visível."
          : "Este artigo não está visível para o público."
      }
      primaryActionLabel={primaryActionLabel}
      onPrimaryAction={() => (isPublished ? onUnpublish() : onRepublish())}
      dangerHeading="Atenção, esta ação não pode ser corrigida."
      dangerActionLabel="Eliminar o artigo"
      onDangerAction={() => onOpenDeletePopup()}
      disabled={isSaving}
    />
  );
}
