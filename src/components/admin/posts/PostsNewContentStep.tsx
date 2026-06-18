"use client";

import React from "react";
import { Button } from "@ama-pt/agora-design-system";
import PostContentSection from "@/components/admin/posts/PostContentSection";

interface PostsNewContentStepProps {
  articleContent: string;
  hasContentError: boolean;
  saveError: string | null;
  isSaving: boolean;
  pendingAction: "draft" | "publish" | null;
  onContentChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onPrevious: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}

export default function PostsNewContentStep({
  articleContent,
  hasContentError,
  saveError,
  isSaving,
  pendingAction,
  onContentChange,
  onPrevious,
  onSaveDraft,
  onPublish,
}: PostsNewContentStepProps) {
  return (
    <form className="admin-page__form" onSubmit={(event) => event.preventDefault()}>
      <PostContentSection
        content={articleContent}
        hasError={hasContentError}
        onChange={onContentChange}
      />

      {saveError && <p className="mb-16 text-sm text-danger-600">{saveError}</p>}

      <div className="admin-page__actions">
        <Button
          appearance="outline"
          variant="primary"
          hasIcon
          leadingIcon="agora-line-arrow-left-circle"
          leadingIconHover="agora-solid-arrow-left-circle"
          onClick={onPrevious}
        >
          Anterior
        </Button>
        <Button
          appearance="outline"
          variant="primary"
          hasIcon
          trailingIcon="agora-line-check-circle"
          trailingIconHover="agora-solid-check-circle"
          onClick={onSaveDraft}
          disabled={isSaving}
        >
          {pendingAction === "draft" ? "A guardar..." : "Guardar como rascunho"}
        </Button>
        <Button
          variant="primary"
          hasIcon
          trailingIcon="agora-line-check-circle"
          trailingIconHover="agora-solid-check-circle"
          onClick={onPublish}
          disabled={isSaving}
        >
          {pendingAction === "publish" ? "A publicar..." : "Publicar artigo"}
        </Button>
      </div>
    </form>
  );
}
