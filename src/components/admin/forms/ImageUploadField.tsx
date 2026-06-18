"use client";

import React from "react";
import DragAndDropUploader from "@/components/Primitives/DragAndDropUploader/DragAndDropUploader";

interface ImageUploadFieldProps {
  label?: string;
  required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSecurityError: () => void;
  error?: string | null;
  previewSrc?: string;
  previewAlt?: string;
  previewPlacement?: "before" | "after";
  previewWrapperClassName?: string;
  previewImageClassName?: string;
  files?: File[];
  dragAndDropLabel?: string;
  inputLabel?: string;
}

export default function ImageUploadField({
  label = "Imagem de capa",
  required = false,
  onChange,
  onSecurityError,
  error = null,
  previewSrc,
  previewAlt = "Imagem de capa",
  previewPlacement = "after",
  previewWrapperClassName = "mt-4 flex justify-center",
  previewImageClassName = "max-w-[200px] max-h-[150px] object-contain border border-neutral-200 rounded",
  files,
  dragAndDropLabel = "Arraste e largue o ficheiro aqui",
  inputLabel = "Selecione ou arraste o ficheiro",
}: ImageUploadFieldProps) {
  const preview = previewSrc ? (
    <div className={previewWrapperClassName}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={previewSrc} alt={previewAlt} className={previewImageClassName} />
    </div>
  ) : null;

  return (
    <div>
      <span className="text-primary-900 text-base font-medium leading-7">
        {label}
        {required ? " *" : ""}
      </span>
      {previewPlacement === "before" ? preview : null}
      <div className="mt-2 [&_.instructions]:items-center [&_.instructions]:text-center [&_.drag-and-drop-area_.agora-btn]:w-fit">
        <DragAndDropUploader
          label="Ficheiros"
          dragAndDropLabel={dragAndDropLabel}
          inputLabel={inputLabel}
          selectedFilesLabel="ficheiro selecionado"
          removeFileButtonLabel="Remover ficheiro"
          replaceFileButtonLabel="Substituir ficheiro"
          extensionsInstructions="Tamanho máximo: 4 MB. Formatos aceites: JPG, JPEG, PNG."
          accept=".jpg,.jpeg,.png"
          maxSize={4194304}
          maxCount={1}
          maxSizeExceededErrorLabel="O ficheiro excede o tamanho máximo de 4 MB."
          forbiddenExtensionErrorLabel="Formato de ficheiro não permitido."
          files={files}
          hasError={!!error}
          hasFeedback={!!error}
          feedbackState="danger"
          feedbackText={error ?? undefined}
          onChange={onChange}
          onSecurityError={onSecurityError}
        />
      </div>
      {previewPlacement === "after" ? preview : null}
    </div>
  );
}
