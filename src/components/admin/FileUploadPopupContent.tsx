"use client";

import React, { useState } from "react";
import { Button, DragAndDropUploader, InputText, usePopupContext } from "@ama-pt/agora-design-system";

interface FileUploadPopupContentProps {
  onConfirm: (files: File[], url: string) => void;
}

export default function FileUploadPopupContent({
  onConfirm,
}: FileUploadPopupContentProps) {
  const { hide } = usePopupContext();
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [localUrl, setLocalUrl] = useState("");

  const handleConfirm = () => {
    onConfirm(pendingFiles, localUrl);
    hide();
  };

  return (
    <div className="flex flex-col gap-6 p-2">
      <div className="[&_.download-icon]:hidden">
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
          setPendingFiles((prev) => {
            const names = new Set(prev.map((f) => f.name));
            return [...prev, ...picked.filter((f) => !names.has(f.name))];
          });
        }}
      />
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalUrl(e.target.value)}
          feedbackState="info"
          hasFeedback
          feedbackText="Insira um URL válido, começando com https://"
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
