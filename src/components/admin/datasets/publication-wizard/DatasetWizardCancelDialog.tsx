"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Button, Dialog } from "@ama-pt/agora-design-system";

interface DatasetWizardCancelDialogProps {
  onClose: () => void;
  onConfirm: () => void;
}

export function DatasetWizardCancelDialog({ onClose, onConfirm }: DatasetWizardCancelDialogProps) {
  const { t } = useTranslation("admin-datasets");
  const id = useId();

  useEffect(() => {
    // Agora locks body scrolling when opening, but does not release it on unmount.
    return () => document.body.classList.remove("overflow-hidden");
  }, []);

  return createPortal(
    <Dialog
      visible
      dismissOnBackdropClick
      dismissOnEscape
      onHide={onClose}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
    >
      <div className="relative z-dialog mt-64 flex h-fit max-h-[calc(100dvh-128px)] w-[592px] max-w-[calc(100vw-32px)] flex-col gap-16 overflow-y-auto rounded-16 bg-white p-24 text-neutral-900 shadow-bottom-high md:mt-128 md:max-h-[calc(100dvh-256px)] md:p-32">
        <h2 id={`${id}-title`} className="text-xl-bold">
          {t("cancelCreation.title")}
        </h2>
        <div className="flex flex-col gap-32">
          <p id={`${id}-description`} className="text-m-regular">
            {t("cancelCreation.description")}
          </p>
          <div className="flex flex-wrap items-center justify-end gap-16 md:gap-32">
            <Button
              type="button"
              appearance="link"
              variant="neutral"
              className="min-h-[60px]!"
              data-autofocus="true"
              onClick={onClose}
            >
              {t("cancelCreation.back")}
            </Button>
            <Button
              type="button"
              appearance="solid"
              variant="danger"
              className="min-h-[60px]!"
              onClick={onConfirm}
            >
              {t("cancelCreation.confirm")}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>,
    document.body
  );
}
