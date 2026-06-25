"use client";

import React from "react";
import { InputText } from "@ama-pt/agora-design-system";
import DragAndDropUploader from "@/components/Primitives/DragAndDropUploader/DragAndDropUploader";

interface FileOrLinkSectionProps {
  file: File | null;
  fileError: string | null;
  resourceUrl: string;
  hasResourceUrlError: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSecurityError: () => void;
  onResourceUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function FileOrLinkSection({
  file,
  fileError,
  resourceUrl,
  hasResourceUrlError,
  onFileChange,
  onSecurityError,
  onResourceUrlChange,
}: FileOrLinkSectionProps) {
  return (
    <>
      <h2 className="admin-page__section-title">Ficheiro ou link</h2>

      <div className="admin-page__fields-group">
        <div className="[&_.drag-and-drop-area_.agora-btn]:w-fit [&_.instructions]:items-center [&_.instructions]:text-center">
          <DragAndDropUploader
            label="Ficheiros"
            dragAndDropLabel="Arraste e largue o ficheiro aqui"
            inputLabel="Selecione ou arraste o ficheiro"
            selectedFilesLabel="ficheiro selecionado"
            removeFileButtonLabel="Remover ficheiro"
            replaceFileButtonLabel="Substituir ficheiro"
            extensionsInstructions="Tamanho máximo: 420 MB."
            maxSize={440401920}
            maxCount={1}
            maxSizeExceededErrorLabel="O ficheiro excede o tamanho máximo de 420 MB."
            forbiddenExtensionErrorLabel="Formato de ficheiro não permitido."
            hasError={!!fileError}
            hasFeedback={!!fileError}
            feedbackState="danger"
            feedbackText={fileError ?? undefined}
            onChange={onFileChange}
            onSecurityError={onSecurityError}
          />
        </div>

        <div className="admin-page__divider-or">
          <span className="admin-page__divider-or-text">ou</span>
        </div>

        <InputText
          label={file ? "Link exato para o ficheiro" : "Link exato para o ficheiro *"}
          placeholder="https://..."
          id="resource-url"
          value={resourceUrl}
          onChange={onResourceUrlChange}
          hasError={hasResourceUrlError}
          hasFeedback={hasResourceUrlError}
          feedbackState="danger"
          errorFeedbackText="Forneça um ficheiro ou um link."
        />
      </div>
    </>
  );
}
