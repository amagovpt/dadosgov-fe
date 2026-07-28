"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import type { JSX } from "react";
import AdminStepActions from "@/components/admin/forms/AdminStepActions";
import PostMetadataSection from "@/components/admin/posts/form-sections/PostMetadataSection";

interface PostsNewMetadataStepProps {
  articleTitle: string;
  articleHeader: string;
  articleType: string;
  contentType: string;
  selectedTags: string[];
  keywordOptions: JSX.Element;
  selectedKeywordsRef: React.RefObject<string>;
  imageError: string | null;
  previewSrc?: string;
  hasTitleError: boolean;
  hasHeaderError: boolean;
  onTitleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onHeaderChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onArticleTypeChange: (value: string) => void;
  onContentTypeChange: (value: string) => void;
  onKeywordSearchChange: (value: string) => void;
  onKeywordsChange: (value: string) => void;
  onRemoveTag: (tag: string) => void;
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImageSecurityError: () => void;
  onNext: () => void;
}

export default function PostsNewMetadataStep({
  articleTitle,
  articleHeader,
  articleType,
  contentType,
  selectedTags,
  keywordOptions,
  selectedKeywordsRef,
  imageError,
  previewSrc,
  hasTitleError,
  hasHeaderError,
  onTitleChange,
  onHeaderChange,
  onArticleTypeChange,
  onContentTypeChange,
  onKeywordSearchChange,
  onKeywordsChange,
  onRemoveTag,
  onImageChange,
  onImageSecurityError,
  onNext,
}: PostsNewMetadataStepProps) {
  const { t } = useTranslation("admin-posts");

  return (
    <form
      className="admin-page__form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onNext();
      }}
    >
      <p className="pt-32 text-base leading-7 text-neutral-900">
        {t("metadataForm.requiredInfo")}
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
        previewSrc={previewSrc}
        hasTitleError={hasTitleError}
        hasHeaderError={hasHeaderError}
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

      <AdminStepActions
        primaryAction={{
          label: t("steps.next"),
          type: "submit",
          hasIcon: true,
          trailingIcon: "agora-line-arrow-right-circle",
          trailingIconHover: "agora-solid-arrow-right-circle",
        }}
      />
    </form>
  );
}
