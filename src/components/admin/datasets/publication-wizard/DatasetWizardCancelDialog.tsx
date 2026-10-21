"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Button, Dialog, type DialogElement } from "@ama-pt/agora-design-system";

interface DatasetWizardCancelDialogProps {
  variant?: "creation" | "resource";
  onClose: () => void;
  onConfirm: () => void;
}

export function DatasetWizardCancelDialog({
  variant = "creation",
  onClose,
  onConfirm,
}: DatasetWizardCancelDialogProps) {
  const { t } = useTranslation("admin-datasets");
  const id = useId();
  const dialogRef = useRef<DialogElement>(null);
  const translationKey = variant === "resource" ? "resourceEditor.cancel" : "cancelCreation";

  useEffect(() => {
    const ownDialog = dialogRef.current;
    // Keep scrolling locked when returning to a dialog underneath this confirmation.
    return () => {
      const anotherDialogOpen = Array.from(
        document.querySelectorAll(".agora-dialog:not(.closed)")
      ).some((dialog) => dialog !== ownDialog);
      document.body.classList.toggle("overflow-hidden", anotherDialogOpen);
    };
  }, []);

  return createPortal(
    <Dialog
      ref={dialogRef}
      visible
      dismissOnBackdropClick
      dismissOnEscape
      onHide={onClose}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
    >
      <div className="relative z-dialog mt-64 flex h-fit max-h-[calc(100dvh-128px)] w-[592px] max-w-[calc(100vw-32px)] flex-col gap-16 overflow-y-auto rounded-16 bg-white p-24 text-neutral-900 shadow-bottom-high md:mt-128 md:max-h-[calc(100dvh-256px)] md:p-32">
        <h2 id={`${id}-title`} className="text-xl-bold">
          {t(`${translationKey}.title`)}
        </h2>
        <div className="flex flex-col gap-32">
          <p id={`${id}-description`} className="text-m-regular">
            {t(`${translationKey}.description`)}
          </p>
          <div className="flex flex-wrap items-center justify-end gap-16 md:gap-32">
            <Button
              type="button"
              appearance="link"
              variant="neutral"
              className="h-[60px]! min-h-[60px]! py-[14px]!"
              data-autofocus="true"
              onClick={onClose}
            >
              {t(`${translationKey}.back`)}
            </Button>
            <Button
              type="button"
              appearance="solid"
              variant="danger"
              className="h-[60px]! min-h-[60px]! py-[14px]!"
              onClick={onConfirm}
            >
              {t(`${translationKey}.confirm`)}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>,
    document.body
  );
}
