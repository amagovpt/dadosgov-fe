"use client";

import React from "react";
import { Button } from "@ama-pt/agora-design-system";
import type { Post } from "@/service/types/posts";
import PostsEditDangerZone from "@/components/admin/posts/PostsEditDangerZone";
import PostMetadataSection from "@/components/admin/posts/PostMetadataSection";

interface PostsEditMetadataTabProps {
  post: Post;
  articleTitle: string;
  articleHeader: string;
  articleType: string;
  contentType: string;
  selectedTags: string[];
  keywordOptions: React.JSX.Element;
  selectedKeywordsRef: React.RefObject<string>;
  imageError: string | null;
  hasTitleError?: boolean;
  hasHeaderError?: boolean;
  isSaving: boolean;
  onTitleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onHeaderChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onArticleTypeChange: (value: string) => void;
  onContentTypeChange: (value: string) => void;
  onKeywordSearchChange: (value: string) => void;
  onKeywordsChange: (value: string) => void;
  onRemoveTag: (keyword: string) => void;
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImageSecurityError: () => void;
  onSaveMetadata: () => void;
  onUnpublish: () => void;
  onRepublish: () => void;
  onOpenDeletePopup: () => void;
}

export default function PostsEditMetadataTab({
  post,
  articleTitle,
  articleHeader,
  articleType,
  contentType,
  selectedTags,
  keywordOptions,
  selectedKeywordsRef,
  imageError,
  hasTitleError = false,
  hasHeaderError = false,
  isSaving,
  onTitleChange,
  onHeaderChange,
  onArticleTypeChange,
  onContentTypeChange,
  onKeywordSearchChange,
  onKeywordsChange,
  onRemoveTag,
  onImageChange,
  onImageSecurityError,
  onSaveMetadata,
  onUnpublish,
  onRepublish,
  onOpenDeletePopup,
}: PostsEditMetadataTabProps) {
  return (
    <div className="admin-page__body">
      <div className="admin-page__form-area">
        <form
          className="admin-page__form mt-24"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            onSaveMetadata();
          }}
        >
          <p className="text-neutral-900 text-base leading-7">
            Campos precedidos por uma estrela (*) são obrigatórios.
          </p>

          <PostMetadataSection
            title={articleTitle}
            header={articleHeader}
            articleType={articleType}
            contentType={contentType}
            selectedTags={selectedTags}
            keywordOptions={keywordOptions}
            selectedKeywordsRef={selectedKeywordsRef}
            imageError={imageError}
            previewSrc={post.image ?? undefined}
            hasTitleError={hasTitleError}
            hasHeaderError={hasHeaderError}
            contentTypeOptions={["html", "markdown", "blocks"]}
            sectionTitle="DESCRIÇÃO"
            sectionTitleClassName="admin-page__section-title mt-8"
            headerPlaceholder="Insira aqui"
            articleTypeLabel="Tipo de Item"
            pageLabel="Page"
            onTitleChange={onTitleChange}
            onHeaderChange={onHeaderChange}
            onArticleTypeChange={onArticleTypeChange}
            onContentTypeChange={onContentTypeChange}
            onKeywordSearchChange={onKeywordSearchChange}
            onKeywordsChange={onKeywordsChange}
            onRemoveTag={onRemoveTag}
            onImageChange={onImageChange}
            onImageSecurityError={onImageSecurityError}
          />

          <div className="admin-page__actions">
            <Button
              type="submit"
              variant="primary"
              hasIcon
              trailingIcon="agora-line-check-circle"
              trailingIconHover="agora-solid-check-circle"
              disabled={isSaving}
            >
              {isSaving ? "A guardar..." : "Guardar"}
            </Button>
          </div>
        </form>

        <PostsEditDangerZone
          isPublished={!!post.published}
          isSaving={isSaving}
          onUnpublish={onUnpublish}
          onRepublish={onRepublish}
          onOpenDeletePopup={onOpenDeletePopup}
        />
      </div>
    </div>
  );
}
