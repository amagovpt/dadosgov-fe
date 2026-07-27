"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { InputTextArea } from "@ama-pt/agora-design-system";

interface PostContentSectionProps {
  content: string;
  hasError?: boolean;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export default function PostContentSection({
  content,
  hasError = false,
  onChange,
}: PostContentSectionProps) {
  const { t } = useTranslation(["admin-common", "admin-posts"]);

  return (
    <div className="admin-page__fields-group">
      <InputTextArea
        label={t("admin-posts:contentForm.label")}
        placeholder={t("admin-posts:contentForm.placeholder")}
        id="article-content"
        rows={12}
        value={content}
        onChange={onChange}
        hasError={hasError}
        hasFeedback={hasError}
        feedbackState="danger"
        errorFeedbackText={t("admin-common:forms.requiredField")}
      />
    </div>
  );
}
