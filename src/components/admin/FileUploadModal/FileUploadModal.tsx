"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button, InputText } from "@ama-pt/agora-design-system";
import DragAndDropUploader from "@/components/Primitives/DragAndDropUploader/DragAndDropUploader";
import { POISONED_FILE_WARNING } from "@/lib/security/translateUploadError";
import { validateFileExtensions } from "@/lib/files/validateFileExtensions";
import { FileUploadModalProps } from "./types";

export default function FileUploadModal({
  uploadedFiles,
  resourceUrls,
  onFilesChange,
  onUrlAdd,
  hasError,
  allowedExtensions = null,
}: FileUploadModalProps) {
  const hasSelection = uploadedFiles.length > 0 || resourceUrls.length > 0;
  const [localUrl, setLocalUrl] = useState("");
  const localUrlRef = useRef("");
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSelection) return;

    const frameId = requestAnimationFrame(() => {
      setUrlError(null);
    });

    return () => cancelAnimationFrame(frameId);
  }, [hasSelection]);
  const [extensionErrors, setExtensionErrors] = useState<string[]>([]);
  const [securityErrors, setSecurityErrors] = useState<string[]>([]);
  const [uploaderKey, setUploaderKey] = useState(0);

  const handleAddUrl = () => {
    const trimmedUrl = (localUrl || localUrlRef.current).trim();
    if (!trimmedUrl) {
      setUrlError("Insira um URL válido, começando com https://");
      return;
    }
    try {
      const parsed = new URL(trimmedUrl);
      if (parsed.protocol !== "https:") {
        setUrlError("Insira um URL válido, começando com https://");
        return;
      }
    } catch {
      setUrlError("Insira um URL válido, começando com https://");
      return;
    }
    onUrlAdd(trimmedUrl);
    setLocalUrl("");
    localUrlRef.current = "";
    setUrlError(null);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <InputText
          label="Link exato para o ficheiro"
          placeholder="https://"
          id="inline-resource-url"
          value={localUrl}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setLocalUrl(e.target.value);
            localUrlRef.current = e.target.value;
            setUrlError(null);
          }}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") handleAddUrl();
          }}
          hasError={!hasSelection && (!!urlError || hasError)}
          hasFeedback={!!urlError}
          feedbackState="danger"
          feedbackText={urlError ?? ""}
        />
        <div className="mt-12 w-fit [&_button]:mt-0">
          <Button
            variant="primary"
            appearance="outline"
            hasIcon
            leadingIcon="agora-line-plus-circle"
            leadingIconHover="agora-solid-plus-circle"
            onClick={handleAddUrl}
          >
            Adicionar
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 border-t border-neutral-300" />
        <span className="text-sm px-3 text-neutral-500">ou</span>
        <div className="flex-1 border-t border-neutral-300" />
      </div>

      <div className="[&_.drag-and-drop-area_.agora-btn]:w-fit [&_.instructions]:items-center [&_.instructions]:text-center">
        <DragAndDropUploader
          key={uploaderKey}
          multiple
          label="Ficheiros"
          dragAndDropLabel="Arraste e largue os ficheiros aqui"
          inputLabel="Selecione ou arraste os ficheiros"
          selectedFilesLabel="ficheiros selecionados"
          removeFileButtonLabel="Remover ficheiro"
          replaceFileButtonLabel="Substituir ficheiro"
          maxSizeExceededErrorLabel="O ficheiro excede o tamanho máximo permitido."
          forbiddenExtensionErrorLabel="Formato de ficheiro não permitido."
          hasError={
            securityErrors.length > 0 || extensionErrors.length > 0 || (hasError && !hasSelection)
          }
          hasFeedback={
            securityErrors.length > 0 || extensionErrors.length > 0 || (hasError && !hasSelection)
          }
          feedbackState="danger"
          feedbackText={
            securityErrors.length > 0
              ? "O ficheiro contém código malicioso ou scripts não autorizados que comprometem a segurança do sistema."
              : extensionErrors.length > 0
                ? extensionErrors.length === 1
                  ? `Tipo de ficheiro inválido. "${extensionErrors[0]}" não foi adicionado.`
                  : `Tipo de ficheiro inválido. Os seguintes ficheiros não foram adicionados: ${extensionErrors.join(", ")}`
                : hasError && !hasSelection
                  ? "Campo obrigatório"
                  : undefined
          }
          onChange={(e) => {
            const picked = Array.from((e.target as HTMLInputElement).files || []);
            if (picked.length === 0) return;
            const { valid, invalid } = validateFileExtensions(picked, allowedExtensions);
            setExtensionErrors(invalid);
            setSecurityErrors([]);
            const existingNames = new Set(uploadedFiles.map((f) => f.name));
            const uniqueNew = valid.filter((f) => !existingNames.has(f.name));
            if (uniqueNew.length > 0) onFilesChange([...uploadedFiles, ...uniqueNew]);
            setUploaderKey((k) => k + 1);
          }}
          onSecurityError={(rejections) =>
            setSecurityErrors(rejections.map(() => POISONED_FILE_WARNING))
          }
        />
      </div>
    </div>
  );
}
