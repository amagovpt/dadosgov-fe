"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Button, Dialog } from "@ama-pt/agora-design-system";
import { DatasetWizardCancelDialog } from "@/components/admin/datasets/publication-wizard/DatasetWizardCancelDialog";
import {
  ResourceEditPendingPopupContent,
  type ResourceEditPendingPopupContentProps,
} from "./ResourceEditPendingPopupContent";

export interface PendingResourceEditorDialogProps extends Omit<
  ResourceEditPendingPopupContentProps,
  "onClose" | "onSaved"
> {
  onClose: () => void;
  onDiscard?: () => void;
}

export function PendingResourceEditorDialog({
  onClose,
  onDiscard,
  ...resource
}: PendingResourceEditorDialogProps) {
  const { t } = useTranslation("admin-datasets");
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const closeTrigger = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Agora's Dialog does not release its scroll lock when unmounted.
    return () => document.body.classList.remove("overflow-hidden");
  }, []);

  function requestClose() {
    if (isSaving) return;
    closeTrigger.current = document.activeElement as HTMLElement;
    setConfirmingClose(true);
  }

  return createPortal(
    <>
      <Dialog
        visible
        fullScreen
        dismissOnEscape={false}
        aria-label={t("resourceEditor.title")}
        inert={confirmingClose}
        onKeyDownCapture={(event) => {
          if (event.key === "Escape" && !confirmingClose) {
            event.preventDefault();
            event.stopPropagation();
            requestClose();
          }
        }}
      >
        <div className="h-full w-full overflow-y-auto bg-white text-neutral-900 [&_.agora-btn]:min-h-[60px]! [&_.input-label-wrapper]:mb-8">
          <div className="mx-auto flex min-h-full w-full max-w-[1440px] flex-col">
            <div className="flex h-[76px] shrink-0 items-start justify-end px-16 pt-16">
              <Button
                type="button"
                appearance="link"
                variant="neutral"
                hasIcon
                trailingIcon="agora-line-x"
                trailingIconHover="agora-solid-x"
                disabled={isSaving}
                onClick={requestClose}
              >
                {t("edit.closeAriaLabel")}
              </Button>
            </div>
            <div className="px-24 py-32 md:px-32 md:py-64">
              <div className="mx-auto w-full max-w-[800px]">
                <ResourceEditPendingPopupContent
                  {...resource}
                  onClose={requestClose}
                  onSaved={onClose}
                  onSavingChange={setIsSaving}
                />
              </div>
            </div>
          </div>
        </div>
      </Dialog>
      {confirmingClose && (
        <DatasetWizardCancelDialog
          variant={onDiscard ? "resource" : "resourceEdit"}
          onClose={() => {
            setConfirmingClose(false);
            requestAnimationFrame(() => closeTrigger.current?.focus());
          }}
          onConfirm={() => {
            onDiscard?.();
            onClose();
          }}
        />
      )}
    </>,
    document.body
  );
}
