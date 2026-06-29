"use client";

import React, { useEffect, useState } from "react";
import { Button, Icon, usePopupContext } from "@ama-pt/agora-design-system";
import DragAndDropUploader from "@/components/Primitives/DragAndDropUploader/DragAndDropUploader";
import { fetchAllowedExtensions } from "@/service/api/datasets";
import { POISONED_FILE_WARNING } from "@/lib/security/translateUploadError";
import { validateFileExtensions } from "@/lib/files/validateFileExtensions";

interface FileUploadPopupContentProps {
  onConfirm: (files: File[]) => void;
  allowedExtensions?: string[] | null;
}

export default function FileUploadPopupContent({
  onConfirm,
  allowedExtensions: initialExtensions = null,
}: FileUploadPopupContentProps) {
  const { hide } = usePopupContext();
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [extensionErrors, setExtensionErrors] = useState<string[]>([]);
  const [securityErrors, setSecurityErrors] = useState<string[]>([]);
  const [allowedExtensions, setAllowedExtensions] = useState<string[] | null>(initialExtensions);

  useEffect(() => {
    if (allowedExtensions !== null) return;
    fetchAllowedExtensions().then((exts) => setAllowedExtensions(exts));
  }, [allowedExtensions]);

  const handleConfirm = () => {
    if (extensionErrors.length > 0 && pendingFiles.length === 0) {
      return;
    }
    onConfirm(pendingFiles);
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
              const { valid, invalid } = validateFileExtensions(picked, allowedExtensions);
              setExtensionErrors(invalid);
              setSecurityErrors([]);
              setPendingFiles((prev) => {
                const names = new Set(prev.map((f) => f.name));
                return [...prev, ...valid.filter((f) => !names.has(f.name))];
              });
            }}
            onSecurityError={(rejections) =>
              setSecurityErrors(rejections.map(() => POISONED_FILE_WARNING))
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
              O ficheiro contém código malicioso ou scripts não autorizados que comprometem a segurança do sistema.
            </p>
          </div>
        )}
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
