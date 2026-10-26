"use client";

import { useLayoutEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button, Dialog, StatusCard, type DialogElement } from "@ama-pt/agora-design-system";

interface AdminConfirmationDialogProps {
  title: string;
  description: ReactNode;
  cancelLabel: string;
  confirmLabel: string;
  confirmVariant?: "danger" | "warning";
  isBusy?: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function AdminConfirmationDialog({
  title,
  description,
  cancelLabel,
  confirmLabel,
  confirmVariant = "danger",
  isBusy = false,
  error,
  onClose,
  onConfirm,
}: AdminConfirmationDialogProps) {
  const id = useId();
  const dialogRef = useRef<DialogElement>(null);
  useLayoutEffect(() => {
    const trigger = document.activeElement;
    const ownDialog = dialogRef.current;
    // Keep scrolling locked when returning to a dialog underneath this confirmation.
    return () => {
      const anotherDialogOpen = Array.from(
        document.querySelectorAll(".agora-dialog:not(.closed)")
      ).some((dialog) => dialog !== ownDialog);
      document.body.classList.toggle("overflow-hidden", anotherDialogOpen);
      if (trigger instanceof HTMLElement && trigger.isConnected)
        requestAnimationFrame(() => {
          if (!ownDialog?.isConnected && trigger.isConnected) trigger.focus();
        });
    };
  }, []);

  return createPortal(
    <Dialog
      ref={dialogRef}
      visible
      dismissOnBackdropClick={!isBusy}
      dismissOnEscape={!isBusy}
      onHide={onClose}
      aria-busy={isBusy}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
    >
      <div className="z-dialog mt-64 h-fit max-h-[min(544px,calc(100dvh-96px))] w-[592px] max-w-[calc(100vw-32px)] space-y-16 overflow-y-auto rounded-16 bg-white p-24 text-neutral-900 shadow-bottom-high md:mt-128 md:max-h-[min(544px,calc(100dvh-160px))] md:p-32">
        <h2 id={`${id}-title`} className="text-xl-bold">
          {title}
        </h2>
        <div className="flex flex-col gap-32">
          {typeof description === "string" ? (
            <p id={`${id}-description`} className="text-m-regular">
              {description}
            </p>
          ) : (
            <div id={`${id}-description`} className="text-m-regular">
              {description}
            </div>
          )}
          {error && (
            <StatusCard variant="danger" showIcon description={<span role="alert">{error}</span>} />
          )}
          <div className="flex flex-wrap items-center justify-end gap-16 md:gap-32">
            <Button
              type="button"
              appearance="link"
              variant="neutral"
              className="h-[60px]! min-h-[60px]! py-[14px]!"
              data-autofocus="true"
              disabled={isBusy}
              onClick={onClose}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              appearance="solid"
              variant={confirmVariant}
              className="h-[60px]! min-h-[60px]! py-[14px]!"
              disabled={isBusy}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>,
    document.body
  );
}
