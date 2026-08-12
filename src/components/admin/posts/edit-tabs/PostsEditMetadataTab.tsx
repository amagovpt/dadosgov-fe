"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@ama-pt/agora-design-system";
import type { Post } from "@/service/types/posts";
import PostsEditDangerZone from "@/components/admin/posts/edit-sections/PostsEditDangerZone";
import PostMetadataSection from "@/components/admin/posts/form-sections/PostMetadataSection";
import type { AdminCard } from "@/service/types/admin/common";

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
  unpublishCard?: AdminCard;
  republishCard?: AdminCard;
  deleteCard?: AdminCard;
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
  unpublishCard,
  republishCard,
  deleteCard,
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
  const { t } = useTranslation(["admin-common", "admin-posts"]);

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
            {t("admin-posts:metadataForm.requiredInfoAlt")}
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
            sectionTitle={t("admin-posts:metadataForm.sectionTitleUpper")}
            sectionTitleClassName="admin-page__section-title mt-8"
            headerPlaceholder={t("admin-posts:metadataForm.headerPlaceholderShort")}
            articleTypeLabel={t("admin-posts:metadataForm.itemType")}
            pageLabel={t("admin-posts:list.page")}
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
              {isSaving ? t("admin-common:actions.saving") : t("admin-common:actions.save")}
            </Button>
          </div>
        </form>

        <PostsEditDangerZone
          isPublished={!!post.published}
          isSaving={isSaving}
          unpublishCard={unpublishCard}
          republishCard={republishCard}
          deleteCard={deleteCard}
          onUnpublish={onUnpublish}
          onRepublish={onRepublish}
          onOpenDeletePopup={onOpenDeletePopup}
        />
      </div>
    </div>
  );
}
