"use client";

import React, { useEffect, useState } from "react";
import { Button, Icon, InputText, usePopupContext } from "@ama-pt/agora-design-system";
import DragAndDropUploader from "@/components/Primitives/DragAndDropUploader/DragAndDropUploader";
import { fetchAllowedExtensions } from "@/services/api";

interface FileUploadPopupContentProps {
  onConfirm: (files: File[], url: string) => void;
  allowedExtensions?: string[] | null;
}

export default function FileUploadPopupContent({
  onConfirm,
  allowedExtensions: initialExtensions = null,
}: FileUploadPopupContentProps) {
  const { hide } = usePopupContext();
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [localUrl, setLocalUrl] = useState("");
  const [urlError, setUrlError] = useState(false);
  const [extensionErrors, setExtensionErrors] = useState<string[]>([]);
  const [securityErrors, setSecurityErrors] = useState<string[]>([]);
  const [allowedExtensions, setAllowedExtensions] = useState<string[] | null>(initialExtensions);

  useEffect(() => {
    if (allowedExtensions !== null) return;
    fetchAllowedExtensions().then((exts) => setAllowedExtensions(exts));
  }, []);

  const isValidUrl = (url: string) => {
    try {
      return new URL(url).protocol === "https:";
    } catch {
      return false;
    }
  };

  const getExtension = (filename: string) =>
    filename.includes(".") ? filename.split(".").pop()!.toLowerCase() : "";

  const validateFiles = (files: File[]): { valid: File[]; invalid: string[] } => {
    if (!allowedExtensions || allowedExtensions.length === 0) return { valid: files, invalid: [] };
    const allowed = allowedExtensions.map((e) => e.toLowerCase());
    const valid: File[] = [];
    const invalid: string[] = [];
    for (const file of files) {
      const ext = getExtension(file.name);
      if (!ext || !allowed.includes(ext)) {
        invalid.push(file.name);
      } else {
        valid.push(file);
      }
    }
    return { valid, invalid };
  };

  const handleConfirm = () => {
    if (extensionErrors.length > 0 && pendingFiles.length === 0 && !localUrl.trim()) {
      return;
    }
    if (localUrl && !isValidUrl(localUrl)) {
      setUrlError(true);
      return;
    }
    onConfirm(pendingFiles, localUrl);
    hide();
  };

  return (
    <div className="flex flex-col gap-6 p-2">
      <div className="flex flex-col gap-1">
        <div className="[&_.download-icon]:hidden [&_.instructions]:items-center [&_.instructions]:text-center [&_.drag-and-drop-area_.agora-btn]:w-fit">
          <DragAndDropUploader
            multiple
            label="Ficheiros"
            inputLabel="Selecione ou arraste os ficheiros"
            selectedFilesLabel="ficheiros selecionados"
            removeFileButtonLabel="Remover ficheiro"
            replaceFileButtonLabel="Substituir ficheiro"
            files={pendingFiles}
            onChange={(e) => {
              const picked = Array.from((e.target as HTMLInputElement).files || []);
              if (picked.length === 0) return;
              const { valid, invalid } = validateFiles(picked);
              setExtensionErrors(invalid);
              setSecurityErrors([]);
              setPendingFiles((prev) => {
                const names = new Set(prev.map((f) => f.name));
                return [...prev, ...valid.filter((f) => !names.has(f.name))];
              });
            }}
            onSecurityError={(rejections) =>
              setSecurityErrors(rejections.map((r) => `${r.file.name}: ${r.reason}`))
            }
          />
        </div>
        {extensionErrors.length > 0 && (
          <div className="feedback">
            <span className="feedback-icon-wrapper feedback-icon-wrapper-danger">
              <Icon name="agora-solid-alert-triangle" dimensions="s" aria-hidden={true} />
            </span>
            <p className="feedback-text feedback-text-light">
              Tipo de ficheiro inválido.{" "}
              {extensionErrors.length === 1
                ? `"${extensionErrors[0]}" não foi adicionado.`
                : `Os seguintes ficheiros não foram adicionados: ${extensionErrors.join(", ")}`}
            </p>
          </div>
        )}
        {securityErrors.length > 0 && (
          <div className="feedback">
            <span className="feedback-icon-wrapper feedback-icon-wrapper-danger">
              <Icon name="agora-solid-alert-triangle" dimensions="s" aria-hidden={true} />
            </span>
            <p className="feedback-text feedback-text-light">
              Ficheiro bloqueado por segurança:{" "}
              {securityErrors.join("; ")}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 border-t border-neutral-300" />
        <span className="text-neutral-500 text-sm px-3">ou</span>
        <div className="flex-1 border-t border-neutral-300" />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-primary-900 font-semibold text-sm">Adicionar um link</h2>
        <InputText
          label="Link exato para o ficheiro"
          placeholder="https://"
          id="modal-resource-url"
          value={localUrl}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setLocalUrl(e.target.value);
            setUrlError(false);
          }}
          hasError={urlError}
          errorFeedbackText="Insira um URL válido, começando com https://"
          {...(!urlError && {
            feedbackState: "info",
            hasFeedback: true,
            feedbackText: "Insira um URL válido, começando com https://",
          })}
        />
      </div>

      <div className="flex justify-end gap-[18px]">
        <Button appearance="outline" variant="neutral" onClick={hide}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleConfirm}>
          Confirmar
        </Button>
      </div>
    </div>
  );
}
