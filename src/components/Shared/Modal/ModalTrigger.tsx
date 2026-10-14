"use client";
import { ReactNode, KeyboardEvent, MouseEvent, useRef, useEffect } from "react";
import { ModalConfiguration, useModalContext } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";

export default function ModalTrigger({
  children,
  content,
  modalConfig,
  className,
}: {
  children?: ReactNode;
  content: ReactNode;
  modalConfig?: Partial<ModalConfiguration>;
  className?: string;
}) {
  const { show, isVisible } = useModalContext();
  const { t } = useTranslation();

  const previousFocus = useRef<HTMLElement | null>(null);
  const visible = isVisible();

  useEffect(() => {
    if (visible) {
      previousFocus.current = document.activeElement as HTMLElement;
    } else if (previousFocus.current) {
      previousFocus.current.focus();
      previousFocus.current = null;
    }
  }, [visible]);

  const handleOpen = () => {
    show(content, {
      closeButtonLabel: t("close"),
      className: "modal",
      ...modalConfig,
    });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      handleOpen();
    }
  };

  const onClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleOpen();
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      tabIndex={0}
      aria-haspopup="dialog"
      className={className}
    >
      {children}
    </div>
  );
}