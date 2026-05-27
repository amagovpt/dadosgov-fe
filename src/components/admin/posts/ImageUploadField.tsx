"use client";

import React from "react";
import DragAndDropUploader from "@/components/Primitives/DragAndDropUploader/DragAndDropUploader";

interface ImageUploadFieldProps {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSecurityError: () => void;
  error: string | null;
  previewSrc?: string;
}

export function ImageUploadField({ onChange, onSecurityError, error, previewSrc }: ImageUploadFieldProps) {
  return (
    <div>
      <span className="text-primary-900 text-base font-medium leading-7">Imagem de capa</span>
      <div className="mt-2 [&_.instructions]:items-center [&_.instructions]:text-center [&_.drag-and-drop-area_.agora-btn]:w-fit">
        <DragAndDropUploader
          label="Ficheiros"
          dragAndDropLabel="Arraste e largue o ficheiro aqui"
          inputLabel="Selecione ou arraste o ficheiro"
          selectedFilesLabel="ficheiro selecionado"
          removeFileButtonLabel="Remover ficheiro"
          replaceFileButtonLabel="Substituir ficheiro"
          extensionsInstructions="Tamanho máximo: 4 MB. Formatos aceites: JPG, JPEG, PNG."
          accept=".jpg,.jpeg,.png"
          maxSize={4194304}
          maxCount={1}
          maxSizeExceededErrorLabel="O ficheiro excede o tamanho máximo de 4 MB."
          forbiddenExtensionErrorLabel="Formato de ficheiro não permitido."
          hasError={!!error}
          hasFeedback={!!error}
          feedbackState="danger"
          feedbackText={error ?? undefined}
          onChange={onChange}
          onSecurityError={onSecurityError}
        />
      </div>
      {previewSrc && (
        <div className="mt-4 flex justify-center">
          <img
            src={previewSrc}
            alt="Cobertura do artigo"
            className="max-w-[200px] max-h-[150px] object-contain border border-neutral-200 rounded"
          />
        </div>
      )}
    </div>
  );
}
