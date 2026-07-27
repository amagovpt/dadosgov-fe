"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import AdminStepActions from "@/components/admin/forms/AdminStepActions";
import PostContentSection from "@/components/admin/posts/form-sections/PostContentSection";

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
  const { t } = useTranslation("admin-posts");

  return (
    <form
      className="admin-page__form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onPublish();
      }}
    >
      <PostContentSection
        content={articleContent}
        hasError={hasContentError}
        onChange={onContentChange}
      />

      {saveError && <p className="mb-16 text-sm text-danger-600">{saveError}</p>}

      <AdminStepActions
        previousAction={{
          label: t("steps.previous"),
          appearance: "outline",
          variant: "primary",
          hasIcon: true,
          leadingIcon: "agora-line-arrow-left-circle",
          leadingIconHover: "agora-solid-arrow-left-circle",
          onClick: onPrevious,
        }}
        secondaryAction={{
          label: pendingAction === "draft" ? t("steps.savingDraft") : t("steps.saveDraft"),
          appearance: "outline",
          variant: "primary",
          hasIcon: true,
          trailingIcon: "agora-line-check-circle",
          trailingIconHover: "agora-solid-check-circle",
          onClick: onSaveDraft,
          disabled: isSaving,
        }}
        primaryAction={{
          label:
            pendingAction === "publish"
              ? t("steps.publishingArticle")
              : t("steps.publishArticle"),
          type: "submit",
          hasIcon: true,
          trailingIcon: "agora-line-check-circle",
          trailingIconHover: "agora-solid-check-circle",
          disabled: isSaving,
        }}
      />
    </form>
  );
}
