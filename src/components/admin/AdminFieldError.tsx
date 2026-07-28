"use client";

import { Icon } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";

interface AdminFieldErrorProps {
  message?: string;
  className?: string;
}

export default function AdminFieldError({
  message,
  className,
}: AdminFieldErrorProps) {
  const { t } = useTranslation("admin-common");

  return (
    <div className={className ?? "feedback"}>
      <span className="feedback-icon-wrapper feedback-icon-wrapper-danger">
        <Icon name="agora-solid-alert-triangle" dimensions="s" aria-hidden={true} />
      </span>
      <p className="feedback-text feedback-text-light">{message ?? t("forms.requiredField")}</p>
    </div>
  );
}
