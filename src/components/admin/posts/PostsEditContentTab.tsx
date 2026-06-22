"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Button } from "@ama-pt/agora-design-system";

const RichTextEditor = dynamic(() => import("./RichTextEditor"), {
  ssr: false,
  loading: () => <p>A carregar editor...</p>,
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
  return (
    <div className="admin-page__body">
      <div className="admin-page__form-area">
        <form className="admin-page__form mt-24">
          <div className="admin-page__fields-group">
            <div className="flex flex-col gap-8">
              <span className="text-primary-900 text-base font-medium leading-7">Conteúdo *</span>
              <RichTextEditor content={articleContent} onChange={onContentChange} />
              {hasContentError && <p className="text-sm text-danger-500">Campo obrigatório</p>}
            </div>
          </div>

          <div className="admin-page__actions">
            <Button
              variant="primary"
              hasIcon
              trailingIcon="agora-line-check-circle"
              trailingIconHover="agora-solid-check-circle"
              onClick={onSaveContent}
              disabled={isSaving}
            >
              {isSaving ? "A guardar..." : "Guardar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
