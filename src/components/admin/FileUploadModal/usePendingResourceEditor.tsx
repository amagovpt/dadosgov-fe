"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useModalContext } from "@ama-pt/agora-design-system";
import {
  ResourceEditPendingPopupContent,
  type ResourceEditPendingPopupContentProps,
} from "./ResourceEditPendingPopupContent";

type EditorRequest = Omit<ResourceEditPendingPopupContentProps, "onClose">;

export function usePendingResourceEditor() {
  const { t } = useTranslation("admin-datasets");
  const { show, hide } = useModalContext();
  const queue = useRef<EditorRequest[]>([]);
  const active = useRef(false);
  const session = useRef(0);
  const mounted = useRef(true);
  const trigger = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      queue.current = [];
    };
  }, []);

  function showNext() {
    if (!mounted.current || active.current) return;
    const request = queue.current.shift();
    if (!request) {
      trigger.current?.focus();
      return;
    }
    active.current = true;
    show(
      <ResourceEditPendingPopupContent
        {...request}
        sessionKey={++session.current}
        onClose={hide}
      />,
      {
        closeButtonLabel: t("edit.closeAriaLabel"),
        darkMode: false,
        "aria-label": t("resourceEditor.title"),
        className: [
          "bg-white! text-neutral-900 overflow-y-auto",
          "[&_.agora-modal-dialog]:mx-auto [&_.agora-modal-dialog]:h-auto! [&_.agora-modal-dialog]:min-h-full [&_.agora-modal-dialog]:max-w-[1440px]",
          "[&_.agora-modal-dialog-header]:h-[76px]! [&_.agora-modal-dialog-header]:px-16 [&_.agora-modal-dialog-header]:pt-16 [&_.agora-modal-dialog-header>button]:m-0!",
          "[&_.agora-modal-dialog-body]:mb-0! [&_.agora-modal-dialog-body]:max-h-none! [&_.agora-modal-dialog-body]:overflow-visible! [&_.agora-modal-dialog-body]:px-24! [&_.agora-modal-dialog-body]:py-32! md:[&_.agora-modal-dialog-body]:px-32! md:[&_.agora-modal-dialog-body]:py-64!",
          "[&_.agora-modal-dialog-body-content]:mx-auto [&_.agora-modal-dialog-body-content]:max-h-none! [&_.agora-modal-dialog-body-content]:w-full [&_.agora-modal-dialog-body-content]:max-w-[800px]! [&_.agora-modal-dialog-body-content]:overflow-visible! [&_.agora-modal-dialog-body-content]:p-0!",
          "[&_.agora-btn]:min-h-[60px]! [&_.input-label-wrapper]:mb-8",
        ].join(" "),
        onHide: () => {
          active.current = false;
          setTimeout(showNext, 0);
        },
      }
    );
  }

  return (requests: EditorRequest[]) => {
    if (!requests.length) return;
    if (!active.current) trigger.current = document.activeElement as HTMLElement;
    queue.current.push(...requests);
    showNext();
  };
}
