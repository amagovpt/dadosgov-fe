"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import dynamic from "next/dynamic";
import { Button } from "@ama-pt/agora-design-system";

function LoadingEditorFallback() {
  const { t } = useTranslation("admin-posts");
  return <p>{t("edit.loadingEditor")}</p>;
}

const RichTextEditor = dynamic(() => import("@/components/admin/posts/form-ui/RichTextEditor"), {
  ssr: false,
  loading: () => <LoadingEditorFallback />,
});

interface PostsEditContentTabProps {
  articleContent: string;
  hasContentError?: boolean;
  isSaving: boolean;
  onContentChange: (html: string) => void;
  onSaveContent: () => void;
}

export default function PostsEditContentTab({
  articleContent,
  hasContentError = false,
  isSaving,
  onContentChange,
  onSaveContent,
}: PostsEditContentTabProps) {
  const { t } = useTranslation(["admin-common", "admin-posts"]);

  return (
    <div className="admin-page__body">
      <div className="admin-page__form-area">
        <form
          className="admin-page__form mt-24"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            onSaveContent();
          }}
        >
          <div className="admin-page__fields-group">
            <div className="flex flex-col gap-8">
              <span className="text-primary-900 text-base font-medium leading-7">
                {t("admin-posts:contentForm.label")}
              </span>
              <RichTextEditor content={articleContent} onChange={onContentChange} />
              {hasContentError && (
                <p className="text-sm text-danger-500">{t("admin-common:forms.requiredField")}</p>
              )}
            </div>
          </div>

          <div className="admin-page__actions">
            <Button
              type="submit"
              variant="primary"
              hasIcon
              trailingIcon="agora-line-check-circle"
              trailingIconHover="agora-solid-check-circle"
              disabled={isSaving}
            >
              {isSaving ? t("admin-common:actions.saving") : t("admin-common:actions.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
