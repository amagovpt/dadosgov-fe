"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("admin-common");
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
            label={t("fileUpload.files.label")}
            inputLabel={t("fileUpload.files.selectOrDrag")}
            selectedFilesLabel={t("fileUpload.files.selectedFiles")}
            removeFileButtonLabel={t("fileUpload.files.removeFile")}
            replaceFileButtonLabel={t("fileUpload.files.replaceFile")}
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
              {extensionErrors.length === 1
                ? t("fileUpload.files.invalidSingle", { name: extensionErrors[0] })
                : t("fileUpload.files.invalidMultiple", {
                    names: extensionErrors.join(", "),
                  })}
            </p>
          </div>
        )}
        {securityErrors.length > 0 && (
          <div className="feedback">
            <span className="feedback-icon-wrapper feedback-icon-wrapper-danger">
              <Icon name="agora-solid-alert-triangle" dimensions="s" aria-hidden={true} />
            </span>
            <p className="feedback-text feedback-text-light">
              {t("fileUpload.files.securityError")}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-[18px]">
        <Button appearance="outline" variant="neutral" onClick={hide}>
          {t("actions.cancel")}
        </Button>
        <Button variant="primary" onClick={handleConfirm}>
          {t("fileUpload.actions.confirm")}
        </Button>
      </div>
    </div>
  );
}
