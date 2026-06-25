"use client";

import React from "react";
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
  return (
    <div className="admin-page__fields-group">
      <InputTextArea
        label="Conteúdo *"
        placeholder="Insira aqui"
        id="article-content"
        rows={12}
        value={content}
        onChange={onChange}
        hasError={hasError}
        hasFeedback={hasError}
        feedbackState="danger"
        errorFeedbackText="Campo obrigatório"
      />
    </div>
  );
}
